/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import ResumeDownload from "@/models/ResumeDownload";

// ─── GET — all users' resume downloads with global stats (admin view) ─────────
// Requires: GET /api/v1/private/resumes-history privilege.
// Query params:
//   page, limit, search, subscriptionFilter (all|subscribed|free),
//   sourceFilter (all|ai|manual), dateRange (all|today|week|month)

export const GET = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    const deny = await checkPrivilege(_user, "GET", "/api/v1/private/resumes-history");
    if (deny) return deny;

    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page               = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
        const limit              = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
        const search             = searchParams.get("search")?.trim()             ?? "";
        const subscriptionFilter = searchParams.get("subscriptionFilter")?.trim() ?? "all";
        const sourceFilter       = searchParams.get("sourceFilter")?.trim()       ?? "all";
        const dateRange          = searchParams.get("dateRange")?.trim()           ?? "all";
        const skip               = (page - 1) * limit;

        // ── Aggregate global stats over the FULL collection (no per-request filter) ──
        const [agg] = await ResumeDownload.aggregate([
            {
                $group: {
                    _id:                   null,
                    totalDownloads:        { $sum: 1 },
                    subscriptionDownloads: { $sum: { $cond: [{ $ifNull: ["$subscriptionId", false] }, 1, 0] } },
                },
            },
        ]);

        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - 7);

        const [thisWeekCount, uniqueUsersArr, topTemplateArr] = await Promise.all([
            ResumeDownload.countDocuments({ createdAt: { $gte: thisWeekStart } }),
            ResumeDownload.distinct("userId"),
            ResumeDownload.aggregate([
                { $group: { _id: "$templateName", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 },
            ]),
        ]);

        const totalDownloads        = agg?.totalDownloads        ?? 0;
        const subscriptionDownloads = agg?.subscriptionDownloads ?? 0;

        const stats = {
            totalDownloads,
            uniqueUsers:           uniqueUsersArr.length,
            subscriptionDownloads,
            freeDownloads:         Math.max(0, totalDownloads - subscriptionDownloads),
            thisWeek:              thisWeekCount,
            topTemplate:           topTemplateArr[0]?._id ?? "—",
        };

        // ── Build per-request filter using $and so conditions compose cleanly ──
        const conditions: Record<string, any>[] = [];

        if (search) {
            const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            conditions.push({
                $or: [
                    { userName:             re },
                    { userEmail:            re },
                    { resumeName:           re },
                    { resumeTitle:          re },
                    { fileName:             re },
                    { templateName:         re },
                    { subscriptionPlanName: re },
                ],
            });
        }

        if (subscriptionFilter === "subscribed") {
            conditions.push({ subscriptionId: { $exists: true, $type: "string", $ne: "" } });
        } else if (subscriptionFilter === "free") {
            conditions.push({ $or: [{ subscriptionId: { $exists: false } }, { subscriptionId: null }, { subscriptionId: "" }] });
        }

        if (sourceFilter === "ai") {
            conditions.push({ source: { $regex: "ai", $options: "i" } });
        } else if (sourceFilter === "manual") {
            conditions.push({ source: { $not: /ai/i } });
        }

        if (dateRange !== "all") {
            const since = new Date();
            if (dateRange === "today")  since.setHours(0, 0, 0, 0);
            else if (dateRange === "week")  since.setDate(since.getDate() - 7);
            else if (dateRange === "month") since.setMonth(since.getMonth() - 1);
            conditions.push({ createdAt: { $gte: since } });
        }

        const filter = conditions.length > 0 ? { $and: conditions } : {};

        // ── Paginate filtered records ──
        const total  = await ResumeDownload.countDocuments(filter);
        const pages  = Math.max(1, Math.ceil(total / limit));

        const rawRecords = await ResumeDownload.find(filter, {
            userId:                  1,
            userEmail:               1,
            userName:                1,
            resumeName:              1,
            resumeTitle:             1,
            fileName:                1,
            templateId:              1,
            templateName:            1,
            source:                  1,
            subscriptionId:          1,
            subscriptionPlanName:    1,
            subscriptionProjectName: 1,
            subscriptionStatus:      1,
            subscriptionPlanPrice:   1,
            subscriptionCurrency:    1,
            createdAt:               1,
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const records = rawRecords.map((r: any) => ({
            _id:                     String(r._id),
            userId:                  r.userId,
            userName:                r.userName || "—",
            userEmail:               r.userEmail || "—",
            resumeName:              r.resumeName || "",
            resumeTitle:             r.resumeTitle || "",
            fileName:                r.fileName || "",
            templateId:              r.templateId || "",
            templateName:            r.templateName || "",
            source:                  r.source || "resume-config",
            subscriptionId:          r.subscriptionId || null,
            subscriptionPlanName:    r.subscriptionPlanName || null,
            subscriptionProjectName: r.subscriptionProjectName || null,
            subscriptionStatus:      r.subscriptionStatus || null,
            subscriptionPlanPrice:   r.subscriptionPlanPrice ?? null,
            subscriptionCurrency:    r.subscriptionCurrency || "INR",
            createdAt:               r.createdAt,
        }));

        return NextResponse.json(
            { stats, records, pagination: { total, page, pages, limit } },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
