/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { decrypt } from "@/app/configs/crypto.config";
import { AtsRecord } from "@/models/AtsRecord";
import Subscription from "@/models/Subscription";
import Complaint from "@/models/Complaint";
import { User } from "@/models/User";
import ResumeDownload from "@/models/ResumeDownload";
import QuizParticipation from "@/models/QuizParticipation";
import { resolveSubscriptionQuota } from "@/app/utils/subscription-usage";

export type Period = "today" | "7d" | "30d" | "6m" | "all";

// ─── Period helpers (same as admin analytics) ─────────────────────────────────

function getPeriodStart(period: Period): Date | null {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === "today") return today;
    if (period === "7d")  { const d = new Date(today); d.setDate(d.getDate() - 6); return d; }
    if (period === "30d") { const d = new Date(today); d.setDate(d.getDate() - 29); return d; }
    if (period === "6m")  { const d = new Date(today); d.setMonth(d.getMonth() - 5); d.setDate(1); return d; }
    return null;
}

function getGroupFormat(period: Period): string {
    if (period === "today") return "%Y-%m-%dT%H";
    if (period === "7d" || period === "30d") return "%Y-%m-%d";
    return "%Y-%m";
}

function buildBuckets(period: Period, start: Date | null): string[] {
    const now = new Date();
    if (period === "today") {
        return Array.from({ length: now.getHours() + 1 }, (_, h) => {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(h).padStart(2,"0")}`;
        });
    }
    if (period === "7d" || period === "30d") {
        const days = period === "7d" ? 7 : 30;
        return Array.from({ length: days }, (_, i) => {
            const d = new Date(start!);
            d.setDate(d.getDate() + i);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        });
    }
    const months: string[] = [];
    const cursor = start ? new Date(start.getFullYear(), start.getMonth(), 1) : new Date(2024, 0, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    while (cursor <= end) {
        months.push(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}`);
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
}

function bucketLabel(key: string, period: Period): string {
    if (period === "today") {
        const h = parseInt(key.split("T")[1], 10);
        return `${String(h).padStart(2,"0")}:00`;
    }
    if (period === "7d" || period === "30d") {
        const [, m, d] = key.split("-");
        return `${d} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m,10)-1]}`;
    }
    const [y, m] = key.split("-");
    return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m,10)-1]} ${y}`;
}

function fillSeries<T extends Record<string, any>>(
    buckets: string[],
    data: Array<{ _id: string } & T>,
    defaults: T,
    period: Period,
): Array<{ label: string } & T> {
    const map = new Map(data.map((d) => [d._id, d]));
    return buckets.map((b) => {
        const row = map.get(b);
        return { label: bucketLabel(b, period), ...defaults, ...(row ? { ...row, _id: undefined } : {}) };
    });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const GET = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const url    = new URL(req.url);
            const period = (url.searchParams.get("period") ?? "7d") as Period;
            const start  = getPeriodStart(period);
            const fmt    = getGroupFormat(period);
            const buckets = buildBuckets(period, start);

            const encEmail = user.email; // JWT email is already encrypted (matches AtsRecord.userEmail)
            const decEmail = decrypt(user.email); // plain email for Subscription queries
            const atsAllTimeMatch  = { userEmail: encEmail };
            const atsPeriodMatch   = start ? { userEmail: encEmail, createdAt: { $gte: start } } : { userEmail: encEmail };
            const subAllTimeMatch  = { userEmail: decEmail };
            const subPeriodMatch   = start ? { userEmail: decEmail, createdAt: { $gte: start } } : { userEmail: decEmail };
            const compAllTimeMatch = { userId: user.sub };
            const compPeriodMatch  = start ? { userId: user.sub, createdAt: { $gte: start } } : { userId: user.sub };
            const resumeAllTimeMatch = { userId: user.sub };
            const resumePeriodMatch = start ? { userId: user.sub, createdAt: { $gte: start } } : { userId: user.sub };
            const cvAllTimeMatch  = { userId: user.sub, source: "my-cvs-ai" };
            const cvPeriodMatch   = start ? { userId: user.sub, source: "my-cvs-ai", createdAt: { $gte: start } } : { userId: user.sub, source: "my-cvs-ai" };
            const quizAllTimeMatch = { userId: user.sub };
            const quizPeriodMatch  = start ? { userId: user.sub, createdAt: { $gte: start } } : { userId: user.sub };

            // ── All-time aggregations ──────────────────────────────────────
            const [
                atsAllTime,
                sectionScoresAgg,
                topJobRoles,
                subStats,
                complaintStats,
                userDoc,
                totalResumeDownloads,
                topResumeTemplate,
                recentResumeDownloads,
                activeSubscriptions,
                totalCvGenerations,
                totalQuizParticipations,
                quizAvgScore,
            ] = await Promise.all([
                AtsRecord.aggregate([
                    { $match: atsAllTimeMatch },
                    { $group: { _id: null, total: { $sum: 1 }, avgScore: { $avg: "$analysis.score" } } },
                ]),
                AtsRecord.aggregate([
                    { $match: atsAllTimeMatch },
                    { $group: {
                        _id:        null,
                        skills:     { $avg: "$analysis.sectionScores.skills"     },
                        experience: { $avg: "$analysis.sectionScores.experience" },
                        projects:   { $avg: "$analysis.sectionScores.projects"   },
                        education:  { $avg: "$analysis.sectionScores.education"  },
                    }},
                ]),
                AtsRecord.aggregate([
                    { $match: atsAllTimeMatch },
                    { $group: { _id: "$jobRoleName", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 6 },
                ]),
                Subscription.aggregate([
                    { $match: subAllTimeMatch },
                    { $group: { _id: "$status", count: { $sum: 1 } } },
                ]),
                Complaint.aggregate([
                    { $match: compAllTimeMatch },
                    { $group: { _id: "$status", count: { $sum: 1 } } },
                ]),
                User.findById(user.sub).select("fullname role accountStatus createdAt").lean(),
                ResumeDownload.countDocuments(resumeAllTimeMatch),
                ResumeDownload.aggregate([
                    { $match: resumeAllTimeMatch },
                    {
                        $group: {
                            _id: {
                                templateId: "$templateId",
                                templateName: "$templateName",
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { count: -1 } },
                    { $limit: 1 },
                ]),
                ResumeDownload.find(resumeAllTimeMatch)
                    .sort({ createdAt: -1 })
                    .limit(15)
                    .lean(),
                Subscription.find({
                    userEmail: decEmail,
                    status: "ACTIVE",
                })
                    .sort({ createdAt: -1 })
                    .lean(),
                ResumeDownload.countDocuments(cvAllTimeMatch),
                QuizParticipation.countDocuments(quizAllTimeMatch),
                QuizParticipation.aggregate([
                    { $match: quizAllTimeMatch },
                    { $group: { _id: null, avgPct: { $avg: "$percentage" }, best: { $max: "$percentage" } } },
                ]),
            ]);

            const activeSubscriptionQuotas = await Promise.all(
                (activeSubscriptions as any[]).map(async (sub) => ({
                    sub,
                    quota: await resolveSubscriptionQuota(sub),
                }))
            );

            const subUpdates: any[] = [];
            let hasUnlimitedResumes = false;
            let availableResumes = 0;
            let activeResumePlans = 0;

            for (const { sub, quota } of activeSubscriptionQuotas) {
                const update: Record<string, unknown> = {};

                if (quota.shouldPersistResolvedMaxUsage) {
                    update.maxUsage = quota.maxUsage;
                }

                if (quota.maxUsage > 0 && !quota.hasUsage) {
                    update.status = "EXPIRED";
                }

                if (Object.keys(update).length > 0) {
                    subUpdates.push({
                        updateOne: {
                            filter: { _id: sub._id },
                            update: { $set: update },
                        },
                    });
                }

                if (quota.maxUsage === 0) {
                    hasUnlimitedResumes = true;
                    activeResumePlans += 1;
                    continue;
                }

                if (quota.hasUsage) {
                    availableResumes += quota.remaining ?? 0;
                    activeResumePlans += 1;
                }
            }

            if (subUpdates.length > 0) {
                await Subscription.bulkWrite(subUpdates);
            }

            const subMap  = Object.fromEntries((subStats  as any[]).map((s) => [s._id, s.count]));
            const compMap = Object.fromEntries((complaintStats as any[]).map((c) => [c._id, c.count]));
            const sec     = sectionScoresAgg[0] ?? {};

            const global = {
                profile: {
                    name:        (userDoc as any)?.fullname  ?? user.name,
                    email:       decEmail,
                    role:        (userDoc as any)?.role      ?? user.role,
                    status:      (userDoc as any)?.accountStatus ?? user.status,
                    memberSince: (userDoc as any)?.createdAt ?? null,
                },
                ats: {
                    total:    atsAllTime[0]?.total    ?? 0,
                    avgScore: Math.round(atsAllTime[0]?.avgScore ?? 0),
                },
                sectionScores: {
                    skills:     Math.round(sec.skills     ?? 0),
                    experience: Math.round(sec.experience ?? 0),
                    projects:   Math.round(sec.projects   ?? 0),
                    education:  Math.round(sec.education  ?? 0),
                },
                topJobRoles: (topJobRoles as any[]).map((r) => ({
                    role:  r._id || "Unknown",
                    count: r.count,
                })),
                subscriptions: {
                    total:     (Object.values(subMap)  as number[]).reduce((s, v) => s + v, 0),
                    active:    subMap["ACTIVE"]    ?? 0,
                    cancelled: subMap["CANCELLED"] ?? 0,
                    expired:   subMap["EXPIRED"]   ?? 0,
                },
                resumes: {
                    total: totalResumeDownloads ?? 0,
                    available: hasUnlimitedResumes ? null : availableResumes,
                    hasUnlimited: hasUnlimitedResumes,
                    activePlans: activeResumePlans,
                    mostUsedTemplate: topResumeTemplate[0]
                        ? {
                            templateId: topResumeTemplate[0]._id?.templateId || "",
                            templateName: topResumeTemplate[0]._id?.templateName || "Unknown",
                            count: topResumeTemplate[0].count ?? 0,
                        }
                        : null,
                },
                complaints: {
                    total:      (Object.values(compMap) as number[]).reduce((s, v) => s + v, 0),
                    pending:    compMap["PENDING"]     ?? 0,
                    inProgress: compMap["IN_PROGRESS"] ?? 0,
                    resolved:   compMap["RESOLVED"]    ?? 0,
                    rejected:   compMap["REJECTED"]    ?? 0,
                },
                cvs: {
                    total: totalCvGenerations ?? 0,
                },
                quizzes: {
                    total:    totalQuizParticipations ?? 0,
                    avgScore: Math.round((quizAvgScore as any[])[0]?.avgPct ?? 0),
                    best:     (quizAvgScore as any[])[0]?.best ?? 0,
                },
            };

            // ── Period stats ───────────────────────────────────────────────
            const [periodAts, periodSubs, periodComps, periodResumeDownloads, periodCvGenerations, periodQuizParticipations] = await Promise.all([
                AtsRecord.aggregate([
                    { $match: atsPeriodMatch },
                    { $group: { _id: null, total: { $sum: 1 }, avgScore: { $avg: "$analysis.score" } } },
                ]),
                Subscription.countDocuments(subPeriodMatch),
                Complaint.countDocuments(compPeriodMatch),
                ResumeDownload.countDocuments(resumePeriodMatch),
                ResumeDownload.countDocuments(cvPeriodMatch),
                QuizParticipation.countDocuments(quizPeriodMatch),
            ]);

            const periodStats = {
                ats: {
                    total:    periodAts[0]?.total    ?? 0,
                    avgScore: Math.round(periodAts[0]?.avgScore ?? 0),
                },
                subscriptions: periodSubs,
                resumes: periodResumeDownloads,
                complaints:    periodComps,
                cvs:    periodCvGenerations,
                quizzes: periodQuizParticipations,
            };

            // ── Time-series ────────────────────────────────────────────────
            const [atsSeries, cvSeriesRaw, quizSeriesRaw] = await Promise.all([
                AtsRecord.aggregate([
                    { $match: atsPeriodMatch },
                    { $group: {
                        _id:      { $dateToString: { format: fmt, date: "$createdAt" } },
                        count:    { $sum: 1 },
                        avgScore: { $avg: "$analysis.score" },
                    }},
                    { $sort: { _id: 1 } },
                ]),
                ResumeDownload.aggregate([
                    { $match: cvPeriodMatch },
                    { $group: {
                        _id:   { $dateToString: { format: fmt, date: "$createdAt" } },
                        count: { $sum: 1 },
                    }},
                    { $sort: { _id: 1 } },
                ]),
                QuizParticipation.aggregate([
                    { $match: quizPeriodMatch },
                    { $group: {
                        _id:   { $dateToString: { format: fmt, date: "$createdAt" } },
                        count: { $sum: 1 },
                    }},
                    { $sort: { _id: 1 } },
                ]),
            ]);

            const series = {
                ats: fillSeries(buckets, atsSeries as any, { count: 0, avgScore: 0 }, period),
                cvs:    fillSeries(buckets, cvSeriesRaw    as any, { count: 0 }, period),
                quizzes: fillSeries(buckets, quizSeriesRaw as any, { count: 0 }, period),
            };

            const recentResumes = (recentResumeDownloads as any[]).map((resume) => ({
                _id: resume._id?.toString?.() ?? String(resume._id),
                templateId: resume.templateId,
                templateName: resume.templateName,
                fileName: resume.fileName,
                resumeName: resume.resumeName || "",
                resumeTitle: resume.resumeTitle || "",
                source: resume.source || "resume-config",
                createdAt: resume.createdAt,
            }));

            return NextResponse.json({
                success: true,
                data: { period, global, periodStats, series, recentResumes },
            });
        } catch (error: any) {
            console.error("[my-analytics]", error);
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
