import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { decrypt } from "@/app/configs/crypto.config";
import RazorpayConfig from "@/models/Rozarpay";
import PaymentOrder from "@/models/PaymentOrder";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

/**
 * POST /api/v1/private/checkout/create-order
 *
 * Body: { amount: number (rupees), currency?: string, description?: string, notes?: Record<string,string> }
 * Returns: { orderId, keyId, amount (paise), currency, description }
 */
export const POST = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const body = await req.json();
            const { amount, currency = "INR", description = "", notes = {} } = body;

            if (!amount || typeof amount !== "number" || amount <= 0) {
                return NextResponse.json(
                    { success: false, message: "amount is required and must be a positive number (in rupees)" },
                    { status: 400 }
                );
            }

            // Fetch active Razorpay config from DB
            const config = await RazorpayConfig.findOne({ isActive: true });
            if (!config) {
                return NextResponse.json(
                    { success: false, message: "No active Razorpay configuration found. Please configure Razorpay first." },
                    { status: 503 }
                );
            }

            const keyId = decrypt(config.keyId);
            const keySecret = decrypt(config.keySecret);
            const amountInPaise = Math.round(amount * 100);

            // Create order via Razorpay REST API
            const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
            const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${credentials}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: amountInPaise,
                    currency,
                    receipt: `rcpt_${Date.now()}`,
                    notes,
                }),
            });

            if (!razorpayResponse.ok) {
                const err = await razorpayResponse.json();
                return NextResponse.json(
                    { success: false, message: err?.error?.description || "Failed to create Razorpay order" },
                    { status: 502 }
                );
            }

            const razorpayOrder = await razorpayResponse.json();

            // Save a PENDING record so we can track even if user closes the modal
            await PaymentOrder.create({
                razorpayOrderId: razorpayOrder.id,
                userId: user.sub,
                userEmail: user.email,
                userName: user.name,
                amount: amountInPaise,
                currency,
                status: "PENDING",
                description,
                notes,
            });

            return NextResponse.json({
                success: true,
                data: {
                    orderId: razorpayOrder.id,
                    keyId,                    // safe to send to client (public key)
                    amount: amountInPaise,
                    currency,
                    description,
                    userName: user.name,
                    userEmail: user.email,
                },
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
