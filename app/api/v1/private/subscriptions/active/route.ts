import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import Subscription from "@/models/Subscription";
import { resolveSubscriptionQuota } from "@/app/utils/subscription-usage";

/**
 * GET /api/v1/private/subscriptions/active
 *
 * Returns the authenticated user's most recent ACTIVE subscription with usage info.
 * Used by feature pages (resume-config, AI ATS) to enforce subscription gating.
 *
 * Response:
 *   { success: true, data: null }                    — no active subscription
 *   { success: true, data: { ...sub, hasUsage, remaining } }
 */
export const GET = withAuth(
    async (_req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const sub = await Subscription.findOne({
                userEmail: user.email,
                status: "ACTIVE",
            })
                .sort({ createdAt: -1 });

            if (!sub) {
                return NextResponse.json({ success: true, data: null });
            }

            const quota = await resolveSubscriptionQuota(sub);

            const updates: Record<string, unknown> = {};
            if (quota.shouldPersistResolvedMaxUsage) {
                updates.maxUsage = quota.maxUsage;
            }
            if (quota.maxUsage > 0 && !quota.hasUsage) {
                updates.status = "EXPIRED";
            }

            if (Object.keys(updates).length > 0) {
                await Subscription.updateOne({ _id: sub._id }, { $set: updates });
            }

            if (quota.maxUsage > 0 && !quota.hasUsage) {
                return NextResponse.json({ success: true, data: null });
            }

            const s = sub as any;

            return NextResponse.json({
                success: true,
                data: {
                    _id:         s._id,
                    planName:    s.planName,
                    projectName: s.projectName,
                    status:      s.status,
                    usageCount:  quota.usageCount,
                    maxUsage:    quota.maxUsage,
                    hasUsage:    quota.hasUsage,
                    remaining:   quota.remaining,
                },
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
