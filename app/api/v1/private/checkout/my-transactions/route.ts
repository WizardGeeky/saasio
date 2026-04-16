import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { decrypt } from "@/app/configs/crypto.config";
import PaymentOrder from "@/models/PaymentOrder";
import RazorpayConfig from "@/models/Rozarpay";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { enrichMissingPaymentModes } from "@/app/utils/razorpay-payment-mode";

type RouteContext = { params: Record<string, string | string[] | undefined> };
type StatusAggregate = {
    _id: string;
    count: number;
    totalAmount: number;
};
type RegexFilter = { $regex: string; $options: string };
type PaymentOrderFilter = {
    userId?: string;
    status?: string;
    $or?: Array<{
        userName?: RegexFilter;
        userEmail?: RegexFilter;
        razorpayPaymentId?: RegexFilter;
        razorpayOrderId?: RegexFilter;
    }>;
};

export const GET = withAuth(
    async (req: NextRequest, _ctx: RouteContext, _user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const { searchParams } = new URL(req.url);
            const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
            const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
            const search = searchParams.get("search")?.trim() ?? "";
            const status = searchParams.get("status") ?? "ALL";
            const sort   = searchParams.get("sort") ?? "date_desc";

            const filter: PaymentOrderFilter = { userId: _user.sub }; // Enforce user ID

            if (status !== "ALL") {
                filter.status = status;
            }

            if (search) {
                filter.$or = [
                    { userName:          { $regex: search, $options: "i" } },
                    { userEmail:         { $regex: search, $options: "i" } },
                    { razorpayPaymentId: { $regex: search, $options: "i" } },
                    { razorpayOrderId:   { $regex: search, $options: "i" } },
                ];
            }

            const sortMap: Record<string, Record<string, 1 | -1>> = {
                date_desc:   { createdAt: -1 },
                date_asc:    { createdAt:  1 },
                amount_desc: { amount: -1 },
                amount_asc:  { amount:  1 },
            };
            const sortObj = sortMap[sort] ?? { createdAt: -1 };

            const [transactions, total, config] = await Promise.all([
                PaymentOrder.find(filter)
                    .sort(sortObj)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                PaymentOrder.countDocuments(filter),
                RazorpayConfig.findOne({ isActive: true }),
            ]);

            const credentials = config
                ? Buffer.from(`${decrypt(config.keyId)}:${decrypt(config.keySecret)}`).toString("base64")
                : null;
            const transactionsWithPaymentModes = await enrichMissingPaymentModes(transactions, credentials);

            const stats = await PaymentOrder.aggregate<StatusAggregate>([
                { $match: { userId: _user.sub } },
                {
                    $group: {
                        _id: "$status",
                        count:       { $sum: 1 },
                        totalAmount: { $sum: "$amount" },
                    },
                },
            ]);

            const statMap: Record<string, { count: number; totalAmount: number }> = {};
            stats.forEach((s) => { statMap[s._id] = { count: s.count, totalAmount: s.totalAmount }; });

            return NextResponse.json({
                success: true,
                data: {
                    transactions: transactionsWithPaymentModes,
                    pagination: {
                        total,
                        page,
                        pages: Math.ceil(total / limit),
                        limit,
                    },
                    stats: {
                        success: statMap["SUCCESS"] ?? { count: 0, totalAmount: 0 },
                        pending: statMap["PENDING"] ?? { count: 0, totalAmount: 0 },
                        failed:  statMap["FAILED"]  ?? { count: 0, totalAmount: 0 },
                        total: {
                            count: (statMap["SUCCESS"]?.count ?? 0) + (statMap["PENDING"]?.count ?? 0) + (statMap["FAILED"]?.count ?? 0),
                            totalAmount: statMap["SUCCESS"]?.totalAmount ?? 0,
                        },
                    },
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
