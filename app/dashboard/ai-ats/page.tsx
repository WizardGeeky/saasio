"use client";

import React, { useState, useEffect, useRef } from "react";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";
import { usePrivilege } from "@/app/utils/usePrivilege";
import {
    FiZap,
    FiPlus,
    FiX,
    FiFileText,
    FiBriefcase,
    FiTrendingUp,
    FiCheckCircle,
    FiAlertCircle,
    FiCalendar,
    FiBarChart2,
    FiTarget,
    FiAward,
    FiUploadCloud,
    FiTag,
    FiChevronDown,
    FiCheck,
    FiCpu,
    FiLock,
} from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AtsHistoryRecord {
    _id: string;
    jobRoleName: string;
    fileName: string;
    analysis: {
        score: number;
        matchedKeywords: string[];
        missingKeywords: string[];
        sectionScores: { skills: number; experience: number; projects: number; education: number };
        suggestions: string[];
    };
    modelId: { displayName: string; provider: string; modelName: string } | null;
    createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreStyle(score: number) {
    if (score >= 80) return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" };
    if (score >= 60) return { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500" };
    return               { bg: "bg-red-100",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500" };
}

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiAtsPage() {
    const { success: toastSuccess, error: toastError } = useToast();
    const { can, isLoading: privLoading } = usePrivilege();
    const token = getStoredToken();

    const canRead   = !privLoading && can("GET",  "/api/v1/private/ai-ats");
    const canCreate = !privLoading && can("POST", "/api/v1/private/ai-ats");

    const [modalOpen, setModalOpen]       = useState(false);
    const [history, setHistory]           = useState<AtsHistoryRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing]   = useState(false);
    const [form, setForm] = useState<{ jobRoleName: string; jobDescription: string; resumeFile: File | null; aiModel: string }>({
        jobRoleName: "",
        jobDescription: "",
        resumeFile: null,
        aiModel: "",
    });

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch("/api/v1/private/ai-ats", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) setHistory(data.records ?? []);
        } catch { /* silently ignore */ }
        finally { setHistoryLoading(false); }
    };

    useEffect(() => { fetchHistory(); }, []);

    const handleRunAnalysis = async () => {
        if (!form.resumeFile) return;
        setIsAnalyzing(true);
        try {
            // Convert PDF to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(",")[1]);
                reader.onerror = reject;
                reader.readAsDataURL(form.resumeFile!);
            });

            const res = await fetch("/api/v1/private/ai-ats", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    modelId:        form.aiModel,
                    jobRoleName:    form.jobRoleName,
                    jobDescription: form.jobDescription,
                    resumeBase64:   base64,
                    fileName:       form.resumeFile.name,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toastSuccess("Analysis complete!");
                setModalOpen(false);
                setForm({ jobRoleName: "", jobDescription: "", resumeFile: null, aiModel: "" });
                fetchHistory();
            } else {
                toastError(data.message ?? "Analysis failed");
            }
        } catch {
            toastError("Unexpected error. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── Computed stats ──
    const total    = history.length;
    const avgScore = total > 0 ? Math.round(history.reduce((s, r) => s + r.analysis.score, 0) / total) : 0;
    const highMatch = history.filter(r => r.analysis.score >= 80).length;
    const weekAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek  = history.filter(r => new Date(r.createdAt) >= weekAgo).length;

    const STATS = [
        { label: "Total Analyses",  value: historyLoading ? "—" : total,          icon: <FiBarChart2 size={16} />, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Average Score",   value: historyLoading ? "—" : `${avgScore}%`, icon: <FiTarget size={16} />,    color: "text-blue-600",    bg: "bg-blue-50"    },
        { label: "High Match (≥80%)",value: historyLoading ? "—" : highMatch,     icon: <FiAward size={16} />,     color: "text-purple-600",  bg: "bg-purple-50"  },
        { label: "This Week",        value: historyLoading ? "—" : thisWeek,      icon: <FiTrendingUp size={16} />,color: "text-orange-600",  bg: "bg-orange-50"  },
    ];

    if (!privLoading && !canRead) return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4 px-4 animate-in fade-in duration-500">
            <div className="p-5 bg-red-100 rounded-2xl"><FiLock size={36} className="text-red-500" /></div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-sm">You don&apos;t have permission to use the AI ATS Analyzer.</p>
            </div>
        </div>
    );

    return (
        <div className="w-full mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                            <FiZap className="text-emerald-600" size={20} />
                        </div>
                        AI ATS Analyzer
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm ml-[calc(2rem+12px)]">
                        Match your resume against job descriptions with AI-powered analysis.
                    </p>
                </div>
                {canCreate && (
                    <div className="ml-[calc(2rem+12px)] sm:ml-0 shrink-0">
                        <button
                            onClick={() => setModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl shadow-md shadow-emerald-600/25 transition-all"
                        >
                            <FiPlus size={15} /> Analyze Resume
                        </button>
                    </div>
                )}
            </div>

            {/* ── Analytics cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {STATS.map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`p-1.5 rounded-lg ${s.bg}`}>
                                <span className={s.color}>{s.icon}</span>
                            </div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{s.label}</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Score distribution bar ── */}
            {!historyLoading && total > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Score Distribution</h2>
                    <div className="space-y-3">
                        {[
                            { label: "High Match (80–100%)", count: history.filter(r => r.analysis.score >= 80).length,                                 color: "bg-emerald-500", textColor: "text-emerald-700" },
                            { label: "Medium Match (60–79%)", count: history.filter(r => r.analysis.score >= 60 && r.analysis.score < 80).length,       color: "bg-amber-400",   textColor: "text-amber-700"   },
                            { label: "Low Match (< 60%)",     count: history.filter(r => r.analysis.score < 60).length,                                 color: "bg-red-400",     textColor: "text-red-700"     },
                        ].map((band) => (
                            <div key={band.label} className="flex items-center gap-3">
                                <p className={`text-xs font-medium w-44 shrink-0 ${band.textColor}`}>{band.label}</p>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${band.color} transition-all duration-700`} style={{ width: `${(band.count / total) * 100}%` }} />
                                </div>
                                <span className="text-xs font-bold text-gray-600 w-6 text-right">{band.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── History table ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Analysis History</h2>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                        {historyLoading ? "…" : `${total} record${total !== 1 ? "s" : ""}`}
                    </span>
                </div>

                {historyLoading ? (
                    <div className="p-5 space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse flex gap-4 items-center p-4 rounded-xl border border-gray-100">
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                                    <div className="h-3 w-1/5 rounded bg-gray-200" />
                                </div>
                                <div className="h-6 w-16 rounded-full bg-gray-200" />
                                <div className="h-4 w-24 rounded bg-gray-200" />
                                <div className="h-4 w-24 rounded bg-gray-200" />
                                <div className="h-4 w-28 rounded bg-gray-200" />
                            </div>
                        ))}
                    </div>
                ) : total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 gap-4">
                        <div className="p-5 bg-gray-100 rounded-2xl"><FiZap size={32} className="text-gray-400" /></div>
                        <div className="text-center">
                            <p className="text-gray-700 font-semibold">No analyses yet</p>
                            <p className="text-gray-400 text-xs mt-1">Click &quot;Analyze Resume&quot; to run your first ATS analysis.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y divide-gray-100">
                            {history.map((record) => {
                                const s = scoreStyle(record.analysis.score);
                                return (
                                    <div key={record._id} className="p-4 space-y-3 hover:bg-gray-50/60 transition-colors">
                                        {/* Title + score */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-gray-900 truncate">{record.jobRoleName}</p>
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                                                    <FiCalendar size={10} />
                                                    {formatDate(record.createdAt)} · {formatTime(record.createdAt)}
                                                </div>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                {record.analysis.score}%
                                            </span>
                                        </div>
                                        {/* Matched keywords */}
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                                                <FiCheckCircle size={10} /> Matched ({record.analysis.matchedKeywords.length})
                                            </p>
                                            <KeywordChips keywords={record.analysis.matchedKeywords} variant="matched" limit={5} />
                                        </div>
                                        {/* Missing keywords */}
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide flex items-center gap-1">
                                                <FiAlertCircle size={10} /> Missing ({record.analysis.missingKeywords.length})
                                            </p>
                                            <KeywordChips keywords={record.analysis.missingKeywords} variant="missing" limit={5} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {["Job Role", "Score", "Matched Keywords", "Missing Keywords", "Date & Time"].map((h) => (
                                            <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.map((record) => {
                                        const s = scoreStyle(record.analysis.score);
                                        return (
                                            <tr key={record._id} className="hover:bg-gray-50/70 transition-colors align-top">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">{record.jobRoleName}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-[180px]">{record.fileName}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                        {record.analysis.score}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 max-w-[220px]">
                                                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">
                                                        {record.analysis.matchedKeywords.length} matched
                                                    </p>
                                                    <KeywordChips keywords={record.analysis.matchedKeywords} variant="matched" limit={4} />
                                                </td>
                                                <td className="px-6 py-4 max-w-[220px]">
                                                    <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-1.5">
                                                        {record.analysis.missingKeywords.length} missing
                                                    </p>
                                                    <KeywordChips keywords={record.analysis.missingKeywords} variant="missing" limit={4} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <FiCalendar size={12} />
                                                        <span className="font-medium">{formatDate(record.createdAt)}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-0.5 ml-[18px]">{formatTime(record.createdAt)}</p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* ── Modal ── */}
            {modalOpen && (
                <AnalyzeModal
                    form={form}
                    setForm={setForm}
                    isAnalyzing={isAnalyzing}
                    onClose={() => { if (!isAnalyzing) { setModalOpen(false); } }}
                    onSubmit={handleRunAnalysis}
                />
            )}
        </div>
    );
}

// ─── Analyze Modal ────────────────────────────────────────────────────────────

function AnalyzeModal({
    form,
    setForm,
    isAnalyzing,
    onClose,
    onSubmit,
}: {
    form: { jobRoleName: string; jobDescription: string; resumeFile: File | null; aiModel: string };
    setForm: React.Dispatch<React.SetStateAction<{ jobRoleName: string; jobDescription: string; resumeFile: File | null; aiModel: string }>>;
    isAnalyzing: boolean;
    onClose: () => void;
    onSubmit: () => void;
}) {
    const [dragOver, setDragOver] = useState(false);
    const [aiModels, setAiModels] = useState<{ _id: string; displayName: string; modelName: string; provider: string }[]>([]);
    const [modelsLoading, setModelsLoading] = useState(true);

    useEffect(() => {
        const token = getStoredToken();
        fetch("/api/v1/private/ai-models", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => setAiModels(data.models ?? []))
            .catch(() => {})
            .finally(() => setModelsLoading(false));
    }, []);

    const canSubmit =
        form.jobRoleName.trim().length > 0 &&
        form.jobDescription.trim().length > 0 &&
        form.resumeFile !== null &&
        form.aiModel.trim().length > 0;

    const handleFile = (file: File) => {
        if (file.type === "application/pdf") {
            setForm((f) => ({ ...f, resumeFile: file }));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2.5">
                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <FiZap size={14} className="text-emerald-600" />
                        </div>
                        Analyze Resume
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <FiX size={17} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">

                    {/* Job Role Name */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <FiTag size={12} className="text-purple-500" />
                            Job Role Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.jobRoleName}
                            onChange={(e) => setForm((f) => ({ ...f, jobRoleName: e.target.value }))}
                            placeholder="e.g. Senior Frontend Engineer"
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all placeholder:text-gray-400"
                        />
                    </div>

                    {/* AI Model */}
                    <ModelDropdown
                        models={aiModels}
                        loading={modelsLoading}
                        value={form.aiModel}
                        onChange={(id) => setForm((f) => ({ ...f, aiModel: id }))}
                    />

                    {/* Job Description */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <FiBriefcase size={12} className="text-blue-500" />
                            Job Description <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <textarea
                                value={form.jobDescription}
                                onChange={(e) => setForm((f) => ({ ...f, jobDescription: e.target.value }))}
                                placeholder="Paste the job description here...&#10;&#10;Include responsibilities, required skills, qualifications, and keywords from the listing."
                                rows={6}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 resize-none transition-all placeholder:text-gray-400 leading-relaxed"
                            />
                            {form.jobDescription.trim().length > 0 && (
                                <span className="absolute bottom-3 right-3 text-[10px] font-mono text-gray-300">
                                    {form.jobDescription.trim().split(/\s+/).length} words
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Resume PDF Upload */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <FiFileText size={12} className="text-emerald-500" />
                            Resume (PDF) <span className="text-red-400">*</span>
                        </label>

                        {form.resumeFile ? (
                            /* File selected state */
                            <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                                    <FiFileText size={16} className="text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-emerald-800 truncate">{form.resumeFile.name}</p>
                                    <p className="text-xs text-emerald-500 mt-0.5">
                                        {(form.resumeFile.size / 1024).toFixed(1)} KB · PDF
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, resumeFile: null }))}
                                    className="p-1.5 text-emerald-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                                    title="Remove file"
                                >
                                    <FiX size={14} />
                                </button>
                            </div>
                        ) : (
                            /* Drop zone */
                            <label
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`flex flex-col items-center justify-center gap-3 px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                    dragOver
                                        ? "border-emerald-400 bg-emerald-50"
                                        : "border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50/50"
                                }`}
                            >
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="sr-only"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFile(file);
                                    }}
                                />
                                <div className={`p-3 rounded-xl transition-colors ${dragOver ? "bg-emerald-100" : "bg-white border border-gray-200"}`}>
                                    <FiUploadCloud size={22} className={dragOver ? "text-emerald-600" : "text-gray-400"} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-700">
                                        Drop your PDF here, or{" "}
                                        <span className="text-emerald-600 underline underline-offset-2">browse</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">PDF files only · Max 10 MB</p>
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-white rounded-b-2xl">
                    <p className="text-[11px] text-gray-400 hidden sm:block">
                        AI will score your resume and highlight matched / missing keywords.
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={!canSubmit || isAnalyzing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isAnalyzing
                                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing…</>
                                : <><FiZap size={14} /> Run Analysis</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Model Dropdown ───────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    openai:    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    anthropic: { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200"  },
    google:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
    mistral:   { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200"  },
    groq:      { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200"    },
    custom:    { bg: "bg-gray-100",   text: "text-gray-600",    border: "border-gray-200"    },
};

function ModelDropdown({
    models,
    loading,
    value,
    onChange,
}: {
    models: { _id: string; displayName: string; modelName: string; provider: string }[];
    loading: boolean;
    value: string;
    onChange: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = models.find((m) => m._id === value) ?? null;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="space-y-1.5 relative" ref={ref}>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <FiCpu size={12} className="text-orange-500" />
                AI Model <span className="text-red-400">*</span>
            </label>

            {/* Trigger */}
            <button
                type="button"
                onClick={() => !loading && setOpen((o) => !o)}
                disabled={loading}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white border rounded-xl text-sm transition-all ${
                    open ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-gray-200 hover:border-gray-300"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
                {loading ? (
                    <span className="flex items-center gap-2 text-gray-400">
                        <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                        Loading models…
                    </span>
                ) : selected ? (
                    <span className="flex items-center gap-2.5 min-w-0">
                        {(() => {
                            const c = PROVIDER_COLORS[selected.provider] ?? PROVIDER_COLORS.custom;
                            return (
                                <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${c.bg} ${c.text} ${c.border}`}>
                                    {selected.provider}
                                </span>
                            );
                        })()}
                        <span className="font-semibold text-gray-900 truncate">{selected.displayName}</span>
                        <span className="text-gray-400 font-mono text-xs shrink-0 hidden sm:inline">{selected.modelName}</span>
                    </span>
                ) : (
                    <span className="text-gray-400">
                        {models.length === 0 ? "No models configured" : "Select a model…"}
                    </span>
                )}
                <FiChevronDown
                    size={15}
                    className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* Dropdown panel */}
            {open && models.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150" style={{ maxHeight: "220px", overflowY: "auto" }}>
                    {models.map((m) => {
                        const c = PROVIDER_COLORS[m.provider] ?? PROVIDER_COLORS.custom;
                        const isSelected = m._id === value;
                        return (
                            <button
                                key={m._id}
                                type="button"
                                onClick={() => { onChange(m._id); setOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-0 ${
                                    isSelected ? "bg-emerald-50" : "hover:bg-gray-50"
                                }`}
                            >
                                <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${c.bg} ${c.text} ${c.border}`}>
                                    {m.provider}
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="block font-semibold text-sm text-gray-900 truncate">{m.displayName}</span>
                                    <span className="block font-mono text-xs text-gray-400 truncate mt-0.5">{m.modelName}</span>
                                </span>
                                {isSelected && <FiCheck size={14} className="text-emerald-600 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}

            {!loading && models.length === 0 && (
                <p className="text-[11px] text-amber-500 flex items-center gap-1">
                    <FiCpu size={11} /> No AI models found. Configure one in AI Models settings.
                </p>
            )}
        </div>
    );
}

// ─── Keyword Chips ────────────────────────────────────────────────────────────

function KeywordChips({
    keywords,
    variant,
    limit = 4,
}: {
    keywords: string[];
    variant: "matched" | "missing";
    limit?: number;
}) {
    const visible = keywords.slice(0, limit);
    const overflow = keywords.length - limit;

    const chip =
        variant === "matched"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-600 border-red-200";

    const more =
        variant === "matched"
            ? "bg-emerald-100 text-emerald-600"
            : "bg-red-100 text-red-500";

    if (keywords.length === 0) {
        return <p className="text-[11px] text-gray-400 italic">None</p>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {visible.map((kw) => (
                <span
                    key={kw}
                    className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-medium ${chip}`}
                >
                    {kw}
                </span>
            ))}
            {overflow > 0 && (
                <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${more}`}>
                    +{overflow} more
                </span>
            )}
        </div>
    );
}
