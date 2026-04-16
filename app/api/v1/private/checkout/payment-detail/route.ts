import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { decrypt } from "@/app/configs/crypto.config";
import RazorpayConfig from "@/models/Rozarpay";
import PaymentOrder from "@/models/PaymentOrder";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import {
    fetchRazorpayPaymentDetail,
    getPaymentModeInfo,
    RazorpayPaymentDetail,
} from "@/app/utils/razorpay-payment-mode";

type RouteContext = { params: Promise<Record<string, never>> };
type PaymentOrderRecord = {
    userId?: string;
    paymentMethod?: string;
    [key: string]: unknown;
};

/**
 * GET /api/v1/private/checkout/payment-detail?paymentId=pay_xxx
 *
 * Fetches the DB record + full payment detail from Razorpay API.
 * Used for the receipt modal.
 */
export const GET = withAuth(
    async (req: NextRequest, _ctx: RouteContext, _user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const { searchParams } = new URL(req.url);
            const paymentId = searchParams.get("paymentId");

            if (!paymentId) {
                return NextResponse.json(
                    { success: false, message: "paymentId query param is required" },
                    { status: 400 }
                );
            }

            // Fetch DB record and Razorpay config in parallel
            const [orderRecord, config] = await Promise.all([
                PaymentOrder.findOne({ razorpayPaymentId: paymentId }).lean(),
                RazorpayConfig.findOne({ isActive: true }),
            ]);
            let dbOrder = orderRecord as PaymentOrderRecord | null;

            if (!dbOrder) {
                return NextResponse.json(
                    { success: false, message: "Payment record not found" },
                    { status: 404 }
                );
            }

            // Ownership check: user must own this payment OR have admin rozarpay privilege
            if (dbOrder.userId !== _user.sub) {
                const deny = await checkPrivilege(_user, "GET", "/api/v1/private/rozarpay");
                if (deny) return NextResponse.json(
                    { success: false, message: "Access denied. This payment does not belong to you." },
                    { status: 403 }
                );
            }

            let razorpayDetail: RazorpayPaymentDetail | null = null;

            if (config) {
                const keyId     = decrypt(config.keyId);
                const keySecret = decrypt(config.keySecret);
                const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

                razorpayDetail = await fetchRazorpayPaymentDetail(paymentId, credentials);
                const paymentModeInfo = getPaymentModeInfo(razorpayDetail);

                if (paymentModeInfo && !dbOrder.paymentMethod) {
                    await PaymentOrder.updateOne({ razorpayPaymentId: paymentId }, { $set: paymentModeInfo });
                    dbOrder = { ...dbOrder, ...paymentModeInfo };
                }
            }

            return NextResponse.json({
                success: true,
                data: {
                    order: dbOrder,
                    razorpay: razorpayDetail,
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
