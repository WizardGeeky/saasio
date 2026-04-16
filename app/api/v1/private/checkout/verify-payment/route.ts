import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/app/configs/database.config";
import { decrypt } from "@/app/configs/crypto.config";
import RazorpayConfig from "@/models/Rozarpay";
import PaymentOrder from "@/models/PaymentOrder";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { fetchRazorpayPaymentMode } from "@/app/utils/razorpay-payment-mode";

type RouteContext = { params: Promise<Record<string, never>> };
type VerifyPaymentBody = {
    razorpayOrderId?: unknown;
    razorpayPaymentId?: unknown;
    razorpaySignature?: unknown;
};
type ExistingPaymentOrder = {
    userId?: string;
};

/**
 * POST /api/v1/private/checkout/verify-payment
 *
 * Body: {
 *   razorpayOrderId: string,
 *   razorpayPaymentId: string,
 *   razorpaySignature: string,
 * }
 *
 * Verifies HMAC signature and marks the PaymentOrder as SUCCESS.
 */
export const POST = withAuth(
    async (req: NextRequest, _ctx: RouteContext, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const body = await req.json() as VerifyPaymentBody;
            const razorpayOrderId = typeof body.razorpayOrderId === "string" ? body.razorpayOrderId : "";
            const razorpayPaymentId = typeof body.razorpayPaymentId === "string" ? body.razorpayPaymentId : "";
            const razorpaySignature = typeof body.razorpaySignature === "string" ? body.razorpaySignature : "";

            if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
                return NextResponse.json(
                    { success: false, message: "razorpayOrderId, razorpayPaymentId, and razorpaySignature are required" },
                    { status: 400 }
                );
            }

            // Fetch active config for keySecret
            const config = await RazorpayConfig.findOne({ isActive: true });
            if (!config) {
                return NextResponse.json(
                    { success: false, message: "No active Razorpay configuration found" },
                    { status: 503 }
                );
            }

            const keyId = decrypt(config.keyId);
            const keySecret = decrypt(config.keySecret);
            const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

            // Verify HMAC-SHA256 signature
            const expectedSignature = crypto
                .createHmac("sha256", keySecret)
                .update(`${razorpayOrderId}|${razorpayPaymentId}`)
                .digest("hex");

            if (expectedSignature !== razorpaySignature) {
                // Mark as FAILED if signature is invalid (possible tampering)
                await PaymentOrder.findOneAndUpdate(
                    { razorpayOrderId },
                    { status: "FAILED" }
                );
                return NextResponse.json(
                    { success: false, message: "Payment verification failed: invalid signature" },
                    { status: 400 }
                );
            }

            // Ownership check — ensure the order belongs to the requesting user
            const existingOrder = await PaymentOrder.findOne({ razorpayOrderId })
                .select({ userId: 1 })
                .lean() as ExistingPaymentOrder | null;
            if (!existingOrder) {
                return NextResponse.json(
                    { success: false, message: "Payment order record not found" },
                    { status: 404 }
                );
            }
            if (existingOrder.userId !== user.sub) {
                return NextResponse.json(
                    { success: false, message: "Access denied. This payment order does not belong to you." },
                    { status: 403 }
                );
            }

            // Signature valid — update record to SUCCESS
            const paymentModeInfo = await fetchRazorpayPaymentMode(razorpayPaymentId, credentials);

            const order = await PaymentOrder.findOneAndUpdate(
                { razorpayOrderId },
                {
                    razorpayPaymentId,
                    razorpaySignature,
                    status: "SUCCESS",
                    ...(paymentModeInfo ?? {}),
                },
                { new: true }
            );

            if (!order) {
                return NextResponse.json(
                    { success: false, message: "Payment order record not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: "Payment verified successfully",
                data: {
                    orderId: order.razorpayOrderId,
                    paymentId: order.razorpayPaymentId,
                    amount: order.amount,
                    currency: order.currency,
                    status: order.status,
                    userEmail: order.userEmail,
                    userName: order.userName,
                    description: order.description,
                    paidAt: order.updatedAt,
                },
            });
        } catch (error: unknown) {
            return NextResponse.json(
                { success: false, message: error instanceof Error ? error.message : "Unexpected error" },
                { status: 500 }
            );
        }
    }
);
