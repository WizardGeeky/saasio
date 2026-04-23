/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { decrypt } from "@/app/configs/crypto.config";
import Quiz from "@/models/Quiz";
import QuizParticipation from "@/models/QuizParticipation";
import { sendEmail } from "@/app/notifications/email.notification";

function formatSec(sec: number) {
    if (!sec) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getRanked(participations: any[], maxScore: number) {
    return participations
        .sort((a, b) =>
            b.percentage - a.percentage ||
            (a.timeTakenSeconds ?? 99999) - (b.timeTakenSeconds ?? 99999)
        )
        .map((e, idx) => ({ ...e, rank: idx + 1, maxScore }));
}

// GET — preview winners
export const GET = withAuth(
    async (req: NextRequest, ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(user, "GET", "/api/v1/private/quizzes");
        if (deny) return deny;

        try {
            await connectDB();
            const { id } = await ctx.params;

            const quiz = await Quiz.findById(id).lean() as any;
            if (!quiz) return NextResponse.json({ message: "Quiz not found." }, { status: 404 });

            const maxScore = (quiz.questions ?? []).reduce((s: number, q: any) => s + (q.points ?? 1), 0);
            const entries  = await QuizParticipation.find({ quizId: id }).lean();
            const ranked   = getRanked(entries as any[], maxScore);
            const winners  = ranked.slice(0, 3).map((w) => ({
                rank:             w.rank,
                userName:         w.userName,
                score:            w.score,
                maxScore,
                percentage:       w.percentage,
                timeTakenSeconds: w.timeTakenSeconds ?? 0,
                prize:            w.rank === 1 ? (quiz.firstPrize ?? 0)
                                : w.rank === 2 ? (quiz.secondPrize ?? 0)
                                :                (quiz.thirdPrize  ?? 0),
            }));

            return NextResponse.json({
                success:      true,
                quizTitle:    quiz.title,
                firstPrize:   quiz.firstPrize  ?? 0,
                secondPrize:  quiz.secondPrize ?? 0,
                thirdPrize:   quiz.thirdPrize  ?? 0,
                currency:     quiz.currency    ?? "INR",
                totalParticipants: entries.length,
                winners,
            }, { status: 200 });
        } catch (error: any) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
    }
);

// POST — publish winners (send emails to all participants)
export const POST = withAuth(
    async (req: NextRequest, ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(user, "POST", "/api/v1/private/quizzes");
        if (deny) return deny;

        try {
            await connectDB();
            const { id } = await ctx.params;

            const quiz = await Quiz.findById(id).lean() as any;
            if (!quiz) return NextResponse.json({ message: "Quiz not found." }, { status: 404 });

            const maxScore = (quiz.questions ?? []).reduce((s: number, q: any) => s + (q.points ?? 1), 0);
            const entries  = await QuizParticipation.find({ quizId: id }).lean();

            if (entries.length === 0)
                return NextResponse.json({ message: "No participants yet." }, { status: 400 });

            const ranked  = getRanked(entries as any[], maxScore);
            const winners = ranked.slice(0, 3);

            const medals  = ["🥇", "🥈", "🥉"];
            const prizes  = [quiz.firstPrize ?? 0, quiz.secondPrize ?? 0, quiz.thirdPrize ?? 0];
            const labels  = ["1st Place", "2nd Place", "3rd Place"];
            const hasPrize = prizes.some((p) => p > 0);

            const winnerRows = winners.map((w, i) => `
                <tr style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:12px 16px;font-size:22px;">${medals[i]}</td>
                    <td style="padding:12px 16px;font-weight:700;color:#111;">${w.userName}</td>
                    <td style="padding:12px 16px;color:#6366f1;font-weight:700;">${w.percentage}%</td>
                    <td style="padding:12px 16px;color:#64748b;font-size:13px;">${w.score}/${w.maxScore} pts &bull; ${formatSec(w.timeTakenSeconds ?? 0)}</td>
                    ${hasPrize ? `<td style="padding:12px 16px;font-weight:800;color:#f59e0b;">₹${prizes[i].toLocaleString("en-IN")}</td>` : ""}
                </tr>
            `).join("");

            const prizeHeadCell = hasPrize ? `<th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Prize</th>` : "";

            const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
        <div style="font-size:36px;margin-bottom:8px;">🏆</div>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Winners Announced!</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">${quiz.title}</p>
    </td></tr>
    <!-- Body -->
    <tr><td style="padding:28px;">
        <p style="font-size:15px;color:#374151;margin:0 0 20px;">
            The results are in! Here are the top performers for <strong>${quiz.title}</strong>:
        </p>
        <!-- Winners table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <thead>
                <tr style="background:#f9fafb;">
                    <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">#</th>
                    <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Participant</th>
                    <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Score</th>
                    <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Details</th>
                    ${prizeHeadCell}
                </tr>
            </thead>
            <tbody>${winnerRows}</tbody>
        </table>
        ${hasPrize ? `
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#92400e;">
                💰 <strong>Total Prize Pool: ₹${(prizes.reduce((a,b)=>a+b,0)).toLocaleString("en-IN")}</strong>
                &mdash; Prize distributions will be processed soon.
            </p>
        </div>` : ""}
        <p style="font-size:14px;color:#6b7280;margin:0;">
            Thank you to all ${entries.length} participants. Your performance has been recorded. 🎉
        </p>
    </td></tr>
    <!-- Footer -->
    <tr><td style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">SAASIO &bull; This is an automated message</p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

            const results = await Promise.allSettled(
                (entries as any[]).map(async (p) => {
                    let email: string;
                    try { email = decrypt(p.userEmail); } catch { email = p.userEmail; }
                    if (!email || !email.includes("@")) return;
                    await sendEmail({ to: email, subject: `🏆 Winners Announced — ${quiz.title}`, html });
                })
            );

            const sent   = results.filter((r) => r.status === "fulfilled").length;
            const failed = results.filter((r) => r.status === "rejected").length;

            return NextResponse.json({
                success: true,
                message: `Winner announcement sent to ${sent} participant(s).${failed > 0 ? ` ${failed} failed.` : ""}`,
                sent,
                failed,
                winners: winners.map((w, i) => ({
                    rank: w.rank, userName: w.userName,
                    percentage: w.percentage, prize: prizes[i],
                })),
            }, { status: 200 });
        } catch (error: any) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
    }
);
