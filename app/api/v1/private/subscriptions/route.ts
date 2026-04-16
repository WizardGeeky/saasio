import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import Subscription from "@/models/Subscription";
import { sendSubscriptionConfirmationEmail } from "@/app/notifications/subscription.notification";
import { resolveSubscriptionQuota } from "@/app/utils/subscription-usage";

type RouteContext = { params: Record<string, string | string[] | undefined> };
type CreateSubscriptionBody = {
    projectId?: string;
    projectName?: string;
    planName?: string;
    planPrice?: number;
    currency?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    maxUsage?: number;
};
type SubscriptionQuery = {
    status?: string;
    $or?: Array<Record<string, { $regex: string; $options: string }>>;
};

/**
 * POST /api/v1/private/subscriptions
 *
 * Creates a subscription record after a successful Razorpay payment
 * and sends a confirmation email to the user.
 *
 * Body: {
 *   projectId: string,
 *   projectName: string,
 *   planName: string,
 *   planPrice: number,       // in rupees
 *   currency?: string,
 *   razorpayOrderId: string,
 *   razorpayPaymentId: string,
 * }
 */
export const POST = withAuth(
    async (req: NextRequest, _ctx: RouteContext, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const body = await req.json() as CreateSubscriptionBody;
            const {
                projectId,
                projectName,
                planName,
                planPrice,
                currency = "INR",
                razorpayOrderId,
                razorpayPaymentId,
                maxUsage = 0,
            } = body;

            if (!projectId || !projectName || !planName || planPrice == null || !razorpayOrderId || !razorpayPaymentId) {
                return NextResponse.json(
                    { success: false, message: "projectId, projectName, planName, planPrice, razorpayOrderId and razorpayPaymentId are required" },
                    { status: 400 }
                );
            }

            // Prevent duplicate subscriptions for the same order
            const existing = await Subscription.findOne({ razorpayOrderId });
            if (existing) {
                return NextResponse.json(
                    { success: false, message: "Subscription for this order already exists" },
                    { status: 409 }
                );
            }

            const activeSubscription = await Subscription.findOne({
                userEmail: user.email,
                status: "ACTIVE",
            }).sort({ createdAt: -1 });

            if (activeSubscription) {
                const quota = await resolveSubscriptionQuota(activeSubscription);
                const updates: Record<string, unknown> = {};

                if (quota.shouldPersistResolvedMaxUsage) {
                    updates.maxUsage = quota.maxUsage;
                }

                if (quota.maxUsage > 0 && !quota.hasUsage) {
                    updates.status = "EXPIRED";
                }

                if (Object.keys(updates).length > 0) {
                    await Subscription.updateOne({ _id: activeSubscription._id }, { $set: updates });
                }

                if (quota.hasUsage) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: "You already have an active subscription. Please use or finish it before buying another plan.",
                        },
                        { status: 409 }
                    );
                }
            }

            const subscription = await Subscription.create({
                userId: user.sub,
                userEmail: user.email,
                userName: user.name,
                projectId,
                projectName,
                planName,
                planPrice,
                currency,
                razorpayOrderId,
                razorpayPaymentId,
                status: "ACTIVE",
                usageCount: 0,
                maxUsage: Number(maxUsage) || 0,
            });

            // Send confirmation email (non-blocking — don't fail the request if email fails)
            sendSubscriptionConfirmationEmail({
                userEmail: user.email,
                userName: user.name,
                projectName,
                planName,
                planPrice,
                currency,
                razorpayOrderId,
                razorpayPaymentId,
                subscribedAt: subscription.createdAt,
            }).catch((err: unknown) => {
                console.error("[subscription email] failed to send:", err instanceof Error ? err.message : err);
            });

            return NextResponse.json(
                { success: true, message: "Subscription created successfully", data: subscription },
                { status: 201 }
            );
        } catch (error: unknown) {
            return NextResponse.json(
                { success: false, message: error instanceof Error ? error.message : "Unexpected error" },
                { status: 500 }
            );
        }
    }
);

/**
 * GET /api/v1/private/subscriptions
 *
 * Admin view — all subscriptions with optional filters.
 * Requires: GET /api/v1/private/subscriptions privilege.
 * Query params: page, limit, status, search (email/project)
 */
export const GET = withAuth(
    async (req: NextRequest, _ctx: RouteContext, _user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(_user, "GET", "/api/v1/private/subscriptions");
        if (deny) return deny;

        try {
            await connectDB();

            const url = new URL(req.url);
            const page   = Math.max(1, parseInt(url.searchParams.get("page")  || "1", 10));
            const limit  = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
            const status = url.searchParams.get("status") || "";
            const search = url.searchParams.get("search") || "";

            const query: SubscriptionQuery = {};
            if (status && ["ACTIVE", "CANCELLED", "EXPIRED"].includes(status)) query.status = status;
            if (search) {
                query.$or = [
                    { userEmail: { $regex: search, $options: "i" } },
                    { projectName: { $regex: search, $options: "i" } },
                    { planName: { $regex: search, $options: "i" } },
                ];
            }

            const total = await Subscription.countDocuments(query);
            const subscriptions = await Subscription.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            return NextResponse.json({
                success: true,
                data: {
                    subscriptions,
                    pagination: { total, page, pages: Math.ceil(total / limit), limit },
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
