/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import type { PipelineStage } from "mongoose";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import ResumeDownload from "@/models/ResumeDownload";

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSubscriptionStages(): PipelineStage[] {
    return [
        {
            $lookup: {
                from: "subscriptions",
                let: {
                    resumeCreatedAt: "$createdAt",
                    userEmail: "$userEmail",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$userEmail", "$$userEmail"] },
                                    { $lte: ["$createdAt", "$$resumeCreatedAt"] },
                                ],
                            },
                        },
                    },
                    { $sort: { createdAt: -1 as const } },
                    { $limit: 1 },
                    {
                        $project: {
                            _id: 1,
                            projectId: 1,
                            projectName: 1,
                            planName: 1,
                            planPrice: 1,
                            currency: 1,
                            status: 1,
                            usageCount: 1,
                            maxUsage: 1,
                        },
                    },
                ],
                as: "matchedSubscription",
            },
        },
        {
            $addFields: {
                matchedSubscription: {
                    $arrayElemAt: ["$matchedSubscription", 0],
                },
            },
        },
        {
            $addFields: {
                effectiveSubscriptionId: {
                    $ifNull: ["$subscriptionId", "$matchedSubscription._id"],
                },
                effectiveSubscriptionProjectId: {
                    $ifNull: ["$subscriptionProjectId", "$matchedSubscription.projectId"],
                },
                effectiveSubscriptionProjectName: {
                    $ifNull: ["$subscriptionProjectName", "$matchedSubscription.projectName"],
                },
                effectiveSubscriptionPlanName: {
                    $ifNull: ["$subscriptionPlanName", "$matchedSubscription.planName"],
                },
                effectiveSubscriptionPlanPrice: {
                    $ifNull: ["$subscriptionPlanPrice", "$matchedSubscription.planPrice"],
                },
                effectiveSubscriptionCurrency: {
                    $ifNull: ["$subscriptionCurrency", "$matchedSubscription.currency"],
                },
                effectiveSubscriptionStatus: {
                    $ifNull: ["$subscriptionStatus", "$matchedSubscription.status"],
                },
                effectiveSubscriptionUsageCount: {
                    $ifNull: ["$subscriptionUsageCount", "$matchedSubscription.usageCount"],
                },
                effectiveSubscriptionMaxUsage: {
                    $ifNull: ["$subscriptionMaxUsage", "$matchedSubscription.maxUsage"],
                },
                effectiveSubscriptionRemaining: {
                    $ifNull: ["$subscriptionRemaining", null],
                },
                effectiveSubscriptionSource: {
                    $cond: [
                        { $ifNull: ["$subscriptionId", false] },
                        "snapshot",
                        {
                            $cond: [
                                { $ifNull: ["$matchedSubscription._id", false] },
                                "matched",
                                "none",
                            ],
                        },
                    ],
                },
            },
        },
    ] as PipelineStage[];
}

function buildSearchStages(search: string): PipelineStage[] {
    if (!search) return [];

    const regex = new RegExp(escapeRegExp(search), "i");

    return [
        {
            $match: {
                $or: [
                    { fileName: regex },
                    { resumeName: regex },
                    { resumeTitle: regex },
                    { templateId: regex },
                    { templateName: regex },
                    { source: regex },
                    { effectiveSubscriptionPlanName: regex },
                    { effectiveSubscriptionProjectName: regex },
                ],
            },
        },
    ] as PipelineStage[];
}

