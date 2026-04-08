"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    FiMessageSquare, FiPlus, FiClock, FiCheckCircle, FiXCircle,
    FiLoader, FiRefreshCw, FiSend, FiX, FiInfo, FiAlertCircle,
    FiArrowRight
} from "react-icons/fi";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Complaint {
    _id: string;
    reason: string;
    description: string;
    status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
    adminNotes?: string;
    createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
    PENDING:     "bg-amber-100 text-amber-700 border-amber-200",
    IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
    RESOLVED:    "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED:    "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    PENDING:     <FiClock size={12} />,
    IN_PROGRESS: <FiLoader size={12} className="animate-spin" />,
    RESOLVED:    <FiCheckCircle size={12} />,
    REJECTED:    <FiXCircle size={12} />,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyComplaintsPage() {
    const { success, error } = useToast();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ reason: "", description: "" });

    const token = getStoredToken();
    const authHeader = { Authorization: `Bearer ${token}` } as const;

    const fetchComplaints = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/v1/private/complaints/my", {
                headers: authHeader,
            });
            const data = await res.json();
            if (data.success) {
                setComplaints(data.data);
            } else {
                error(data.message || "Failed to fetch complaints");
            }
        } catch (err) {
            error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch("/api/v1/private/complaints", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeader,
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                success("Complaint submitted successfully");
                setShowModal(false);
                setFormData({ reason: "", description: "" });
                fetchComplaints();
            } else {
                error(data.message || "Failed to submit complaint");
            }
        } catch (err) {
            error("Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Stats ──
    const resolvedCount = complaints.filter(c => c.status === "RESOLVED").length;

    return (
        <div className="w-full mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                            <FiMessageSquare className="text-emerald-600" size={20} />
                        </div>
                        My Complaints
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm ml-[calc(2rem+12px)]">Raise and track your issues here.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-[calc(2rem+12px)] sm:ml-0">
                    <button onClick={fetchComplaints} disabled={isLoading} className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-40" title="Refresh">
                        <FiRefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-lg shadow-md shadow-emerald-600/25 transition-all"
                    >
                        <FiPlus size={15} /> Raise New Complaint
                    </button>
                </div>
            </div>

            {/* ── Mini Stats ── */}
            <div className="flex gap-4 items-center px-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    Total: <span className="text-gray-900">{complaints.length}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Resolved: <span className="text-emerald-600">{resolvedCount}</span>
                </div>
            </div>

            {/* ── Complaints List ── */}
            {isLoading && complaints.length === 0 ? (
                <div className="grid gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                            <div className="flex justify-between">
                                <div className="h-5 w-1/3 bg-gray-100 rounded-lg" />
                                <div className="h-6 w-20 bg-gray-100 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-full bg-gray-50 rounded" />
                                <div className="h-3 w-2/3 bg-gray-50 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : complaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 gap-4 bg-white border border-dashed border-gray-200 rounded-3xl">
                    <div className="p-5 bg-gray-50 rounded-2xl"><FiMessageSquare size={32} className="text-gray-300" /></div>
                    <div className="text-center">
                        <p className="text-gray-700 font-semibold">No complaints yet</p>
                        <p className="text-gray-400 text-xs mt-1">If you&apos;re facing any issue, we&apos;re here to help.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {complaints.map((c) => (
                        <div key={c._id} className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-800 transition-colors">{c.reason}</h3>
                                    <p className="text-[10px] font-mono text-gray-400 mt-0.5 uppercase">Ref: {c._id}</p>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[c.status]}`}>
                                    {STATUS_ICONS[c.status]}
                                    {c.status}
                                </span>
                            </div>
                            
                            <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{c.description}</p>
                            
                            {c.adminNotes && (
                                <div className="mt-5 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <FiCheckCircle size={40} className="text-emerald-600" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1 bg-emerald-100 rounded-md"><FiInfo size={12} className="text-emerald-600" /></div>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Admin Resolution</p>
                                    </div>
                                    <p className="text-sm text-emerald-900 leading-relaxed">{c.adminNotes}</p>
                                </div>
                            )}

                            <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                                    <FiClock size={11} /> Submitted on {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                                <button className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                                    Details <FiArrowRight size={10} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── New Complaint Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                        
                        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-base">
                                <div className="p-1.5 bg-emerald-100 rounded-lg"><FiPlus size={14} className="text-emerald-600" /></div>
                                Raise New Complaint
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"><FiX size={17} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 custom-scrollbar">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason / Subject <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all placeholder:text-gray-400"
                                        required
                                        placeholder="E.g., Payment issue, Profile error..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detailed Description <span className="text-red-400">*</span></label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all h-40 placeholder:text-gray-400"
                                        required
                                        placeholder="Describe the problem in detail so we can help you faster..."
                                    />
                                </div>

                                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex gap-3">
                                    <FiAlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-800 leading-normal">
                                        Please provide as much detail as possible. Our team typically responds within 24-48 business hours.
                                    </p>
                                </div>
                            </div>

                            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white rounded-b-2xl">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSend size={14} />}
                                    Submit Complaint
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
