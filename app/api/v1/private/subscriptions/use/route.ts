import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import Subscription from "@/models/Subscription";
import { resolveSubscriptionQuota } from "@/app/utils/subscription-usage";

/**
 * POST /api/v1/private/subscriptions/use
 *
 * Records one unit of usage against the user's most recent ACTIVE subscription.
 * Called before each premium resume download or (from ai-ats) before each AI analysis.
 *
 * Returns:
 *   { success: true,  data: { usageCount, maxUsage, remaining } }
 *   { success: false, message } — no active subscription or usage limit reached
 */
export const POST = withAuth(
    async (_req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const sub = await Subscription.findOne({
                userEmail: user.email,
                status: "ACTIVE",
            }).sort({ createdAt: -1 });

            if (!sub) {
                return NextResponse.json(
                    { success: false, message: "No active subscription. Please subscribe to access premium features." },
                    { status: 403 }
                );
            }

            const quota = await resolveSubscriptionQuota(sub);
            const usageCount = quota.usageCount;
            const maxUsage = quota.maxUsage;

            if (quota.shouldPersistResolvedMaxUsage) {
                sub.maxUsage = maxUsage;
            }

            if (!quota.hasUsage) {
                if (maxUsage > 0) {
                    sub.status = "EXPIRED";
                    await sub.save();
                }
                return NextResponse.json(
                    { success: false, message: "Usage limit reached. Please re-subscribe to continue." },
                    { status: 403 }
                );
            }

            // Increment usage
            const newUsage = usageCount + 1;
            sub.usageCount = newUsage;
            await sub.save();

            // Auto-expire if the limit has now been reached
            if (maxUsage > 0 && newUsage >= maxUsage) {
                await Subscription.updateOne({ _id: sub._id }, { status: "EXPIRED" });
            }

            const remaining = maxUsage === 0 ? null : Math.max(0, maxUsage - newUsage);

            return NextResponse.json({
                success: true,
                data: { usageCount: newUsage, maxUsage, remaining },
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
