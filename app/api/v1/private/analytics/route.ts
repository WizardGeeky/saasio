/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { User } from "@/models/User";
import { Role } from "@/models/Role";
import { Privilege } from "@/models/Privilege";
import { AiModel } from "@/models/AiModel";
import { AtsRecord } from "@/models/AtsRecord";
import { Project } from "@/models/Project";
import PaymentOrder from "@/models/PaymentOrder";
import Subscription from "@/models/Subscription";
import Complaint from "@/models/Complaint";
import ResumeDownload from "@/models/ResumeDownload";
import Quiz from "@/models/Quiz";
import QuizParticipation from "@/models/QuizParticipation";
import { RESUME_TEMPLATE_CATALOG } from "@/app/dashboard/resume-config/template-catalog";

export type Period = "today" | "7d" | "30d" | "6m" | "all";

const DEFAULT_MOST_USED_RESUME_TEMPLATE = {
    templateId: RESUME_TEMPLATE_CATALOG[0]?.id ?? "classic",
    templateName: RESUME_TEMPLATE_CATALOG[0]?.name ?? "Classic",
    memberCount: 0,
    downloadCount: 0,
};

// ─── Period helpers ───────────────────────────────────────────────────────────

function getPeriodStart(period: Period): Date | null {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === "today") return today;
    if (period === "7d") { const d = new Date(today); d.setDate(d.getDate() - 6); return d; }
    if (period === "30d") { const d = new Date(today); d.setDate(d.getDate() - 29); return d; }
    if (period === "6m")  { const d = new Date(today); d.setMonth(d.getMonth() - 5); d.setDate(1); return d; }
    return null; // "all"
}

function getGroupFormat(period: Period): string {
    if (period === "today") return "%Y-%m-%dT%H";
    if (period === "7d" || period === "30d") return "%Y-%m-%d";
    return "%Y-%m"; // 6m, all
}

/** Build all bucket keys for a period so missing dates show as 0 */
function buildBuckets(period: Period, start: Date | null): string[] {
    const now = new Date();
    if (period === "today") {
        const hours: string[] = [];
        for (let h = 0; h <= now.getHours(); h++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h);
            hours.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(h).padStart(2, "0")}`);
        }
        return hours;
    }
    if (period === "7d" || period === "30d") {
        const days = period === "7d" ? 7 : 30;
        return Array.from({ length: days }, (_, i) => {
            const d = new Date(start!);
            d.setDate(d.getDate() + i);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        });
    }
    // 6m or all → monthly
    const months: string[] = [];
    const cursor = start ? new Date(start.getFullYear(), start.getMonth(), 1) : new Date(2024, 0, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    while (cursor <= end) {
        months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
}

/** Display label for a bucket key */
function bucketLabel(key: string, period: Period): string {
    if (period === "today") {
        const hour = parseInt(key.split("T")[1], 10);
        return `${String(hour).padStart(2, "0")}:00`;
    }
    if (period === "7d" || period === "30d") {
        const [, m, d] = key.split("-");
        return `${d} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m,10)-1]}`;
    }
    const [y, m] = key.split("-");
    return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m,10)-1]} ${y}`;
}

// ─── Merge series helper ──────────────────────────────────────────────────────

