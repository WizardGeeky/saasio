/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import Quiz from "@/models/Quiz";
import QuizParticipation from "@/models/QuizParticipation";

export const GET = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(user, "GET", "/api/v1/private/quizzes");
        if (deny) return deny;

        try {
            await connectDB();

            const { searchParams } = new URL(req.url);
            const page       = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
            const limit      = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
            const search     = searchParams.get("search")?.trim()  ?? "";
            const statusFilter = searchParams.get("status")?.trim() ?? "all";
            const dateRange  = searchParams.get("dateRange")?.trim() ?? "all";
            const skip       = (page - 1) * limit;

            const [statsAgg, totalParticipants] = await Promise.all([
                Quiz.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
                QuizParticipation.countDocuments(),
            ]);

            const statsMap = Object.fromEntries((statsAgg as any[]).map((s) => [s._id, s.count]));
            const totalQuizzes = (Object.values(statsMap) as number[]).reduce((s, v) => s + v, 0);

            const stats = {
                total:             totalQuizzes,
                inactive:          statsMap["INACTIVE"]  ?? 0,
                active:            statsMap["ACTIVE"]    ?? 0,
                published:         statsMap["PUBLISHED"] ?? 0,
                totalParticipants,
            };

            const conditions: Record<string, any>[] = [];

            if (search) {
                const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
                conditions.push({ $or: [{ title: re }, { createdByName: re }] });
            }

            if (statusFilter !== "all") {
                conditions.push({ status: statusFilter.toUpperCase() });
            }

            if (dateRange !== "all") {
                const since = new Date();
                if (dateRange === "today") since.setHours(0, 0, 0, 0);
                else if (dateRange === "week")  since.setDate(since.getDate() - 7);
                else if (dateRange === "month") since.setMonth(since.getMonth() - 1);
                conditions.push({ createdAt: { $gte: since } });
            }

            const filter = conditions.length > 0 ? { $and: conditions } : {};
            const total  = await Quiz.countDocuments(filter);
            const pages  = Math.max(1, Math.ceil(total / limit));

            const raw = await Quiz.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const records = (raw as any[]).map((q) => ({
                _id:              String(q._id),
                title:            q.title,
                instructions:     q.instructions ?? [],
                price:            q.price,
                currency:         q.currency,
                status:           q.status,
                questionCount:    (q.questions ?? []).length,
                participantCount: q.participantCount ?? 0,
                createdByName:    q.createdByName,
                createdAt:        q.createdAt,
            }));

            return NextResponse.json({ stats, records, pagination: { total, page, pages, limit } }, { status: 200 });
        } catch (error: any) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
    }
);

export const POST = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(user, "POST", "/api/v1/private/quizzes");
        if (deny) return deny;

        try {
            await connectDB();

            const body = await req.json();
            const { title, instructions, price, currency, status, questions } = body;

            if (!title?.trim()) {
                return NextResponse.json({ message: "Quiz title is required." }, { status: 400 });
            }
            if (!Array.isArray(questions) || questions.length === 0) {
                return NextResponse.json({ message: "At least one question is required." }, { status: 400 });
            }

            for (const q of questions) {
                if (!q.text?.trim())
                    return NextResponse.json({ message: "Each question must have text." }, { status: 400 });
                if (!Array.isArray(q.options) || q.options.length < 2)
                    return NextResponse.json({ message: "Each question needs at least 2 options." }, { status: 400 });
                if (typeof q.correctOption !== "number" || q.correctOption < 0 || q.correctOption >= q.options.length)
                    return NextResponse.json({ message: "Invalid correct option index." }, { status: 400 });
            }

            const validStatuses = ["INACTIVE", "ACTIVE", "PUBLISHED"];
            const quizStatus = validStatuses.includes(status?.toUpperCase()) ? status.toUpperCase() : "INACTIVE";

            const quiz = await Quiz.create({
                title:        title.trim(),
                instructions: Array.isArray(instructions) ? instructions.filter((i: string) => i?.trim()) : [],
                price:        Math.max(0, Number(price) || 0),
                currency:     currency || "INR",
                status:       quizStatus,
                questions:    questions.map((q: any) => ({
                    text:          q.text.trim(),
                    options:       (q.options as string[]).map((o) => o.trim()).filter(Boolean),
                    correctOption: q.correctOption,
                    points:        Math.max(1, Number(q.points) || 1),
                })),
                createdBy:      user.sub,
                createdByName:  user.name,
                createdByEmail: user.email,
            });

            return NextResponse.json(
                { success: true, quiz: { _id: String(quiz._id), title: quiz.title } },
                { status: 201 }
            );
        } catch (error: any) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
    }
);