export const GET = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const url = new URL(req.url);
            const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
            const limit = Math.min(50, Math.max(5, parseInt(url.searchParams.get("limit") || "10", 10)));
            const search = (url.searchParams.get("search") || "").trim();
            const skip = (page - 1) * limit;

            const baseMatch = { userId: user.sub };
            const subscriptionStages = buildSubscriptionStages();
            const searchStages = buildSearchStages(search);

            const [historyDocs, totalDocs, ownedDocs, statsDocs] = await Promise.all([
                ResumeDownload.aggregate([
                    { $match: baseMatch },
                    ...subscriptionStages,
                    ...searchStages,
                    { $sort: { createdAt: -1 } },
                    {
                        $addFields: {
                            hasResumeSnapshot: {
                                $cond: [{ $ifNull: ["$resumePayload", false] }, true, false],
                            },
                        },
                    },
                    { $skip: skip },
                    { $limit: limit },
                ]),
                ResumeDownload.aggregate([
                    { $match: baseMatch },
                    ...subscriptionStages,
                    ...searchStages,
                    { $count: "total" },
                ]),
                ResumeDownload.aggregate([
                    { $match: baseMatch },
                    ...subscriptionStages,
                    { $sort: { createdAt: -1 } },
                    {
                        $group: {
                            _id: {
                                fileName: "$fileName",
                                resumeName: { $ifNull: ["$resumeName", ""] },
                                resumeTitle: { $ifNull: ["$resumeTitle", ""] },
                                templateId: "$templateId",
                                templateName: "$templateName",
                            },
                            downloads: { $sum: 1 },
                            firstDownloadedAt: { $last: "$createdAt" },
                            lastDownloadedAt: { $first: "$createdAt" },
                            latestRecordId: { $first: "$_id" },
                            hasResumeSnapshot: {
                                $first: {
                                    $cond: [{ $ifNull: ["$resumePayload", false] }, true, false],
                                },
                            },
                            latestSource: { $first: "$source" },
                            latestSubscriptionId: { $first: "$effectiveSubscriptionId" },
                            latestSubscriptionProjectId: { $first: "$effectiveSubscriptionProjectId" },
                            latestSubscriptionProjectName: { $first: "$effectiveSubscriptionProjectName" },
                            latestSubscriptionPlanName: { $first: "$effectiveSubscriptionPlanName" },
                            latestSubscriptionPlanPrice: { $first: "$effectiveSubscriptionPlanPrice" },
                            latestSubscriptionCurrency: { $first: "$effectiveSubscriptionCurrency" },
                            latestSubscriptionStatus: { $first: "$effectiveSubscriptionStatus" },
                            latestSubscriptionSource: { $first: "$effectiveSubscriptionSource" },
                        },
                    },
                    { $sort: { lastDownloadedAt: -1 } },
                ]),
                ResumeDownload.aggregate([
                    { $match: baseMatch },
                    ...subscriptionStages,
                    {
                        $group: {
                            _id: null,
                            totalDownloads: { $sum: 1 },
                            uniqueFormats: { $addToSet: "$templateId" },
                            ownedResumeKeys: {
                                $addToSet: {
                                    fileName: "$fileName",
                                    resumeName: { $ifNull: ["$resumeName", ""] },
                                    resumeTitle: { $ifNull: ["$resumeTitle", ""] },
                                    templateId: "$templateId",
                                },
                            },
                            subscriptionDownloads: {
                                $sum: {
                                    $cond: [
                                        { $ifNull: ["$effectiveSubscriptionId", false] },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            latestDownloadAt: { $max: "$createdAt" },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            totalDownloads: 1,
                            uniqueFormats: { $size: "$uniqueFormats" },
                            ownedResumes: { $size: "$ownedResumeKeys" },
                            subscriptionDownloads: 1,
                            latestDownloadAt: 1,
                        },
                    },
                ]),
            ]);

            const total = totalDocs[0]?.total ?? 0;
            const pages = total > 0 ? Math.ceil(total / limit) : 1;

            const stats = statsDocs[0] ?? {
                totalDownloads: 0,
                uniqueFormats: 0,
                ownedResumes: 0,
                subscriptionDownloads: 0,
                latestDownloadAt: null,
            };

            const history = historyDocs.map((doc: any) => ({
                _id: doc._id?.toString?.() ?? String(doc._id),
                fileName: doc.fileName || "",
                resumeName: doc.resumeName || "",
                resumeTitle: doc.resumeTitle || "",
                templateId: doc.templateId || "",
                templateName: doc.templateName || "",
                source: doc.source || "resume-config",
                createdAt: doc.createdAt,
                hasResumeSnapshot: Boolean(doc.hasResumeSnapshot),
                subscription: doc.effectiveSubscriptionId
                    ? {
                        id: doc.effectiveSubscriptionId?.toString?.() ?? String(doc.effectiveSubscriptionId),
                        projectId: doc.effectiveSubscriptionProjectId || "",
                        projectName: doc.effectiveSubscriptionProjectName || "",
                        planName: doc.effectiveSubscriptionPlanName || "",
                        planPrice: typeof doc.effectiveSubscriptionPlanPrice === "number" ? doc.effectiveSubscriptionPlanPrice : null,
                        currency: doc.effectiveSubscriptionCurrency || "INR",
                        status: doc.effectiveSubscriptionStatus || "",
                        usageCount: typeof doc.effectiveSubscriptionUsageCount === "number" ? doc.effectiveSubscriptionUsageCount : null,
                        maxUsage: typeof doc.effectiveSubscriptionMaxUsage === "number" ? doc.effectiveSubscriptionMaxUsage : null,
                        remaining: typeof doc.effectiveSubscriptionRemaining === "number" ? doc.effectiveSubscriptionRemaining : null,
                        source: doc.effectiveSubscriptionSource || "none",
                    }
                    : null,
            }));

            const ownedResumes = ownedDocs.map((doc: any) => ({
                key: [
                    doc._id?.fileName || "",
                    doc._id?.templateId || "",
                    doc._id?.resumeName || "",
                    doc._id?.resumeTitle || "",
                ].join("::"),
                latestRecordId: doc.latestRecordId?.toString?.() ?? String(doc.latestRecordId),
                hasResumeSnapshot: Boolean(doc.hasResumeSnapshot),
                fileName: doc._id?.fileName || "",
                resumeName: doc._id?.resumeName || "",
                resumeTitle: doc._id?.resumeTitle || "",
                templateId: doc._id?.templateId || "",
                templateName: doc._id?.templateName || "",
                downloads: doc.downloads ?? 0,
                firstDownloadedAt: doc.firstDownloadedAt,
                lastDownloadedAt: doc.lastDownloadedAt,
                source: doc.latestSource || "resume-config",
                subscription: doc.latestSubscriptionId
                    ? {
                        id: doc.latestSubscriptionId?.toString?.() ?? String(doc.latestSubscriptionId),
                        projectId: doc.latestSubscriptionProjectId || "",
                        projectName: doc.latestSubscriptionProjectName || "",
                        planName: doc.latestSubscriptionPlanName || "",
                        planPrice: typeof doc.latestSubscriptionPlanPrice === "number" ? doc.latestSubscriptionPlanPrice : null,
                        currency: doc.latestSubscriptionCurrency || "INR",
                        status: doc.latestSubscriptionStatus || "",
                        source: doc.latestSubscriptionSource || "none",
                    }
                    : null,
            }));

            return NextResponse.json({
                success: true,
                data: {
                    stats: {
                        totalDownloads: stats.totalDownloads ?? 0,
                        ownedResumes: stats.ownedResumes ?? 0,
                        uniqueFormats: stats.uniqueFormats ?? 0,
                        subscriptionDownloads: stats.subscriptionDownloads ?? 0,
                        freeDownloads: Math.max(0, (stats.totalDownloads ?? 0) - (stats.subscriptionDownloads ?? 0)),
                        latestDownloadAt: stats.latestDownloadAt ?? null,
                    },
                    ownedResumes,
                    history,
                    pagination: {
                        total,
                        page,
                        pages,
                        limit,
                    },
                },
            });
        } catch (error: any) {
            console.error("[my-resumes]", error);
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
