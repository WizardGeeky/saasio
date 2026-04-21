/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { decrypt } from "@/app/configs/crypto.config";
import Review from "@/models/Review";

// POST /api/v1/private/reviews — submit a review (any authenticated user)
export const POST = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const body = await req.json();
            const rating = typeof body.rating === "number" ? body.rating : parseInt(body.rating, 10);

            if (!rating || rating < 1 || rating > 5) {
                return NextResponse.json(
                    { success: false, message: "Rating must be between 1 and 5." },
                    { status: 400 }
                );
            }

            const title = typeof body.title === "string" ? body.title.trim() : "";
            const reviewBody = typeof body.body === "string" ? body.body.trim() : "";
            const resumeDownloadId = typeof body.resumeDownloadId === "string" ? body.resumeDownloadId.trim() : "";
            const resumeName = typeof body.resumeName === "string" ? body.resumeName.trim() : "";
            const templateName = typeof body.templateName === "string" ? body.templateName.trim() : "";

            const plainEmail = decrypt(user.email);

            const record = await Review.create({
                userId: user.sub,
                userEmail: plainEmail,
                userName: user.name || "",
                rating,
                ...(title ? { title } : {}),
                ...(reviewBody ? { body: reviewBody } : {}),
                ...(resumeDownloadId ? { resumeDownloadId } : {}),
                ...(resumeName ? { resumeName } : {}),
                ...(templateName ? { templateName } : {}),
                status: "PUBLISHED",
            });

            return NextResponse.json({
                success: true,
                data: { _id: record._id, createdAt: record.createdAt },
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);

// GET /api/v1/private/reviews — list all reviews (admin only)
export const GET = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            const deny = await checkPrivilege(user, "GET", "/api/v1/private/reviews");
            if (deny) return deny;

            await connectDB();

            const url = new URL(req.url);
            const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
            const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
            const search = (url.searchParams.get("search") || "").trim();
            const ratingFilter = url.searchParams.get("rating") || "all";
            const statusFilter = url.searchParams.get("status") || "all";
            const dateRange = url.searchParams.get("dateRange") || "all";

            const query: Record<string, unknown> = {};

            if (search) {
                const regex = new RegExp(search, "i");
                query.$or = [
                    { userName: regex },
                    { userEmail: regex },
                    { resumeName: regex },
                    { templateName: regex },
                    { title: regex },
                    { body: regex },
                ];
            }

            if (ratingFilter !== "all") {
                query.rating = parseInt(ratingFilter, 10);
            }

            if (statusFilter !== "all") {
                query.status = statusFilter.toUpperCase();
            }

            if (dateRange !== "all") {
                const now = new Date();
                let since: Date;
                if (dateRange === "today") {
                    since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                } else if (dateRange === "week") {
                    since = new Date(now);
                    since.setDate(since.getDate() - 7);
                } else {
                    since = new Date(now.getFullYear(), now.getMonth(), 1);
                }
                query.createdAt = { $gte: since };
            }

            const [records, total, statsAgg] = await Promise.all([
                Review.find(query)
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                Review.countDocuments(query),
                Review.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalReviews: { $sum: 1 },
                            avgRating: { $avg: "$rating" },
                            fiveStarCount: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
                            thisWeek: {
                                $sum: {
                                    $cond: [
                                        { $gte: ["$createdAt", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                                        1,
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ]),
            ]);

            const agg = statsAgg[0] || { totalReviews: 0, avgRating: 0, fiveStarCount: 0, thisWeek: 0 };

            return NextResponse.json({
                success: true,
                stats: {
                    totalReviews: agg.totalReviews,
                    avgRating: agg.avgRating ? Math.round(agg.avgRating * 10) / 10 : 0,
                    fiveStarCount: agg.fiveStarCount,
                    thisWeek: agg.thisWeek,
                },
                records,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit),
                    limit,
                },
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
