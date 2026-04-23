/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import Quiz from "@/models/Quiz";
import QuizParticipation from "@/models/QuizParticipation";
import PaymentOrder from "@/models/PaymentOrder";

export const GET = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const { searchParams } = new URL(req.url);
            const tab   = searchParams.get("tab")   ?? "available";
            const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
            const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
            const skip  = (page - 1) * limit;

            // ── Leaderboard tab ────────────────────────────────────────────
            if (tab === "leaderboard") {
                const quizId = searchParams.get("quizId") ?? "";
                if (!quizId) return NextResponse.json({ message: "quizId is required." }, { status: 400 });

                const quiz = await Quiz.findById(quizId).lean() as any;
                if (!quiz) return NextResponse.json({ message: "Quiz not found." }, { status: 404 });

                const entries = await QuizParticipation.find({ quizId }, {
                    userId: 1, userName: 1, score: 1, totalQuestions: 1,
                    percentage: 1, timeTakenSeconds: 1, createdAt: 1,
                }).lean();

                const maxScore = (quiz.questions ?? []).reduce((s: number, q: any) => s + (q.points ?? 1), 0);

                const ranked = (entries as any[])
                    .sort((a, b) =>
                        b.percentage - a.percentage ||
                        (a.timeTakenSeconds ?? 99999) - (b.timeTakenSeconds ?? 99999)
                    )
                    .map((e, idx) => ({
                        rank:             idx + 1,
                        userId:           e.userId,
                        userName:         e.userName,
                        score:            e.score,
                        maxScore,
                        percentage:       e.percentage,
                        timeTakenSeconds: e.timeTakenSeconds ?? 0,
                        submittedAt:      e.createdAt,
                        isMe:             e.userId === user.sub,
                    }));

                const myEntry = ranked.find((r) => r.isMe);
                return NextResponse.json({
                    success:     true,
                    quizTitle:   quiz.title,
                    prizeMoney:  quiz.prizeMoney ?? 0,
                    currency:    quiz.currency ?? "INR",
                    leaderboard: ranked,
                    myRank:      myEntry?.rank ?? null,
                }, { status: 200 });
            }

            // ── Available tab ──────────────────────────────────────────────
            if (tab === "available") {
                const [quizzes, userParticipations] = await Promise.all([
                    Quiz.find({ status: "PUBLISHED" }).sort({ createdAt: -1 }).lean(),
                    QuizParticipation.find({ userId: user.sub }, { quizId: 1, percentage: 1, score: 1 }).lean(),
                ]);

                const participatedMap = new Map(
                    (userParticipations as any[]).map((p) => [p.quizId, { percentage: p.percentage, score: p.score }])
                );

                const result = (quizzes as any[]).map((q) => {
                    const participation = participatedMap.get(String(q._id));
                    return {
                        _id:              String(q._id),
                        title:            q.title,
                        instructions:     q.instructions ?? [],
                        price:            q.price,
                        prizeMoney:       q.prizeMoney ?? 0,
                        currency:         q.currency,
                        participantCount: q.participantCount ?? 0,
                        createdByName:    q.createdByName,
                        questionCount:    (q.questions ?? []).length,
                        questions:        (q.questions ?? []).map((qq: any, idx: number) => ({
                            index:   idx,
                            text:    qq.text,
                            options: qq.options,
                            points:  qq.points,
                        })),
                        participated:    !!participation,
                        myScore:         participation?.score      ?? null,
                        myPercentage:    participation?.percentage ?? null,
                        createdAt:       q.createdAt,
                    };
                });

                return NextResponse.json({ success: true, quizzes: result }, { status: 200 });
            }

            // ── History tab ────────────────────────────────────────────────
            const [total, participations] = await Promise.all([
                QuizParticipation.countDocuments({ userId: user.sub }),
                QuizParticipation.find({ userId: user.sub }, {
                    quizId: 1, quizTitle: 1, score: 1, totalQuestions: 1,
                    percentage: 1, timeTakenSeconds: 1, createdAt: 1,
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
            ]);

            const pages   = Math.max(1, Math.ceil(total / limit));
            const history = (participations as any[]).map((p) => ({
                _id:              String(p._id),
                quizId:           p.quizId,
                quizTitle:        p.quizTitle,
                score:            p.score,
                totalQuestions:   p.totalQuestions,
                percentage:       p.percentage,
                timeTakenSeconds: p.timeTakenSeconds ?? 0,
                createdAt:        p.createdAt,
            }));

            return NextResponse.json({ success: true, history, pagination: { total, page, pages, limit } }, { status: 200 });
        } catch (error: any) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
    }
);

export const POST = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const { quizId, answers, timeTakenSeconds } = await req.json();

            if (!quizId)
                return NextResponse.json({ message: "Quiz ID is required." }, { status: 400 });
            if (!Array.isArray(answers))
                return NextResponse.json({ message: "Answers must be an array." }, { status: 400 });

            const quiz = await Quiz.findById(quizId).lean() as any;
            if (!quiz)
                return NextResponse.json({ message: "Quiz not found." }, { status: 404 });
            if (quiz.status !== "PUBLISHED")
                return NextResponse.json({ message: "This quiz is not available." }, { status: 400 });

            // Payment gate — paid quizzes require a verified PaymentOrder
            if (quiz.price > 0) {
                const paid = await PaymentOrder.findOne({
                    userId: user.sub,
                    status: "SUCCESS",
                    "notes.quizId": quizId,
                });
                if (!paid) {
                    return NextResponse.json(
                        { message: "Payment required to participate in this quiz.", requiresPayment: true },
                        { status: 402 }
                    );
                }
            }

            const existing = await QuizParticipation.findOne({ quizId, userId: user.sub });
            if (existing)
                return NextResponse.json({ message: "You have already participated in this quiz." }, { status: 409 });

            const questions      = quiz.questions ?? [];
            const totalQuestions = questions.length;
            let score = 0;

            for (const answer of answers) {
                const q = questions[answer.questionIndex];
                if (q && q.correctOption === answer.selectedOption) {
                    score += q.points ?? 1;
                }
            }

            const maxScore   = questions.reduce((s: number, q: any) => s + (q.points ?? 1), 0);
            const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

            const participation = await QuizParticipation.create({
                quizId:           String(quiz._id),
                quizTitle:        quiz.title,
                userId:           user.sub,
                userName:         user.name,
                userEmail:        user.email,
                score,
                totalQuestions,
                percentage,
                timeTakenSeconds: Math.max(0, Number(timeTakenSeconds) || 0),
                answers:          answers.map((a: any) => ({
                    questionIndex:  a.questionIndex,
                    selectedOption: a.selectedOption,
                })),
            });

            await Quiz.findByIdAndUpdate(quizId, { $inc: { participantCount: 1 } });

            return NextResponse.json(
                { success: true, result: { score, totalQuestions, percentage, maxScore, participationId: String(participation._id) } },
                { status: 201 }
            );
        } catch (error: any) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
    }
);
