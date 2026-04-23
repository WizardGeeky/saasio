"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";
import CheckoutButton, { type PaymentSuccessData } from "@/components/checkout-button";
import {
    FiCheckSquare, FiRefreshCw, FiChevronLeft, FiChevronRight,
    FiBookOpen, FiUsers, FiDollarSign, FiCheck, FiX, FiCalendar,
    FiAward, FiList, FiAlertCircle, FiArrowRight, FiLock, FiClock,
} from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizQuestion {
    index: number;
    text: string;
    options: string[];
    points: number;
}

interface AvailableQuiz {
    _id: string;
    title: string;
    instructions: string[];
    price: number;
    prizeMoney: number;
    currency: string;
    participantCount: number;
    createdByName: string;
    questionCount: number;
    questions: QuizQuestion[];
    participated: boolean;
    myScore: number | null;
    myPercentage: number | null;
    createdAt: string;
}

interface HistoryRecord {
    _id: string;
    quizId: string;
    quizTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    timeTakenSeconds: number;
    createdAt: string;
}

interface LeaderboardEntry {
    rank: number;
    userId: string;
    userName: string;
    score: number;
    maxScore: number;
    percentage: number;
    timeTakenSeconds: number;
    submittedAt: string;
    isMe: boolean;
}

interface Pagination {
    total: number;
    page: number;
    pages: number;
    limit: number;
}

