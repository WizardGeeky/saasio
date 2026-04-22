"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";
import { usePrivilege } from "@/app/utils/usePrivilege";
import {
    FiBookOpen, FiRefreshCw, FiSearch, FiUsers, FiAlertCircle,
    FiX, FiChevronLeft, FiChevronRight, FiFilter, FiChevronDown, FiChevronUp,
    FiPlus, FiTrash2, FiAlertTriangle, FiEdit2, FiCheck, FiLayers,
    FiDollarSign, FiCalendar, FiUser,
} from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuizStatus = "INACTIVE" | "ACTIVE" | "PUBLISHED";

interface QuizRecord {
    _id: string;
    title: string;
    instructions: string[];
    price: number;
    currency: string;
    status: QuizStatus;
    questionCount: number;
    participantCount: number;
    createdByName: string;
    createdAt: string;
}

interface QuizStats {
    total: number;
    inactive: number;
    active: number;
    published: number;
    totalParticipants: number;
}

interface Participation {
    _id: string;
    quizId: string;
    quizTitle: string;
    userId: string;
    userName: string;
    userEmail: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    createdAt: string;
}

interface QuizSummary {
    quizId: string;
    quizTitle: string;
    count: number;
    avgPercentage: number;
}

interface QuizDropdown {
    _id: string;
    title: string;
}

interface Pagination {
    total: number;
    page: number;
    pages: number;
    limit: number;
}

interface QuizQuestion {
    text: string;
    options: string[];
    correctOption: number;
    points: number;
}

