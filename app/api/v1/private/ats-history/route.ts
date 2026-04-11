import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { decrypt } from "@/app/configs/crypto.config";
import { AtsRecord } from "@/models/AtsRecord";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

// ─── GET — all ATS records with stats (admin/history view) ───────────────────
// Requires: GET /api/v1/private/ats-history privilege.

export const GET = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    const deny = await checkPrivilege(_user, "GET", "/api/v1/private/ats-history");
    if (deny) return deny;

    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page        = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
        const limit       = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
        const search      = searchParams.get("search")?.trim() ?? "";
        const scoreFilter = searchParams.get("scoreFilter") ?? "all"; // all | high | medium | low

        // ── Build per-request filter ──
        const filter: Record<string, any> = {};
        if (search) {
            filter.jobRoleName = { $regex: search, $options: "i" };
        }
        if (scoreFilter === "high")   filter["analysis.score"] = { $gte: 80 };
        if (scoreFilter === "medium") filter["analysis.score"] = { $gte: 60, $lt: 80 };
        if (scoreFilter === "low")    filter["analysis.score"] = { $lt: 60 };

        // ── Aggregate stats over the FULL collection (no per-request filter) ──
        const [agg] = await AtsRecord.aggregate([
            {
                $group: {
                    _id:          null,
                    totalRecords: { $sum: 1 },
                    avgScore:     { $avg: "$analysis.score" },
                    highMatch:    { $sum: { $cond: [{ $gte: ["$analysis.score", 80] }, 1, 0] } },
                    mediumMatch:  { $sum: { $cond: [{ $and: [{ $gte: ["$analysis.score", 60] }, { $lt: ["$analysis.score", 80] }] }, 1, 0] } },
                    lowMatch:     { $sum: { $cond: [{ $lt: ["$analysis.score", 60] }, 1, 0] } },
                    avgSkills:    { $avg: "$analysis.sectionScores.skills" },
                    avgExperience:{ $avg: "$analysis.sectionScores.experience" },
                    avgProjects:  { $avg: "$analysis.sectionScores.projects" },
                    avgEducation: { $avg: "$analysis.sectionScores.education" },
                },
            },
        ]);

        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - 7);
        const [thisWeekCount, uniqueUsersArr] = await Promise.all([
            AtsRecord.countDocuments({ createdAt: { $gte: thisWeekStart } }),
            AtsRecord.distinct("userId"),
        ]);

        const stats = agg
            ? {
                totalRecords: agg.totalRecords,
                uniqueUsers:  uniqueUsersArr.length,
                avgScore:     Math.round(agg.avgScore ?? 0),
                highMatch:    agg.highMatch,
                mediumMatch:  agg.mediumMatch,
                lowMatch:     agg.lowMatch,
                thisWeek:     thisWeekCount,
                avgSectionScores: {
                    skills:     Math.round(agg.avgSkills     ?? 0),
                    experience: Math.round(agg.avgExperience ?? 0),
                    projects:   Math.round(agg.avgProjects   ?? 0),
                    education:  Math.round(agg.avgEducation  ?? 0),
                },
            }
            : {
                totalRecords: 0, uniqueUsers: 0, avgScore: 0,
                highMatch: 0, mediumMatch: 0, lowMatch: 0, thisWeek: 0,
                avgSectionScores: { skills: 0, experience: 0, projects: 0, education: 0 },
            };

        // ── Paginate filtered records ──
        const total = await AtsRecord.countDocuments(filter);
        const pages = Math.max(1, Math.ceil(total / limit));
        const skip  = (page - 1) * limit;

        const rawRecords = await AtsRecord.find(filter)
            .populate("modelId", "displayName provider modelName")
            .populate("userId",  "fullname email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // ── Resolve display fields ──
        // userEmail in AtsRecord is always encrypted via encrypt() in POST handler.
        // User.email in the User model may also be encrypted, so we decrypt userEmail directly.
        const records = rawRecords.map((r) => {
            const obj = r.toObject() as any;
            const populatedUser = obj.userId as any;
            obj.userDisplayName  = populatedUser?.fullname ?? "—";
            try { obj.userDisplayEmail = decrypt(obj.userEmail); } catch { obj.userDisplayEmail = "—"; }
            return obj;
        });

        return NextResponse.json(
            { stats, records, pagination: { total, page, pages, limit } },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
