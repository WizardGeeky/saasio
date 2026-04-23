/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import Quiz from "@/models/Quiz";
import QuizParticipation from "@/models/QuizParticipation";

export const GET = withAuth(
    async (req: NextRequest, ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(user, "GET", "/api/v1/private/quizzes");
        if (deny) return deny;

        try {
            await connectDB();
            const { id } = await ctx.params;
            const quiz = await Quiz.findById(id).lean();
            if (!quiz) return NextResponse.json({ message: "Quiz not found." }, { status: 404 });
            return NextResponse.json({ success: true, quiz }, { status: 200 });
        } catch (error: any) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
    }
);

export const PUT = withAuth(
    async (req: NextRequest, ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(user, "PUT", "/api/v1/private/quizzes");
        if (deny) return deny;

        try {
            await connectDB();
            const { id } = await ctx.params;
            const body = await req.json();
            const { title, instructions, price, prizeMoney, firstPrize, secondPrize, thirdPrize, currency, status, questions } = body;

            const quiz = await Quiz.findById(id);
            if (!quiz) return NextResponse.json({ message: "Quiz not found." }, { status: 404 });

            if (title?.trim())               quiz.title        = title.trim();
            if (Array.isArray(instructions)) quiz.instructions = instructions.filter((i: string) => i?.trim());
            if (price !== undefined)         quiz.price        = Math.max(0, Number(price) || 0);
            if (prizeMoney !== undefined)    (quiz as any).prizeMoney   = Math.max(0, Number(prizeMoney) || 0);
            if (firstPrize !== undefined)    (quiz as any).firstPrize   = Math.max(0, Number(firstPrize)  || 0);
            if (secondPrize !== undefined)   (quiz as any).secondPrize  = Math.max(0, Number(secondPrize) || 0);
            if (thirdPrize !== undefined)    (quiz as any).thirdPrize   = Math.max(0, Number(thirdPrize)  || 0);
            if (currency)                    quiz.currency     = currency;

            if (status) {
                const validStatuses = ["INACTIVE", "ACTIVE", "PUBLISHED"];
                if (validStatuses.includes(status.toUpperCase())) quiz.status = status.toUpperCase() as any;
            }

            if (Array.isArray(questions) && questions.length > 0) {
                quiz.questions = questions.map((q: any) => ({
                    text:          q.text.trim(),
                    options:       (q.options as string[]).map((o) => o.trim()).filter(Boolean),
                    correctOption: q.correctOption,
                    points:        Math.max(1, Number(q.points) || 1),
                })) as any;
            }

            await quiz.save();
            return NextResponse.json({ success: true, quiz: { _id: String(quiz._id), title: quiz.title } }, { status: 200 });
        } catch (error: any) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
    }
);

export const DELETE = withAuth(
    async (req: NextRequest, ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(user, "DELETE", "/api/v1/private/quizzes");
        if (deny) return deny;

        try {
            await connectDB();
            const { id } = await ctx.params;
            const result = await Quiz.deleteOne({ _id: id });
            if (result.deletedCount === 0) return NextResponse.json({ message: "Quiz not found." }, { status: 404 });
            await QuizParticipation.deleteMany({ quizId: id });
            return NextResponse.json({ success: true, message: "Quiz deleted." }, { status: 200 });
        } catch (error: any) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
    }
);
