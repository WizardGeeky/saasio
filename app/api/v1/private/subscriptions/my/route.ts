import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import Subscription from "@/models/Subscription";
import { resolveSubscriptionQuota } from "@/app/utils/subscription-usage";

/**
 * GET /api/v1/private/subscriptions/my
 *
 * Returns the authenticated user's own subscriptions, filtered by their email.
 * Query params: page, limit, status
 */
export const GET = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const url   = new URL(req.url);
            const page  = Math.max(1, parseInt(url.searchParams.get("page")  || "1", 10));
            const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
            const status = url.searchParams.get("status") || "";

            const query: Record<string, any> = { userEmail: user.email };
            if (status && ["ACTIVE", "CANCELLED", "EXPIRED"].includes(status)) {
                query.status = status;
            }

            const total = await Subscription.countDocuments(query);
            const subscriptions = await Subscription.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            const normalizedSubscriptions = await Promise.all(
                subscriptions.map(async (sub: any) => {
                    const quota = await resolveSubscriptionQuota(sub);

                    return {
                        ...sub,
                        maxUsage: quota.maxUsage,
                        status: sub.status === "ACTIVE" && quota.maxUsage > 0 && !quota.hasUsage
                            ? "EXPIRED"
                            : sub.status,
                    };
                })
            );

            // Aggregate stats
            const stats = await Subscription.aggregate([
                { $match: { userEmail: user.email } },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        totalAmount: { $sum: "$planPrice" },
                    },
                },
            ]);

            const statsMap: Record<string, { count: number; totalAmount: number }> = {};
            for (const s of stats) {
                statsMap[s._id] = { count: s.count, totalAmount: s.totalAmount };
            }

            return NextResponse.json({
                success: true,
                data: {
                    subscriptions: normalizedSubscriptions,
                    pagination: { total, page, pages: Math.ceil(total / limit), limit },
                    stats: {
                        active:    statsMap["ACTIVE"]    ?? { count: 0, totalAmount: 0 },
                        cancelled: statsMap["CANCELLED"] ?? { count: 0, totalAmount: 0 },
                        expired:   statsMap["EXPIRED"]   ?? { count: 0, totalAmount: 0 },
                        total:     { count: total, totalAmount: Object.values(statsMap).reduce((s, v) => s + v.totalAmount, 0) },
                    },
                },
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
