/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import QuizParticipation from "@/models/QuizParticipation";
import Quiz from "@/models/Quiz";

export const GET = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(user, "GET", "/api/v1/private/quiz-participations");
        if (deny) return deny;

        try {
            await connectDB();

            const { searchParams } = new URL(req.url);
            const page      = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
            const limit     = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
            const search    = searchParams.get("search")?.trim()    ?? "";
            const quizId    = searchParams.get("quizId")?.trim()    ?? "";
            const dateRange = searchParams.get("dateRange")?.trim() ?? "all";
            const skip      = (page - 1) * limit;

            const conditions: Record<string, any>[] = [];

            if (search) {
                const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
                conditions.push({ $or: [{ userName: re }, { userEmail: re }, { quizTitle: re }] });
            }
            if (quizId) conditions.push({ quizId });

            if (dateRange !== "all") {
                const since = new Date();
                if (dateRange === "today") since.setHours(0, 0, 0, 0);
                else if (dateRange === "week")  since.setDate(since.getDate() - 7);
                else if (dateRange === "month") since.setMonth(since.getMonth() - 1);
                conditions.push({ createdAt: { $gte: since } });
            }

            const filter = conditions.length > 0 ? { $and: conditions } : {};

            const [quizStats, total, allQuizzes] = await Promise.all([
                QuizParticipation.aggregate([
                    { $group: {
                        _id:           { quizId: "$quizId", quizTitle: "$quizTitle" },
                        count:         { $sum: 1 },
                        avgPercentage: { $avg: "$percentage" },
                    }},
                    { $sort: { count: -1 } },
                    { $limit: 50 },
                ]),
                QuizParticipation.countDocuments(filter),
                Quiz.find({}, { title: 1 }).sort({ title: 1 }).lean(),
            ]);

            const pages = Math.max(1, Math.ceil(total / limit));

            const raw = await QuizParticipation.find(filter, {
                quizId: 1, quizTitle: 1, userId: 1, userName: 1, userEmail: 1,
                score: 1, totalQuestions: 1, percentage: 1, createdAt: 1,
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const records = (raw as any[]).map((r) => ({
                _id:            String(r._id),
                quizId:         r.quizId,
                quizTitle:      r.quizTitle,
                userId:         r.userId,
                userName:       r.userName,
                userEmail:      r.userEmail,
                score:          r.score,
                totalQuestions: r.totalQuestions,
                percentage:     r.percentage,
                createdAt:      r.createdAt,
            }));

            const quizDropdown = (allQuizzes as any[]).map((q) => ({ _id: String(q._id), title: q.title }));

            const quizSummary = (quizStats as any[]).map((s) => ({
                quizId:        s._id.quizId,
                quizTitle:     s._id.quizTitle,
                count:         s.count,
                avgPercentage: Math.round(s.avgPercentage ?? 0),
            }));

            return NextResponse.json(
                { quizSummary, records, pagination: { total, page, pages, limit }, quizDropdown },
                { status: 200 }
            );
        } catch (error: any) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
    }
);