function fillSeries<T extends Record<string, any>>(
    buckets: string[],
    data: Array<{ _id: string } & T>,
    defaults: T,
    period: Period
): Array<{ label: string } & T> {
    const map = new Map(data.map((d) => [d._id, d]));
    return buckets.map((b) => {
        const row = map.get(b);
        return { label: bucketLabel(b, period), ...defaults, ...(row ? { ...row, _id: undefined } : {}) };
    });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const GET = withAuth(
    async (req: NextRequest, _ctx: { params: any }, _user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            void _ctx;
            void _user;
            await connectDB();

            const url    = new URL(req.url);
            const period = (url.searchParams.get("period") ?? "7d") as Period;
            const start  = getPeriodStart(period);
            const fmt    = getGroupFormat(period);
            const buckets = buildBuckets(period, start);
            const dateFilter = start ? { $gte: start } : undefined;
            const matchDate  = dateFilter ? { createdAt: dateFilter } : {};

            // ── 1. Global all-time counts ────────────────────────────────────
            const thisWeekStart = new Date();
            thisWeekStart.setDate(thisWeekStart.getDate() - 7);

            const [
                userStats,
                roleCount,
                privCount,
                projectStats,
                aiModelStats,
                complaintStats,
                txStats,
                subStats,
                atsStats,
                topResumeTemplates,
                cvStats,
                quizStatusAgg,
                totalQuizParticipants,
            ] = await Promise.all([
                User.aggregate([{ $group: { _id: "$accountStatus", count: { $sum: 1 } } }]),
                Role.countDocuments(),
                Privilege.countDocuments(),
                Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
                AiModel.aggregate([{ $group: { _id: "$isActive", count: { $sum: 1 } } }]),
                Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
                PaymentOrder.aggregate([
                    { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$amount" } } }
                ]),
                Subscription.aggregate([
                    { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$planPrice" } } }
                ]),
                AtsRecord.aggregate([
                    { $group: { _id: null, total: { $sum: 1 }, avgScore: { $avg: "$analysis.score" } } }
                ]),
                ResumeDownload.aggregate([
                    {
                        $group: {
                            _id: {
                                templateId: "$templateId",
                                templateName: "$templateName",
                            },
                            downloadCount: { $sum: 1 },
                            userIds: { $addToSet: "$userId" },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            downloadCount: 1,
                            memberCount: { $size: "$userIds" },
                        },
                    },
                    { $sort: { downloadCount: -1, memberCount: -1, "_id.templateName": 1 } },
                    { $limit: RESUME_TEMPLATE_CATALOG.length },
                ]),
                // CV stats — source="my-cvs-ai" records only
                ResumeDownload.aggregate([
                    {
                        $facet: {
                            total:       [{ $match: { source: "my-cvs-ai" } }, { $count: "n" }],
                            thisWeek:    [{ $match: { source: "my-cvs-ai", createdAt: { $gte: thisWeekStart } } }, { $count: "n" }],
                            uniqueUsers: [{ $match: { source: "my-cvs-ai" } }, { $group: { _id: "$userId" } }, { $count: "n" }],
                        },
                    },
                ]),
                // Quiz stats
                Quiz.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
                QuizParticipation.countDocuments(),
            ]);

            const resumeFormatCount = RESUME_TEMPLATE_CATALOG.length;

            // Flatten CV stats
            const cvFacet    = cvStats[0] ?? {};
            const cvTotal       = cvFacet.total?.[0]?.n       ?? 0;
            const cvThisWeek    = cvFacet.thisWeek?.[0]?.n    ?? 0;
            const cvUniqueUsers = cvFacet.uniqueUsers?.[0]?.n ?? 0;

            // Flatten user stats
            const userMap = Object.fromEntries(userStats.map((u: any) => [u._id, u.count]));
            const totalUsers = Object.values(userMap).reduce((s: any, v: any) => s + v, 0) as number;

            // Flatten project stats
            const projMap = Object.fromEntries(projectStats.map((p: any) => [p._id, p.count]));
            const totalProj = Object.values(projMap).reduce((s: any, v: any) => s + v, 0) as number;

            // Flatten complaint stats (global)
            const compMap = Object.fromEntries(complaintStats.map((c: any) => [c._id, c.count]));
            const totalComp = Object.values(compMap).reduce((s: any, v: any) => s + v, 0) as number;

            // Flatten transaction stats
            const txMap: Record<string, { count: number; revenue: number }> = {};
            for (const t of txStats as any[]) txMap[t._id] = { count: t.count, revenue: t.revenue };
            const totalTx = Object.values(txMap).reduce((s, v) => s + v.count, 0);
            const totalTxRevenue = Math.round(((txMap["SUCCESS"]?.revenue ?? 0) / 100) * 100) / 100;

            // Flatten subscription stats
            const subMap: Record<string, { count: number; revenue: number }> = {};
            for (const s of subStats as any[]) subMap[s._id] = { count: s.count, revenue: s.revenue };
            const totalSub = Object.values(subMap).reduce((s, v) => s + v.count, 0);
            const totalSubRevenue = Object.values(subMap).reduce((s, v) => s + v.revenue, 0);

            // AiModel active/total
            const aiMap = Object.fromEntries(aiModelStats.map((a: any) => [String(a._id), a.count]));
            const resumeUsageMap = new Map(
                (topResumeTemplates as any[]).map((template) => [
                    template._id?.templateId || "",
                    {
                        memberCount: template.memberCount ?? 0,
                        downloadCount: template.downloadCount ?? 0,
                    },
                ])
            );
            const resumeTemplateUsage = RESUME_TEMPLATE_CATALOG.map((template) => {
                const usage = resumeUsageMap.get(template.id);

                return {
                    templateId: template.id,
                    templateName: template.name,
                    memberCount: usage?.memberCount ?? 0,
                    downloadCount: usage?.downloadCount ?? 0,
                };
            });
            const mostUsedTemplate = resumeTemplateUsage.reduce((best, current) => {
                if (!best) {
                    return current;
                }

                if (current.downloadCount > best.downloadCount) {
                    return current;
                }

                if (current.downloadCount === best.downloadCount && current.memberCount > best.memberCount) {
                    return current;
                }

                return best;
            }, null as (typeof resumeTemplateUsage)[number] | null) ?? DEFAULT_MOST_USED_RESUME_TEMPLATE;

            const global = {
                users: {
                    total: totalUsers,
                    active:    userMap["ACTIVE"]    ?? 0,
                    inactive:  userMap["INACTIVE"]  ?? 0,
                    suspended: userMap["SUSPENDED"] ?? 0,
                },
                roles:      roleCount,
                privileges: privCount,
                projects: {
                    total: totalProj,
                    active:    projMap["ACTIVE"]    ?? 0,
                    inactive:  projMap["INACTIVE"]  ?? 0,
                    suspended: projMap["SUSPENDED"] ?? 0,
                },
                aiModels: {
                    total:  (aiMap["true"] ?? 0) + (aiMap["false"] ?? 0),
                    active:  aiMap["true"] ?? 0,
                },
                complaints: {
                    total:      totalComp,
                    pending:    compMap["PENDING"]     ?? 0,
                    inProgress: compMap["IN_PROGRESS"] ?? 0,
                    resolved:   compMap["RESOLVED"]    ?? 0,
                    rejected:   compMap["REJECTED"]    ?? 0,
                },
                transactions: {
                    total:   totalTx,
                    success: txMap["SUCCESS"]?.count ?? 0,
                    pending: txMap["PENDING"]?.count ?? 0,
                    failed:  txMap["FAILED"]?.count  ?? 0,
                    revenue: totalTxRevenue,
                },
                subscriptions: {
                    total:     totalSub,
                    active:    subMap["ACTIVE"]?.count    ?? 0,
                    cancelled: subMap["CANCELLED"]?.count ?? 0,
                    expired:   subMap["EXPIRED"]?.count   ?? 0,
                    revenue:   totalSubRevenue,
                },
                atsRecords: {
                    total:    atsStats[0]?.total    ?? 0,
                    avgScore: Math.round(atsStats[0]?.avgScore ?? 0),
                },
                resumes: {
                    available: resumeFormatCount,
                    formatCount: resumeFormatCount,
                    unlimitedPlans: 0,
                    topTemplates: resumeTemplateUsage,
                    mostUsedTemplate,
                },
                cvs: {
                    total:       cvTotal,
                    thisWeek:    cvThisWeek,
                    uniqueUsers: cvUniqueUsers,
                },
                quizzes: (() => {
                    const qMap = Object.fromEntries((quizStatusAgg as any[]).map((s: any) => [s._id, s.count]));
                    const qTotal = (Object.values(qMap) as number[]).reduce((s, v) => s + v, 0);
                    return {
                        total:        qTotal,
                        inactive:     qMap["INACTIVE"]  ?? 0,
                        active:       qMap["ACTIVE"]    ?? 0,
                        published:    qMap["PUBLISHED"] ?? 0,
                        participants: totalQuizParticipants,
                    };
                })(),
            };

            // ── 2. Period-specific counts ────────────────────────────────────
            const [
                periodUsers,
                periodTx,
                periodSub,
                periodAts,
                periodComp,
                periodQuizzes,
            ] = await Promise.all([
                User.countDocuments(matchDate),
                PaymentOrder.aggregate([
                    { $match: matchDate },
                    { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$amount" } } }
                ]),
                Subscription.aggregate([
                    { $match: matchDate },
                    { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$planPrice" } } }
                ]),
                AtsRecord.aggregate([
                    { $match: matchDate },
                    { $group: { _id: null, total: { $sum: 1 }, avgScore: { $avg: "$analysis.score" } } }
                ]),
                Complaint.countDocuments(matchDate),
                QuizParticipation.countDocuments(matchDate),
            ]);

            const ptxMap: Record<string, { count: number; revenue: number }> = {};
            for (const t of periodTx as any[]) ptxMap[t._id] = { count: t.count, revenue: t.revenue };
            const ptxTotal = Object.values(ptxMap).reduce((s, v) => s + v.count, 0);

            const psubMap: Record<string, { count: number; revenue: number }> = {};
            for (const s of periodSub as any[]) psubMap[s._id] = { count: s.count, revenue: s.revenue };
            const psubTotal = Object.values(psubMap).reduce((s, v) => s + v.count, 0);

            const periodStats = {
                users: periodUsers,
                transactions: {
                    total:   ptxTotal,
                    success: ptxMap["SUCCESS"]?.count ?? 0,
                    failed:  ptxMap["FAILED"]?.count  ?? 0,
                    pending: ptxMap["PENDING"]?.count ?? 0,
                    revenue: Math.round(((ptxMap["SUCCESS"]?.revenue ?? 0) / 100) * 100) / 100,
                },
                subscriptions: {
                    total:   psubTotal,
                    active:  psubMap["ACTIVE"]?.count ?? 0,
                    revenue: Object.values(psubMap).reduce((s, v) => s + v.revenue, 0),
                },
                atsRecords: {
                    total:    periodAts[0]?.total    ?? 0,
                    avgScore: Math.round(periodAts[0]?.avgScore ?? 0),
                },
                complaints: periodComp,
                quizParticipations: periodQuizzes,
            };

            // ── 3. Time-series data ──────────────────────────────────────────
            const [
                txSeries,
                subSeries,
                userSeries,
                atsSeries,
                compSeries,
                cvSeriesRaw,
                quizSeriesRaw,
            ] = await Promise.all([
                PaymentOrder.aggregate([
                    { $match: matchDate },
                    { $group: {
                        _id: { $dateToString: { format: fmt, date: "$createdAt" } },
                        success: { $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] } },
                        failed:  { $sum: { $cond: [{ $eq: ["$status", "FAILED"]  }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
                        revenue: { $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, { $divide: ["$amount", 100] }, 0] } },
                    }},
                    { $sort: { _id: 1 } },
                ]),
                Subscription.aggregate([
                    { $match: matchDate },
                    { $group: {
                        _id:     { $dateToString: { format: fmt, date: "$createdAt" } },
                        count:   { $sum: 1 },
                        revenue: { $sum: "$planPrice" },
                    }},
                    { $sort: { _id: 1 } },
                ]),
                User.aggregate([
                    { $match: matchDate },
                    { $group: {
                        _id:   { $dateToString: { format: fmt, date: "$createdAt" } },
                        count: { $sum: 1 },
                    }},
                    { $sort: { _id: 1 } },
                ]),
                AtsRecord.aggregate([
                    { $match: matchDate },
                    { $group: {
                        _id:      { $dateToString: { format: fmt, date: "$createdAt" } },
                        count:    { $sum: 1 },
                        avgScore: { $avg: "$analysis.score" },
                    }},
                    { $sort: { _id: 1 } },
                ]),
                Complaint.aggregate([
                    { $match: matchDate },
                    { $group: {
                        _id:   { $dateToString: { format: fmt, date: "$createdAt" } },
                        count: { $sum: 1 },
                    }},
                    { $sort: { _id: 1 } },
                ]),
                ResumeDownload.aggregate([
                    { $match: { source: "my-cvs-ai", ...(dateFilter ? { createdAt: dateFilter } : {}) } },
                    { $group: {
                        _id:   { $dateToString: { format: fmt, date: "$createdAt" } },
                        count: { $sum: 1 },
                    }},
                    { $sort: { _id: 1 } },
                ]),
                QuizParticipation.aggregate([
                    { $match: matchDate },
                    { $group: {
                        _id:   { $dateToString: { format: fmt, date: "$createdAt" } },
                        count: { $sum: 1 },
                    }},
                    { $sort: { _id: 1 } },
                ]),
            ]);

            const series = {
                transactions: fillSeries(buckets, txSeries as any, { success: 0, failed: 0, pending: 0, revenue: 0 }, period),
                subscriptions: fillSeries(buckets, subSeries as any, { count: 0, revenue: 0 }, period),
                users:         fillSeries(buckets, userSeries as any, { count: 0 }, period),
                atsRecords:    fillSeries(buckets, atsSeries as any, { count: 0, avgScore: 0 }, period),
                complaints:    fillSeries(buckets, compSeries as any, { count: 0 }, period),
                cvs:           fillSeries(buckets, cvSeriesRaw as any, { count: 0 }, period),
                quizzes:       fillSeries(buckets, quizSeriesRaw as any, { count: 0 }, period),
            };

            // Combine revenue series
            const revenueMap = new Map<string, { label: string; transactions: number; subscriptions: number }>();
            for (const t of series.transactions) revenueMap.set(t.label, { label: t.label, transactions: t.revenue, subscriptions: 0 });
            for (const s of series.subscriptions) {
                const existing = revenueMap.get(s.label);
                if (existing) existing.subscriptions = s.revenue;
                else revenueMap.set(s.label, { label: s.label, transactions: 0, subscriptions: s.revenue });
            }
            const revenueSeries = Array.from(revenueMap.values());

            return NextResponse.json({
                success: true,
                data: { period, global, periodStats, series: { ...series, revenue: revenueSeries } },
            });
        } catch (error: any) {
            console.error("[analytics]", error);
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
