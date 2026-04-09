"use client";

import React, { useState } from "react";
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
} from "react-icons/fi";

// ─── Mock history data ────────────────────────────────────────────────────────

const MOCK_HISTORY = [
    {
        id: "1",
        jobTitle: "Senior Frontend Engineer",
        company: "Stripe",
        score: 87,
        matchedKeywords: 23,
        missingKeywords: 4,
        analyzedAt: "2026-04-08T10:32:00Z",
        status: "high",
    },
    {
        id: "2",
        jobTitle: "Full Stack Developer",
        company: "Notion",
        score: 71,
        matchedKeywords: 18,
        missingKeywords: 9,
        analyzedAt: "2026-04-07T15:14:00Z",
        status: "medium",
    },
    {
        id: "3",
        jobTitle: "React Developer",
        company: "Vercel",
        score: 94,
        matchedKeywords: 31,
        missingKeywords: 2,
        analyzedAt: "2026-04-06T09:05:00Z",
        status: "high",
    },
    {
        id: "4",
        jobTitle: "Software Engineer",
        company: "Linear",
        score: 58,
        matchedKeywords: 14,
        missingKeywords: 13,
        analyzedAt: "2026-04-05T18:47:00Z",
        status: "low",
    },
    {
        id: "5",
        jobTitle: "UI/UX Engineer",
        company: "Figma",
        score: 76,
        matchedKeywords: 20,
        missingKeywords: 7,
        analyzedAt: "2026-04-04T12:20:00Z",
        status: "medium",
    },
];

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
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<{ jobRoleName: string; jobDescription: string; resumeFile: File | null }>({
        jobRoleName: "",
        jobDescription: "",
        resumeFile: null,
    });

    const avgScore = Math.round(MOCK_HISTORY.reduce((s, r) => s + r.score, 0) / MOCK_HISTORY.length);
    const highMatch = MOCK_HISTORY.filter(r => r.score >= 80).length;

    const STATS = [
        {
            label: "Total Analyses",
            value: MOCK_HISTORY.length,
            icon: <FiBarChart2 size={16} />,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            label: "Average Score",
            value: `${avgScore}%`,
            icon: <FiTarget size={16} />,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "High Match (≥80%)",
            value: highMatch,
            icon: <FiAward size={16} />,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            label: "This Week",
            value: "5",
            icon: <FiTrendingUp size={16} />,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
    ];

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
                <div className="ml-[calc(2rem+12px)] sm:ml-0 shrink-0">
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl shadow-md shadow-emerald-600/25 transition-all"
                    >
                        <FiPlus size={15} /> Analyze Resume
                    </button>
                </div>
            </div>

            {/* ── Analytics cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {STATS.map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`p-1.5 rounded-lg ${s.bg}`}>
                                <span className={s.color}>{s.icon}</span>
                            </div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                                {s.label}
                            </p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            

            {/* ── History table ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Analysis History</h2>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                        {MOCK_HISTORY.length} records
                    </span>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-gray-100">
                    {MOCK_HISTORY.map((record) => {
                        const s = scoreStyle(record.score);
                        return (
                            <div key={record.id} className="p-4 space-y-3 hover:bg-gray-50/60 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 truncate">{record.jobTitle}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{record.company}</p>
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                        {record.score}%
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-2.5">
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Matched</p>
                                        <p className="text-sm font-bold text-emerald-600 mt-0.5">{record.matchedKeywords}</p>
                                    </div>
                                    <div className="text-center border-x border-gray-200">
                                        <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Missing</p>
                                        <p className="text-sm font-bold text-red-500 mt-0.5">{record.missingKeywords}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Date</p>
                                        <p className="text-xs font-semibold text-gray-600 mt-0.5">{formatDate(record.analyzedAt)}</p>
                                    </div>
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
                                {["Job Title", "Score", "Matched Keywords", "Missing Keywords", "Date & Time"].map((h) => (
                                    <th
                                        key={h}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {MOCK_HISTORY.map((record) => {
                                const s = scoreStyle(record.score);
                                return (
                                    <tr key={record.id} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-900">{record.jobTitle}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{record.company}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                {record.score}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                                                <FiCheckCircle size={13} />
                                                {record.matchedKeywords} keywords
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500">
                                                <FiAlertCircle size={13} />
                                                {record.missingKeywords} keywords
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <FiCalendar size={12} />
                                                <span className="font-medium">{formatDate(record.analyzedAt)}</span>
                                                <span className="text-gray-300">·</span>
                                                <span>{formatTime(record.analyzedAt)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal ── */}
            {modalOpen && (
                <AnalyzeModal
                    form={form}
                    setForm={setForm}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

// ─── Analyze Modal ────────────────────────────────────────────────────────────

function AnalyzeModal({
    form,
    setForm,
    onClose,
}: {
    form: { jobRoleName: string; jobDescription: string; resumeFile: File | null };
    setForm: React.Dispatch<React.SetStateAction<{ jobRoleName: string; jobDescription: string; resumeFile: File | null }>>;
    onClose: () => void;
}) {
    const [dragOver, setDragOver] = useState(false);

    const canSubmit =
        form.jobRoleName.trim().length > 0 &&
        form.jobDescription.trim().length > 0 &&
        form.resumeFile !== null;

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
                            disabled={!canSubmit}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            <FiZap size={14} />
                            Run Analysis
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