interface QuizFormData {
    title: string;
    instructions: string[];
    price: string;
    currency: string;
    status: QuizStatus;
    questions: QuizQuestion[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        + " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_META: Record<QuizStatus, { label: string; cls: string }> = {
    INACTIVE:  { label: "Inactive",  cls: "bg-gray-100 text-gray-600 border-gray-200" },
    ACTIVE:    { label: "Active",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
    PUBLISHED: { label: "Published", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function StatusBadge({ status }: { status: QuizStatus }) {
    const m = STATUS_META[status] ?? STATUS_META.INACTIVE;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${m.cls}`}>
            {m.label}
        </span>
    );
}

function ScoreBadge({ pct }: { pct: number }) {
    const cls = pct >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : pct >= 50 ? "bg-amber-50 text-amber-700 border-amber-200"
              :             "bg-red-50 text-red-700 border-red-200";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${cls}`}>
            {pct}%
        </span>
    );
}

function StatCard({ icon: Icon, label, value, color, bg }: {
    icon: React.ElementType; label: string; value: string | number; color: string; bg: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:block">
            <div className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 sm:mb-3`}>
                <Icon size={16} className={color} />
            </div>
            <div className="min-w-0">
                <div className="text-sm sm:text-xl font-bold text-gray-900 leading-tight truncate" title={String(value)}>{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
        </div>
    );
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

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ title, onConfirm, onCancel, isDeleting }: {
    title: string; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onCancel}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                <div className="sm:hidden flex justify-center mb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 rounded-xl shrink-0"><FiAlertTriangle size={18} className="text-red-600" /></div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base">Delete Quiz?</h3>
                        <p className="text-xs text-gray-500 mt-0.5">All participant records will also be deleted.</p>
                    </div>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={onCancel} disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm} disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50">
                        {isDeleting ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting…</> : <><FiTrash2 size={14} /> Delete</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Quiz Form Modal ──────────────────────────────────────────────────────────

const EMPTY_QUESTION = (): QuizQuestion => ({ text: "", options: ["", ""], correctOption: 0, points: 1 });

const EMPTY_FORM = (): QuizFormData => ({
    title: "", instructions: [""], price: "0", currency: "INR",
    status: "INACTIVE", questions: [EMPTY_QUESTION()],
});

function QuizFormModal({ initial, onClose, onSave, isSaving }: {
    initial?: QuizRecord & { questions?: QuizQuestion[] } | null;
    onClose: () => void;
    onSave: (data: QuizFormData) => Promise<void>;
    isSaving: boolean;
}) {
    const [form, setForm] = useState<QuizFormData>(() => {
        if (initial) {
            return {
                title: initial.title,
                instructions: initial.instructions?.length ? initial.instructions : [""],
                price: String(initial.price),
                currency: initial.currency,
                status: initial.status,
                questions: initial.questions?.length ? initial.questions : [EMPTY_QUESTION()],
            };
        }
        return EMPTY_FORM();
    });

    const setField = <K extends keyof QuizFormData>(k: K, v: QuizFormData[K]) =>
        setForm((f) => ({ ...f, [k]: v }));

    // Instructions
    const setInstruction = (i: number, v: string) =>
        setField("instructions", form.instructions.map((x, idx) => idx === i ? v : x));
    const addInstruction = () => setField("instructions", [...form.instructions, ""]);
    const removeInstruction = (i: number) =>
        setField("instructions", form.instructions.filter((_, idx) => idx !== i));

    // Questions
    const setQuestion = (qi: number, update: Partial<QuizQuestion>) =>
        setField("questions", form.questions.map((q, idx) => idx === qi ? { ...q, ...update } : q));
    const addQuestion = () => setField("questions", [...form.questions, EMPTY_QUESTION()]);
    const removeQuestion = (qi: number) =>
        setField("questions", form.questions.filter((_, idx) => idx !== qi));

    // Options
    const setOption = (qi: number, oi: number, v: string) =>
        setQuestion(qi, { options: form.questions[qi].options.map((o, idx) => idx === oi ? v : o) });
    const addOption = (qi: number) =>
        setQuestion(qi, { options: [...form.questions[qi].options, ""] });
    const removeOption = (qi: number, oi: number) => {
        const q = form.questions[qi];
        const newOpts = q.options.filter((_, idx) => idx !== oi);
        const newCorrect = q.correctOption >= oi ? Math.max(0, q.correctOption - 1) : q.correctOption;
        setQuestion(qi, { options: newOpts, correctOption: newCorrect });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}>
                <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="font-bold text-gray-900 text-base">
                        {initial ? "Edit Quiz" : "New Quiz"}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <FiX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quiz Title *</label>
                            <input value={form.title} onChange={(e) => setField("title", e.target.value)} required
                                placeholder="e.g. JavaScript Fundamentals Quiz"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Price (₹)</label>
                            <input type="number" min="0" value={form.price} onChange={(e) => setField("price", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                            <select value={form.status} onChange={(e) => setField("status", e.target.value as QuizStatus)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50">
                                <option value="INACTIVE">Inactive</option>
                                <option value="ACTIVE">Active</option>
                                <option value="PUBLISHED">Published</option>
                            </select>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-gray-700">Instructions</label>
                            <button type="button" onClick={addInstruction}
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                                <FiPlus size={12} /> Add
                            </button>
                        </div>
                        <div className="space-y-2">
                            {form.instructions.map((inst, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <span className="text-xs text-gray-400 w-5 text-right shrink-0">{i + 1}.</span>
                                    <input value={inst} onChange={(e) => setInstruction(i, e.target.value)}
                                        placeholder="Add an instruction..."
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
                                    {form.instructions.length > 1 && (
                                        <button type="button" onClick={() => removeInstruction(i)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                                            <FiX size={13} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Questions */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-semibold text-gray-700">
                                Questions ({form.questions.length})
                            </label>
                            <button type="button" onClick={addQuestion}
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                                <FiPlus size={12} /> Add Question
                            </button>
                        </div>
                        <div className="space-y-4">
                            {form.questions.map((q, qi) => (
                                <div key={qi} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 shrink-0">
                                            Q{qi + 1}
                                        </span>
                                        {form.questions.length > 1 && (
                                            <button type="button" onClick={() => removeQuestion(qi)}
                                                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                                                <FiTrash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                    <input value={q.text} onChange={(e) => setQuestion(qi, { text: e.target.value })} required
                                        placeholder="Question text..."
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white mb-3" />

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500 font-medium">Options (select correct)</p>
                                            <button type="button" onClick={() => addOption(qi)}
                                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                                <FiPlus size={11} /> Option
                                            </button>
                                        </div>
                                        {q.options.map((opt, oi) => (
                                            <div key={oi} className="flex items-center gap-2">
                                                <button type="button" onClick={() => setQuestion(qi, { correctOption: oi })}
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                        q.correctOption === oi
                                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                                            : "border-gray-300 hover:border-indigo-400"
                                                    }`}>
                                                    {q.correctOption === oi && <FiCheck size={10} />}
                                                </button>
                                                <input value={opt} onChange={(e) => setOption(qi, oi, e.target.value)} required
                                                    placeholder={`Option ${oi + 1}`}
                                                    className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
                                                {q.options.length > 2 && (
                                                    <button type="button" onClick={() => removeOption(qi, oi)}
                                                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                                                        <FiX size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        <label className="text-xs text-gray-500">Points:</label>
                                        <input type="number" min="1" value={q.points}
                                            onChange={(e) => setQuestion(qi, { points: Math.max(1, Number(e.target.value)) })}
                                            className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                        <button type="button" onClick={onClose} disabled={isSaving}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">
                            {isSaving ? (
                                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                            ) : (
                                <>{initial ? <FiEdit2 size={14} /> : <FiPlus size={14} />} {initial ? "Update Quiz" : "Create Quiz"}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Chart config ─────────────────────────────────────────────────────────────

const participantChartConfig: ChartConfig = {
    count: { label: "Participants", color: "hsl(262, 70%, 60%)" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabId = "quizzes" | "participants";

export default function QuizzesPage() {
    const { error: toastError, success: toastSuccess } = useToast();
    const { can, isLoading: privLoading } = usePrivilege();
    const token = getStoredToken();

    const canRead   = !privLoading && can("GET",    "/api/v1/private/quizzes");
    const canWrite  = !privLoading && can("POST",   "/api/v1/private/quizzes");
    const canEdit   = !privLoading && can("PUT",    "/api/v1/private/quizzes");
    const canDelete = !privLoading && can("DELETE", "/api/v1/private/quizzes");

    const [tab, setTab]             = useState<TabId>("quizzes");
    const [loading, setLoading]     = useState(true);
    const [stats, setStats]         = useState<QuizStats | null>(null);
    const [quizzes, setQuizzes]     = useState<QuizRecord[]>([]);
    const [qPagination, setQPag]    = useState<Pagination>({ total: 0, page: 1, pages: 1, limit: 20 });
    const [qSearch, setQSearch]     = useState("");
    const [qSearchInput, setQSI]    = useState("");
    const [qStatus, setQStatus]     = useState("all");
    const [qDate, setQDate]         = useState("all");
    const [qLimit, setQLimit]       = useState(20);
    const [showQFilter, setShowQFilter] = useState(false);

    const [participations, setParticipations] = useState<Participation[]>([]);
    const [quizSummary, setQuizSummary]       = useState<QuizSummary[]>([]);
    const [quizDropdown, setQuizDropdown]     = useState<QuizDropdown[]>([]);
    const [pPagination, setPPag]              = useState<Pagination>({ total: 0, page: 1, pages: 1, limit: 20 });
    const [pSearch, setPSearch]               = useState("");
    const [pSearchInput, setPSI]              = useState("");
    const [pQuizFilter, setPQuizFilter]       = useState("");
    const [pDate, setPDate]                   = useState("all");
    const [pLimit, setPLimit]                 = useState(20);

    const [showModal, setShowModal]       = useState(false);
    const [editQuiz, setEditQuiz]         = useState<(QuizRecord & { questions?: QuizQuestion[] }) | null>(null);
    const [isSaving, setIsSaving]         = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<QuizRecord | null>(null);
    const [isDeleting, setIsDeleting]     = useState(false);

    const fetchQuizzes = useCallback(async (
        page = 1, q = qSearch, status = qStatus, dateRange = qDate, lim = qLimit
    ) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(lim), search: q, status, dateRange });
            const res = await fetch(`/api/v1/private/quizzes?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) { toastError(data.message ?? "Failed to load quizzes"); return; }
            setQuizzes(data.records ?? []);
            setStats(data.stats ?? null);
            setQPag(data.pagination ?? { total: 0, page: 1, pages: 1, limit: lim });
        } catch { toastError("Network error"); }
        finally { setLoading(false); }
    }, [token, qSearch, qStatus, qDate, qLimit]);

    const fetchParticipations = useCallback(async (
        page = 1, q = pSearch, quizId = pQuizFilter, dateRange = pDate, lim = pLimit
    ) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(lim), search: q, quizId, dateRange });
            const res = await fetch(`/api/v1/private/quiz-participations?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) { toastError(data.message ?? "Failed to load participations"); return; }
            setParticipations(data.records ?? []);
            setQuizSummary(data.quizSummary ?? []);
            setQuizDropdown(data.quizDropdown ?? []);
            setPPag(data.pagination ?? { total: 0, page: 1, pages: 1, limit: lim });
        } catch { toastError("Network error"); }
        finally { setLoading(false); }
    }, [token, pSearch, pQuizFilter, pDate, pLimit]);

    useEffect(() => {
        if (canRead) { fetchQuizzes(); fetchParticipations(); }
    }, [canRead]);

    const handleEditLoad = async (quiz: QuizRecord) => {
        try {
            const res = await fetch(`/api/v1/private/quizzes/${quiz._id}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) { toastError(data.message); return; }
            setEditQuiz({ ...quiz, questions: (data.quiz as any).questions ?? [] });
            setShowModal(true);
        } catch { toastError("Failed to load quiz details"); }
    };

    const handleSave = async (formData: QuizFormData) => {
        setIsSaving(true);
        try {
            const payload = {
                title:        formData.title,
                instructions: formData.instructions.filter((i) => i.trim()),
                price:        Number(formData.price) || 0,
                currency:     formData.currency,
                status:       formData.status,
                questions:    formData.questions,
            };
            const url    = editQuiz ? `/api/v1/private/quizzes/${editQuiz._id}` : "/api/v1/private/quizzes";
            const method = editQuiz ? "PUT" : "POST";
            const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const data   = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save quiz");
            toastSuccess(editQuiz ? "Quiz updated." : "Quiz created.");
            setShowModal(false);
            setEditQuiz(null);
            fetchQuizzes(qPagination.page);
        } catch (err) {
            toastError(err instanceof Error ? err.message : "Failed to save quiz");
        } finally { setIsSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res  = await fetch(`/api/v1/private/quizzes/${deleteTarget._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete");
            toastSuccess("Quiz deleted.");
            setDeleteTarget(null);
            fetchQuizzes(qPagination.page);
            fetchParticipations(pPagination.page);
        } catch (err) {
            toastError(err instanceof Error ? err.message : "Failed to delete quiz");
        } finally { setIsDeleting(false); }
    };

    if (!privLoading && !canRead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <FiAlertCircle size={26} className="text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Access Denied</h2>
                <p className="text-sm text-gray-500 mt-1">You do not have permission to view quizzes.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FiBookOpen size={20} className="text-indigo-500" />
                            Quizzes
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage quizzes and track participants</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { fetchQuizzes(); fetchParticipations(); }} disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50 shrink-0">
                            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canWrite && (
                            <button onClick={() => { setEditQuiz(null); setShowModal(true); }}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shrink-0">
                                <FiPlus size={14} />
                                <span className="hidden sm:inline">New Quiz</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            { icon: FiBookOpen,  label: "Total Quizzes",      value: stats.total,             color: "text-indigo-600", bg: "bg-indigo-50" },
                            { icon: FiLayers,    label: "Inactive",           value: stats.inactive,          color: "text-gray-600",   bg: "bg-gray-100" },
                            { icon: FiCalendar,  label: "Active",             value: stats.active,            color: "text-amber-600",  bg: "bg-amber-50" },
                            { icon: FiCheck,     label: "Published",          value: stats.published,         color: "text-emerald-600",bg: "bg-emerald-50" },
                            { icon: FiUsers,     label: "Total Participants", value: stats.totalParticipants, color: "text-violet-600", bg: "bg-violet-50" },
                        ].map((c) => <StatCard key={c.label} {...c} />)}
                    </div>
                )}

                {/* Chart: participants per quiz */}
                {quizSummary.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Participants per Quiz</h2>
                        <ChartContainer config={participantChartConfig} className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={quizSummary.map((s) => ({ name: s.quizTitle.slice(0, 20), count: s.count }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" fill="hsl(262, 70%, 60%)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        {(["quizzes", "participants"] as TabId[]).map((t) => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                    tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}>
                                {t === "quizzes" ? `Quiz History (${qPagination.total})` : `Participants (${pPagination.total})`}
                            </button>
                        ))}
                    </div>

                    {/* ── Quizzes Tab ─────────────────────────────────── */}
                    {tab === "quizzes" && (
                        <>
                            {/* Filter bar */}
                            <div className="p-3 sm:p-4 border-b border-gray-100 space-y-2.5">
                                <form onSubmit={(e) => { e.preventDefault(); setQSearch(qSearchInput); fetchQuizzes(1, qSearchInput, qStatus, qDate, qLimit); }}
                                    className="flex gap-2">
                                    <div className="relative flex-1 min-w-0">
                                        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input value={qSearchInput} onChange={(e) => setQSI(e.target.value)} placeholder="Search quizzes..."
                                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
                                    </div>
                                    <button type="submit" className="shrink-0 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                        Search
                                    </button>
                                    <button type="button" onClick={() => setShowQFilter((v) => !v)}
                                        className="sm:hidden shrink-0 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                                        <FiFilter size={14} />
                                    </button>
                                </form>
                                <div className={`gap-2 flex-wrap ${showQFilter ? "flex" : "hidden sm:flex"}`}>
                                    <select value={qStatus} onChange={(e) => { setQStatus(e.target.value); fetchQuizzes(1, qSearch, e.target.value, qDate, qLimit); }}
                                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                                        <option value="all">All Status</option>
                                        <option value="INACTIVE">Inactive</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="PUBLISHED">Published</option>
                                    </select>
                                    <select value={qDate} onChange={(e) => { setQDate(e.target.value); fetchQuizzes(1, qSearch, qStatus, e.target.value, qLimit); }}
                                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                    </select>
                                </div>
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            {["#", "Title", "Status", "Price", "Questions", "Participants", "Created", ""].map((h) => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? Array.from({ length: 4 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                {Array.from({ length: 8 }).map((_, j) => (
                                                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                                                ))}
                                            </tr>
                                        )) : quizzes.length === 0 ? (
                                            <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No quizzes found</td></tr>
                                        ) : quizzes.map((q, idx) => {
                                            const rowNum = (qPagination.page - 1) * qPagination.limit + idx + 1;
                                            return (
                                                <tr key={q._id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="px-4 py-3 text-gray-400 text-xs">{rowNum}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-800 max-w-[200px] truncate">{q.title}</div>
                                                        <div className="text-xs text-gray-400">{q.createdByName}</div>
                                                    </td>
                                                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                                                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">
                                                        {q.price === 0 ? "Free" : `₹${q.price}`}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600">{q.questionCount}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded px-2 py-0.5">
                                                            {q.participantCount}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(q.createdAt)}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1">
                                                            {canEdit && (
                                                                <button onClick={() => handleEditLoad(q)}
                                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
                                                                    <FiEdit2 size={13} />
                                                                </button>
                                                            )}
                                                            {canDelete && (
                                                                <button onClick={() => setDeleteTarget(q)}
                                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                                                                    <FiTrash2 size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
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
                                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                                    </div>
                                )) : quizzes.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400 text-sm">No quizzes found</div>
                                ) : quizzes.map((q) => (
                                    <div key={q._id} className="p-4 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-semibold text-gray-900 text-sm leading-tight">{q.title}</div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {canEdit && (
                                                    <button onClick={() => handleEditLoad(q)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                        <FiEdit2 size={13} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={() => setDeleteTarget(q)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                                                        <FiTrash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                                            <StatusBadge status={q.status} />
                                            <span className="flex items-center gap-1"><FiDollarSign size={11} />{q.price === 0 ? "Free" : `₹${q.price}`}</span>
                                            <span className="flex items-center gap-1"><FiLayers size={11} />{q.questionCount} Q</span>
                                            <span className="flex items-center gap-1 text-violet-600"><FiUsers size={11} />{q.participantCount}</span>
                                        </div>
                                        <div className="text-xs text-gray-400">{q.createdByName} · {formatDate(q.createdAt)}</div>
                                    </div>
                                ))}
                            </div>

                            <PaginationBar pagination={qPagination} onPage={(p) => fetchQuizzes(p)} limit={qLimit} onLimitChange={(l) => { setQLimit(l); fetchQuizzes(1, qSearch, qStatus, qDate, l); }} />
                        </>
                    )}

                    {/* ── Participants Tab ────────────────────────────── */}
                    {tab === "participants" && (
                        <>
                            {/* Filter bar */}
                            <div className="p-3 sm:p-4 border-b border-gray-100 space-y-2.5">
                                <form onSubmit={(e) => { e.preventDefault(); setPSearch(pSearchInput); fetchParticipations(1, pSearchInput, pQuizFilter, pDate, pLimit); }}
                                    className="flex gap-2">
                                    <div className="relative flex-1 min-w-0">
                                        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input value={pSearchInput} onChange={(e) => setPSI(e.target.value)} placeholder="Search by user or quiz..."
                                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
                                    </div>
                                    <button type="submit" className="shrink-0 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                        Search
                                    </button>
                                </form>
                                <div className="flex gap-2 flex-wrap">
                                    <select value={pQuizFilter} onChange={(e) => { setPQuizFilter(e.target.value); fetchParticipations(1, pSearch, e.target.value, pDate, pLimit); }}
                                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 max-w-[180px]">
                                        <option value="">All Quizzes</option>
                                        {quizDropdown.map((qd) => <option key={qd._id} value={qd._id}>{qd.title}</option>)}
                                    </select>
                                    <select value={pDate} onChange={(e) => { setPDate(e.target.value); fetchParticipations(1, pSearch, pQuizFilter, e.target.value, pLimit); }}
                                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                    </select>
                                </div>

                                {/* Quiz summary strip */}
                                {quizSummary.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {quizSummary.slice(0, 8).map((s) => (
                                            <button key={s.quizId} onClick={() => { setPQuizFilter(s.quizId); fetchParticipations(1, pSearch, s.quizId, pDate, pLimit); }}
                                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                                    pQuizFilter === s.quizId
                                                        ? "bg-violet-600 text-white border-violet-600"
                                                        : "bg-white text-gray-600 border-gray-200 hover:bg-violet-50 hover:border-violet-200"
                                                }`}>
                                                <span className="max-w-[120px] truncate">{s.quizTitle}</span>
                                                <span className={`font-bold ${pQuizFilter === s.quizId ? "text-white" : "text-violet-600"}`}>{s.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            {["#", "User", "Quiz", "Score", "Percentage", "Date"].map((h) => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? Array.from({ length: 4 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                {Array.from({ length: 6 }).map((_, j) => (
                                                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                                                ))}
                                            </tr>
                                        )) : participations.length === 0 ? (
                                            <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No participants found</td></tr>
                                        ) : participations.map((p, idx) => {
                                            const rowNum = (pPagination.page - 1) * pPagination.limit + idx + 1;
                                            return (
                                                <tr key={p._id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="px-4 py-3 text-gray-400 text-xs">{rowNum}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-800 text-xs">{p.userName}</div>
                                                        <div className="text-xs text-gray-400 truncate max-w-[160px]">{p.userEmail}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-700 max-w-[160px] truncate">{p.quizTitle}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">{p.score}/{p.totalQuestions}</td>
                                                    <td className="px-4 py-3"><ScoreBadge pct={p.percentage} /></td>
                                                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(p.createdAt)}</td>
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
                                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                                    </div>
                                )) : participations.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400 text-sm">No participants found</div>
                                ) : participations.map((p) => (
                                    <div key={p._id} className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="font-semibold text-gray-900 text-sm truncate">{p.userName}</div>
                                            <ScoreBadge pct={p.percentage} />
                                        </div>
                                        <div className="text-xs text-gray-400 truncate mb-1">{p.userEmail}</div>
                                        <div className="text-xs text-gray-600 font-medium truncate mb-1">{p.quizTitle}</div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><FiCheck size={11} />{p.score}/{p.totalQuestions}</span>
                                            <span className="flex items-center gap-1"><FiCalendar size={11} />{formatDate(p.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <PaginationBar pagination={pPagination} onPage={(p) => fetchParticipations(p)} limit={pLimit} onLimitChange={(l) => { setPLimit(l); fetchParticipations(1, pSearch, pQuizFilter, pDate, l); }} />
                        </>
                    )}
                </div>
            </div>

            {showModal && (
                <QuizFormModal
                    initial={editQuiz}
                    onClose={() => { setShowModal(false); setEditQuiz(null); }}
                    onSave={handleSave}
                    isSaving={isSaving}
                />
            )}
            {deleteTarget && (
                <DeleteModal
                    title={deleteTarget.title}
                    onConfirm={handleDelete}
                    onCancel={() => !isDeleting && setDeleteTarget(null)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
}
