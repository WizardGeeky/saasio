import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import Subscription from "@/models/Subscription";
import { sendSubscriptionConfirmationEmail } from "@/app/notifications/subscription.notification";

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
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const body = await req.json();
            const {
                projectId,
                projectName,
                planName,
                planPrice,
                currency = "INR",
                razorpayOrderId,
                razorpayPaymentId,
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
            }).catch((err) => {
                console.error("[subscription email] failed to send:", err?.message);
            });

            return NextResponse.json(
                { success: true, message: "Subscription created successfully", data: subscription },
                { status: 201 }
            );
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);

/**
 * GET /api/v1/private/subscriptions
 *
 * Admin view — all subscriptions with optional filters.
 * Query params: page, limit, status, search (email/project)
 */
export const GET = withAuth(
    async (req: NextRequest, _ctx: { params: any }, _user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const url = new URL(req.url);
            const page   = Math.max(1, parseInt(url.searchParams.get("page")  || "1", 10));
            const limit  = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
            const status = url.searchParams.get("status") || "";
            const search = url.searchParams.get("search") || "";

            const query: Record<string, any> = {};
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
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