type TabId = "available" | "history";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatSeconds(sec: number) {
    if (!sec) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function ScoreRing({ pct }: { pct: number }) {
    const color = pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500";
    return (
        <div className={`text-2xl font-black ${color}`}>{pct}%</div>
    );
}

function ScoreBadge({ pct }: { pct: number }) {
    const cls = pct >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : pct >= 50 ? "bg-amber-50 text-amber-700 border-amber-200"
              :             "bg-red-50 text-red-700 border-red-200";
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${cls}`}>{pct}%</span>;
}

function PaginationBar({ pagination, onPage, limit, onLimitChange }: {
    pagination: Pagination; onPage: (p: number) => void; limit: number; onLimitChange: (l: number) => void;
}) {
    const { page, pages, total } = pagination;
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to   = Math.min(page * limit, total);
    const nums: number[] = [];
    if (pages <= 5) { for (let i = 1; i <= pages; i++) nums.push(i); }
    else { for (let i = 0; i < 5; i++) nums.push(Math.max(1, Math.min(page - 2 + i, pages - 4 + i))); }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{total === 0 ? "No records" : `Showing ${from}–${to} of ${total}`}</span>
                <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none">
                    {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => onPage(page - 1)} disabled={page <= 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed">
                    <FiChevronLeft size={16} />
                </button>
                {nums.map((p) => (
                    <button key={p} onClick={() => onPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === p ? "bg-indigo-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>
                        {p}
                    </button>
                ))}
                <button onClick={() => onPage(page + 1)} disabled={page >= pages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed">
                    <FiChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

// ─── Take Quiz Modal ──────────────────────────────────────────────────────────

function TakeQuizModal({ quiz, onClose, onSubmit, isSubmitting }: {
    quiz: AvailableQuiz;
    onClose: () => void;
    onSubmit: (answers: { questionIndex: number; selectedOption: number }[], timeTakenSeconds: number) => Promise<void>;
    isSubmitting: boolean;
}) {
    const initialStep = quiz.price > 0 ? "payment" : "instructions";
    const [step, setStep]       = useState<"payment" | "instructions" | "quiz">(initialStep);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [paid, setPaid]       = useState(quiz.price === 0);
    const [elapsed, setElapsed] = useState(0);
    const timerRef              = React.useRef<ReturnType<typeof setInterval> | null>(null);

    // Start timer when quiz step becomes active
    React.useEffect(() => {
        if (step === "quiz") {
            timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
        } else {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [step]);

    const allAnswered   = quiz.questions.every((q) => answers[q.index] !== undefined);
    const answeredCount = Object.keys(answers).length;

    const handleAnswer = (qi: number, oi: number) =>
        setAnswers((prev) => ({ ...prev, [qi]: oi }));

    const handlePaymentSuccess = (_data: PaymentSuccessData) => {
        setPaid(true);
        setStep("instructions");
    };

    const handleSubmit = async () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        const answerArray = quiz.questions.map((q) => ({
            questionIndex:  q.index,
            selectedOption: answers[q.index] ?? -1,
        }));
        await onSubmit(answerArray, elapsed);
    };

    // Step labels for the progress indicator
    const steps = quiz.price > 0
        ? [{ id: "payment", label: "Payment" }, { id: "instructions", label: "Instructions" }, { id: "quiz", label: "Quiz" }]
        : [{ id: "instructions", label: "Instructions" }, { id: "quiz", label: "Quiz" }];
    const stepIdx = steps.findIndex((s) => s.id === step);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}>
                <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div className="min-w-0 flex-1 pr-2">
                        <h2 className="font-bold text-gray-900 text-base leading-tight truncate">{quiz.title}</h2>
                        {step === "quiz" && (
                            <div className="flex items-center gap-3 mt-0.5">
                                <p className="text-xs text-gray-400">{answeredCount} / {quiz.questionCount} answered</p>
                                <p className="text-xs text-indigo-500 font-medium flex items-center gap-1">
                                    <FiClock size={11} />{formatSeconds(elapsed)}
                                </p>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0">
                        <FiX size={18} />
                    </button>
                </div>

                {/* Step progress */}
                {quiz.price > 0 && (
                    <div className="px-5 pt-4 pb-2">
                        <div className="flex items-center gap-0">
                            {steps.map((s, i) => (
                                <React.Fragment key={s.id}>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                                            i < stepIdx  ? "border-indigo-600 bg-indigo-600 text-white"
                                          : i === stepIdx ? "border-indigo-600 bg-white text-indigo-600"
                                          :                 "border-gray-200 bg-white text-gray-400"
                                        }`}>
                                            {i < stepIdx ? <FiCheck size={12} /> : i + 1}
                                        </div>
                                        <span className={`text-[10px] font-medium ${i === stepIdx ? "text-indigo-600" : "text-gray-400"}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`flex-1 h-0.5 mb-4 mx-1 ${i < stepIdx ? "bg-indigo-600" : "bg-gray-200"}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-5">
                    {/* ── Payment step ──────────────────────────────── */}
                    {step === "payment" && (
                        <div className="space-y-5">
                            {/* Quiz summary */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                    <FiBookOpen size={18} className="text-indigo-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm leading-tight">{quiz.title}</p>
                                    <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><FiList size={11} />{quiz.questionCount} Questions</span>
                                        <span className="flex items-center gap-1"><FiUsers size={11} />{quiz.participantCount} Participants</span>
                                    </div>
                                </div>
                            </div>

                            {/* Price card */}
                            <div className="border border-gray-200 rounded-xl p-5 text-center space-y-3">
                                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                                    <FiLock size={14} />
                                    <span>This is a paid quiz</span>
                                </div>
                                <div className="text-4xl font-black text-gray-900">
                                    ₹{quiz.price.toLocaleString("en-IN")}
                                </div>
                                <p className="text-xs text-gray-400">One-time payment • Unlimited attempts blocked after first participation</p>
                            </div>

                            {/* Checkout button */}
                            <CheckoutButton
                                amount={quiz.price}
                                currency={quiz.currency || "INR"}
                                description={`Quiz: ${quiz.title}`}
                                productName="Quiz Access"
                                notes={{ quizId: quiz._id, quizTitle: quiz.title }}
                                onSuccess={handlePaymentSuccess}
                                className="w-full py-3 text-base rounded-xl justify-center"
                            >
                                Pay ₹{quiz.price.toLocaleString("en-IN")} &amp; Continue
                            </CheckoutButton>

                            <button type="button" onClick={onClose}
                                className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 text-center">
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* ── Instructions step ─────────────────────────── */}
                    {step === "instructions" && (
                        <div className="space-y-5">
                            {paid && quiz.price > 0 && (
                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-700 font-medium">
                                    <FiCheck size={14} />
                                    Payment successful — you now have access to this quiz.
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3 text-sm">
                                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
                                    <FiList size={13} className="text-gray-400" />
                                    {quiz.questionCount} Questions
                                </div>
                                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
                                    <FiUsers size={13} className="text-gray-400" />
                                    {quiz.participantCount} Participants
                                </div>
                                <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm border ${
                                    quiz.price === 0
                                        ? "bg-gray-50 border-gray-200 text-gray-600"
                                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                }`}>
                                    <FiDollarSign size={13} />
                                    {quiz.price === 0 ? "Free" : `₹${quiz.price} — Paid`}
                                </div>
                            </div>

                            {quiz.instructions.filter(Boolean).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Instructions</h3>
                                    <ol className="space-y-2">
                                        {quiz.instructions.filter(Boolean).map((inst, i) => (
                                            <li key={i} className="flex gap-2.5 text-sm text-gray-600">
                                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                    {i + 1}
                                                </span>
                                                {inst}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            <button onClick={() => setStep("quiz")}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                                Start Quiz <FiArrowRight size={16} />
                            </button>
                        </div>
                    )}

                    {/* ── Quiz step ─────────────────────────────────── */}
                    {step === "quiz" && (
                        <div className="space-y-5">
                            {quiz.questions.map((q) => (
                                <div key={q.index} className="border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-start gap-2 mb-3">
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 shrink-0">
                                            Q{q.index + 1}
                                        </span>
                                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{q.text}</p>
                                    </div>
                                    <div className="space-y-2">
                                        {q.options.map((opt, oi) => {
                                            const selected = answers[q.index] === oi;
                                            return (
                                                <button key={oi} type="button" onClick={() => handleAnswer(q.index, oi)}
                                                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                                                        selected
                                                            ? "border-indigo-500 bg-indigo-50 text-indigo-800 font-medium"
                                                            : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50 text-gray-700"
                                                    }`}>
                                                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                        selected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                                                    }`}>
                                                        {selected && <FiCheck size={10} className="text-white" />}
                                                    </span>
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setStep("instructions")}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">
                                    Back
                                </button>
                                <button type="button" onClick={handleSubmit} disabled={isSubmitting || !allAnswered}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">
                                    {isSubmitting ? (
                                        <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                                    ) : (
                                        <><FiCheck size={14} /> Submit Quiz</>
                                    )}
                                </button>
                            </div>
                            {!allAnswered && (
                                <p className="text-xs text-center text-amber-600">
                                    Please answer all {quiz.questionCount} questions to submit.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Leaderboard Modal ───────────────────────────────────────────────────────

function LeaderboardModal({ quizId, onClose }: { quizId: string; onClose: () => void }) {
    const token = getStoredToken();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        quizTitle: string;
        prizeMoney: number;
        currency: string;
        leaderboard: LeaderboardEntry[];
        myRank: number | null;
    } | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/v1/private/my-quizzes?tab=leaderboard&quizId=${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (res.ok) setData(json);
            } finally { setLoading(false); }
        })();
    }, [quizId]);

    const rankStyle = (rank: number) =>
        rank === 1 ? "text-amber-600 font-black" :
        rank === 2 ? "text-slate-500 font-bold"  :
        rank === 3 ? "text-orange-600 font-bold"  : "text-gray-500 font-medium";

    const rankBg = (rank: number, isMe: boolean) =>
        isMe ? "bg-indigo-50 border-indigo-100" :
        rank === 1 ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}>
                <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <FiAward size={18} className="text-amber-500" />
                        <div>
                            <h2 className="font-bold text-gray-900 text-base leading-tight">Leaderboard</h2>
                            {data && <p className="text-xs text-gray-400 truncate max-w-[220px]">{data.quizTitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><FiX size={18} /></button>
                </div>

                {/* Prize banner */}
                {data && data.prizeMoney > 0 && (
                    <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2 shrink-0">
                        <FiAward size={14} className="text-amber-500 shrink-0" />
                        <span className="text-sm font-semibold text-amber-800">
                            Prize Pool: ₹{data.prizeMoney.toLocaleString("en-IN")} — Top scorer wins!
                        </span>
                    </div>
                )}

                {/* My rank banner */}
                {data?.myRank && (
                    <div className="px-5 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2 shrink-0">
                        <span className="text-xs text-indigo-700 font-medium">Your rank: <strong>#{data.myRank}</strong> out of {data.leaderboard.length}</span>
                    </div>
                )}

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-4 space-y-2">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                        ))
                    ) : !data || data.leaderboard.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm">No participants yet</div>
                    ) : data.leaderboard.map((entry) => (
                        <div key={entry.userId}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${rankBg(entry.rank, entry.isMe)} transition-colors`}>
                            <div className={`w-7 text-center text-sm ${rankStyle(entry.rank)} shrink-0`}>
                                {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank - 1] : `#${entry.rank}`}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-semibold text-gray-900 truncate">{entry.userName}</span>
                                    {entry.isMe && (
                                        <span className="shrink-0 text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">You</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                    <span>{entry.score}/{entry.maxScore} pts</span>
                                    {entry.timeTakenSeconds > 0 && (
                                        <span className="flex items-center gap-0.5"><FiClock size={10} />{formatSeconds(entry.timeTakenSeconds)}</span>
                                    )}
                                </div>
                            </div>
                            <div className={`text-sm font-black shrink-0 ${
                                entry.percentage >= 80 ? "text-emerald-600" :
                                entry.percentage >= 50 ? "text-amber-600" : "text-red-500"
                            }`}>
                                {entry.percentage}%
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-100 shrink-0">
                    <button onClick={onClose}
                        className="w-full py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Result Modal ─────────────────────────────────────────────────────────────

function ResultModal({ result, quizTitle, onClose }: {
    result: { score: number; totalQuestions: number; percentage: number; maxScore: number };
    quizTitle: string;
    onClose: () => void;
}) {
    const msg = result.percentage >= 80 ? "Excellent work! 🎉"
              : result.percentage >= 50 ? "Good effort! Keep it up."
              : "Better luck next time!";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6 text-center flex flex-col items-center gap-4"
                onClick={(e) => e.stopPropagation()}>
                <div className="sm:hidden flex justify-center mb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
                <div className="w-16 h-16 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center">
                    <FiAward size={28} className="text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900">Quiz Complete!</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{quizTitle}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl w-full py-5 px-4">
                    <ScoreRing pct={result.percentage} />
                    <p className="text-sm text-gray-500 mt-1">{result.score} / {result.maxScore} points</p>
                    <p className="text-xs text-gray-400 mt-0.5">{result.totalQuestions} questions</p>
                </div>
                <p className="text-sm font-medium text-gray-700">{msg}</p>
                <button onClick={onClose}
                    className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                    Done
                </button>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyQuizzesPage() {
    const { error: toastError } = useToast();
    const token = getStoredToken();

    const [tab, setTab]             = useState<TabId>("available");
    const [loading, setLoading]     = useState(true);
    const [quizzes, setQuizzes]     = useState<AvailableQuiz[]>([]);
    const [history, setHistory]     = useState<HistoryRecord[]>([]);
    const [histPag, setHistPag]     = useState<Pagination>({ total: 0, page: 1, pages: 1, limit: 12 });
    const [histLimit, setHistLimit] = useState(12);

    const [takeQuiz, setTakeQuiz]           = useState<AvailableQuiz | null>(null);
    const [isSubmitting, setIsSubmitting]   = useState(false);
    const [quizResult, setQuizResult]       = useState<{ result: { score: number; totalQuestions: number; percentage: number; maxScore: number }; quizTitle: string } | null>(null);
    const [leaderboardQuizId, setLeaderboardQuizId] = useState<string | null>(null);

    const fetchAvailable = useCallback(async () => {
        setLoading(true);
        try {
            const res  = await fetch("/api/v1/private/my-quizzes?tab=available", { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) { toastError(data.message ?? "Failed to load quizzes"); return; }
            setQuizzes(data.quizzes ?? []);
        } catch { toastError("Network error"); }
        finally { setLoading(false); }
    }, [token]);

    const fetchHistory = useCallback(async (page = 1, lim = histLimit) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ tab: "history", page: String(page), limit: String(lim) });
            const res  = await fetch(`/api/v1/private/my-quizzes?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) { toastError(data.message ?? "Failed to load history"); return; }
            setHistory(data.history ?? []);
            setHistPag(data.pagination ?? { total: 0, page: 1, pages: 1, limit: lim });
        } catch { toastError("Network error"); }
        finally { setLoading(false); }
    }, [token, histLimit]);

    useEffect(() => {
        if (tab === "available") fetchAvailable();
        else fetchHistory();
    }, [tab]);

    const handleSubmit = async (answers: { questionIndex: number; selectedOption: number }[], timeTakenSeconds: number) => {
        if (!takeQuiz) return;
        setIsSubmitting(true);
        try {
            const res  = await fetch("/api/v1/private/my-quizzes", {
                method:  "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body:    JSON.stringify({ quizId: takeQuiz._id, answers, timeTakenSeconds }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to submit");
            setQuizResult({ result: data.result, quizTitle: takeQuiz.title });
            setTakeQuiz(null);
            fetchAvailable();
        } catch (err) {
            toastError(err instanceof Error ? err.message : "Failed to submit quiz");
        } finally { setIsSubmitting(false); }
    };

    const participated  = quizzes.filter((q) => q.participated);
    const notTaken      = quizzes.filter((q) => !q.participated);
    const bestScore     = participated.length > 0 ? Math.max(...participated.map((q) => q.myPercentage ?? 0)) : null;

    return (
        <div className="min-h-screen">
            <div className="w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FiCheckSquare size={20} className="text-indigo-500" />
                            My Quizzes
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Take available quizzes and track your performance</p>
                    </div>
                    <button onClick={() => tab === "available" ? fetchAvailable() : fetchHistory()} disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50 shrink-0">
                        <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* Summary cards */}
                {!loading && quizzes.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { icon: FiBookOpen,     label: "Available",   value: quizzes.length,    color: "text-indigo-600", bg: "bg-indigo-50" },
                            { icon: FiCheck,        label: "Completed",   value: participated.length, color: "text-emerald-600", bg: "bg-emerald-50" },
                            { icon: FiAlertCircle,  label: "Pending",     value: notTaken.length,   color: "text-amber-600",  bg: "bg-amber-50" },
                            { icon: FiAward,        label: "Best Score",  value: bestScore !== null ? `${bestScore}%` : "—", color: "text-violet-600", bg: "bg-violet-50" },
                        ].map((c) => (
                            <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                                    <c.icon size={16} className={c.color} />
                                </div>
                                <div>
                                    <div className="text-sm sm:text-lg font-bold text-gray-900 leading-tight">{c.value}</div>
                                    <div className="text-xs text-gray-500">{c.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        {([
                            { id: "available" as TabId, label: "Available Quizzes" },
                            { id: "history"   as TabId, label: `My History (${histPag.total})` },
                        ]).map((t) => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                    tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Available Quizzes ─────────────────────────── */}
                    {tab === "available" && (
                        <div className="p-4 sm:p-5">
                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse space-y-3">
                                            <div className="h-5 bg-gray-100 rounded w-3/4" />
                                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                                            <div className="h-8 bg-gray-100 rounded w-full mt-4" />
                                        </div>
                                    ))}
                                </div>
                            ) : quizzes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                        <FiBookOpen size={22} className="text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">No quizzes available</p>
                                    <p className="text-xs text-gray-400 mt-1">Check back later for published quizzes.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {quizzes.map((quiz) => (
                                        <div key={quiz._id}
                                            className={`border rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
                                                quiz.participated
                                                    ? "border-emerald-200 bg-emerald-50/30"
                                                    : "border-gray-200 bg-white hover:border-indigo-200"
                                            }`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{quiz.title}</h3>
                                                {quiz.participated && (
                                                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                        <FiCheck size={10} /> Done
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <FiList size={11} className="text-gray-400" />
                                                    {quiz.questionCount} Questions
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FiUsers size={11} className="text-gray-400" />
                                                    {quiz.participantCount} Participants
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FiDollarSign size={11} className="text-gray-400" />
                                                    {quiz.price === 0 ? "Free" : `₹${quiz.price}`}
                                                </span>
                                                {quiz.prizeMoney > 0 && (
                                                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                                                        <FiAward size={11} />Prize ₹{quiz.prizeMoney.toLocaleString("en-IN")}
                                                    </span>
                                                )}
                                            </div>

                                            {quiz.participated && quiz.myPercentage !== null && (
                                                <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg px-3 py-1.5">
                                                    <FiAward size={13} className="text-emerald-600 shrink-0" />
                                                    <span className="text-xs text-gray-600">Your score:</span>
                                                    <ScoreBadge pct={quiz.myPercentage} />
                                                </div>
                                            )}

                                            <div className="mt-auto space-y-2">
                                                {quiz.participated ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                                            <FiCheck size={12} /> Already participated
                                                        </div>
                                                        <button onClick={() => setLeaderboardQuizId(quiz._id)}
                                                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors">
                                                            <FiAward size={12} /> View Leaderboard
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setTakeQuiz(quiz)}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
                                                        Take Quiz <FiArrowRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── History Tab ─────────────────────────────────── */}
                    {tab === "history" && (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            {["#", "Quiz", "Score", "Percentage", "Time", "Date"].map((h) => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? Array.from({ length: 4 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                {Array.from({ length: 5 }).map((_, j) => (
                                                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                                                ))}
                                            </tr>
                                        )) : history.length === 0 ? (
                                            <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No participation history</td></tr>
                                        ) : history.map((h, idx) => {
                                            const rowNum = (histPag.page - 1) * histPag.limit + idx + 1;
                                            return (
                                                <tr key={h._id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="px-4 py-3 text-gray-400 text-xs">{rowNum}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[240px] truncate">{h.quizTitle}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">{h.score}/{h.totalQuestions}</td>
                                                    <td className="px-4 py-3"><ScoreBadge pct={h.percentage} /></td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatSeconds(h.timeTakenSeconds)}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(h.createdAt)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {loading ? Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="p-4 animate-pulse space-y-2">
                                        <div className="h-4 bg-gray-100 rounded w-1/2" />
                                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                                    </div>
                                )) : history.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400 text-sm">No participation history</div>
                                ) : history.map((h) => (
                                    <div key={h._id} className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="font-semibold text-gray-900 text-sm leading-tight truncate flex-1">{h.quizTitle}</div>
                                            <ScoreBadge pct={h.percentage} />
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><FiCheck size={11} />{h.score}/{h.totalQuestions}</span>
                                            {h.timeTakenSeconds > 0 && <span className="flex items-center gap-1"><FiClock size={11} />{formatSeconds(h.timeTakenSeconds)}</span>}
                                            <span className="flex items-center gap-1"><FiCalendar size={11} />{formatDate(h.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <PaginationBar pagination={histPag} onPage={(p) => fetchHistory(p)} limit={histLimit}
                                onLimitChange={(l) => { setHistLimit(l); fetchHistory(1, l); }} />
                        </>
                    )}
                </div>
            </div>

            {takeQuiz && (
                <TakeQuizModal
                    quiz={takeQuiz}
                    onClose={() => setTakeQuiz(null)}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            )}
            {quizResult && (
                <ResultModal
                    result={quizResult.result}
                    quizTitle={quizResult.quizTitle}
                    onClose={() => { setQuizResult(null); if (tab === "history") fetchHistory(); }}
                />
            )}
            {leaderboardQuizId && (
                <LeaderboardModal
                    quizId={leaderboardQuizId}
                    onClose={() => setLeaderboardQuizId(null)}
                />
            )}
        </div>
    );
}
