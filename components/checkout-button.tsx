"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentSuccessData {
    orderId: string;
    paymentId: string;
    amount: number;       // paise
    currency: string;
    status: string;
    userEmail: string;
    userName: string;
    description?: string;
    paidAt: string;
}

export interface CheckoutButtonProps {
    /** Amount in rupees (e.g. 499 for ₹499). Converted to paise internally. */
    amount: number;
    currency?: string;
    description?: string;
    /** Shown inside the Razorpay modal header */
    productName?: string;
    notes?: Record<string, string>;
    onSuccess?: (data: PaymentSuccessData) => void;
    onError?: (message: string) => void;
    /** Dismiss/cancel callback (user closed modal without paying) */
    onDismiss?: () => void;
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

// ─── Razorpay window type ─────────────────────────────────────────────────────

declare global {
    interface Window {
        Razorpay: any;
    }
}

// ─── Script loader helper ─────────────────────────────────────────────────────

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window.Razorpay !== "undefined") {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutButton({
    amount,
    currency = "INR",
    description = "",
    productName = "Payment",
    notes = {},
    onSuccess,
    onError,
    onDismiss,
    children,
    className = "",
    disabled = false,
}: CheckoutButtonProps) {
    const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
    const [loading, setLoading] = useState(false);
    const razorpayRef = useRef<any>(null);

    // Preload script on mount for faster UX
    useEffect(() => {
        loadRazorpayScript();
    }, []);

    const handlePay = useCallback(async () => {
        if (loading) return;
        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) {
                toastError("You must be logged in to make a payment.");
                onError?.("Not authenticated");
                return;
            }

            // 1. Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toastError("Failed to load payment gateway. Please check your connection.");
                onError?.("Razorpay script failed to load");
                return;
            }

            // 2. Create order on server
            const orderRes = await fetch("/api/v1/private/checkout/create-order", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ amount, currency, description, notes }),
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok || !orderData.success) {
                const msg = orderData.message || "Failed to create order";
                toastError(msg);
                onError?.(msg);
                return;
            }

            const { orderId, keyId, amount: amountPaise, userEmail, userName } = orderData.data;

            // 3. Open Razorpay checkout modal
            const options = {
                key: keyId,
                amount: amountPaise,
                currency,
                name: productName,
                description,
                order_id: orderId,
                prefill: {
                    name: userName,
                    email: userEmail,
                },
                notes,
                theme: { color: "#4F46E5" },

                handler: async (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
                    // 4. Verify payment on server
                    try {
                        const verifyRes = await fetch("/api/v1/private/checkout/verify-payment", {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                            }),
                        });

                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok || !verifyData.success) {
                            const msg = verifyData.message || "Payment verification failed";
                            toastError(msg);
                            onError?.(msg);
                            return;
                        }

                        toastSuccess("Payment successful! Thank you.");
                        onSuccess?.(verifyData.data as PaymentSuccessData);
                    } catch {
                        toastError("Payment verification failed. Please contact support.");
                        onError?.("Verification network error");
                    }
                },

                modal: {
                    ondismiss: () => {
                        toastInfo("Payment cancelled.");
                        onDismiss?.();
                    },
                },
            };

            razorpayRef.current = new window.Razorpay(options);
            razorpayRef.current.on("payment.failed", (resp: any) => {
                const msg = resp?.error?.description || "Payment failed";
                toastError(msg);
                onError?.(msg);
            });
            razorpayRef.current.open();
        } catch (err: any) {
            toastError("Something went wrong. Please try again.");
            onError?.(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [loading, amount, currency, description, productName, notes, onSuccess, onError, onDismiss, toastSuccess, toastError, toastInfo]);

    return (
        <button
            type="button"
            onClick={handlePay}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        >
            {loading ? (
                <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Processing…
                </>
            ) : (
                children ?? `Pay ₹${amount.toLocaleString("en-IN")}`
            )}
        </button>
    );
}
