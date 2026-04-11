import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/app/configs/database.config";
import { decrypt } from "@/app/configs/crypto.config";
import RazorpayConfig from "@/models/Rozarpay";
import PaymentOrder from "@/models/PaymentOrder";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

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
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const body = await req.json();
            const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

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

            const keySecret = decrypt(config.keySecret);

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
            const existingOrder = await PaymentOrder.findOne({ razorpayOrderId }).lean();
            if (!existingOrder) {
                return NextResponse.json(
                    { success: false, message: "Payment order record not found" },
                    { status: 404 }
                );
            }
            if ((existingOrder as any).userId !== user.sub) {
                return NextResponse.json(
                    { success: false, message: "Access denied. This payment order does not belong to you." },
                    { status: 403 }
                );
            }

            // Signature valid — update record to SUCCESS
            const order = await PaymentOrder.findOneAndUpdate(
                { razorpayOrderId },
                {
                    razorpayPaymentId,
                    razorpaySignature,
                    status: "SUCCESS",
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
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
