import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import Subscription from "@/models/Subscription";

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
                .sort({ createdAt: -1 })
                .lean();

            if (!sub) {
                return NextResponse.json({ success: true, data: null });
            }

            const s = sub as any;
            const usageCount = s.usageCount ?? 0;
            const maxUsage   = s.maxUsage   ?? 0;

            // maxUsage === 0 means unlimited
            const hasUsage  = maxUsage === 0 || usageCount < maxUsage;
            const remaining = maxUsage === 0 ? null : Math.max(0, maxUsage - usageCount);

            return NextResponse.json({
                success: true,
                data: {
                    _id:         s._id,
                    planName:    s.planName,
                    projectName: s.projectName,
                    status:      s.status,
                    usageCount,
                    maxUsage,
                    hasUsage,
                    remaining,
                },
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
