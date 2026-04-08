"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    FiMessageSquare, FiFilter, FiSearch, FiEdit2, FiCheckCircle,
    FiXCircle, FiClock, FiLoader, FiChevronLeft, FiChevronRight,
    FiMoreVertical, FiRefreshCw, FiSave, FiX, FiCheck, FiUser,
    FiAlertCircle, FiActivity
} from "react-icons/fi";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Complaint {
    _id: string;
    userId: string;
    userName: string;
    userEmail: string;
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

const STATUS_DOT: Record<string, string> = {
    PENDING:     "bg-amber-500",
    IN_PROGRESS: "bg-blue-500",
    RESOLVED:    "bg-emerald-500",
    REJECTED:    "bg-red-500",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComplaintsAdminPage() {
    const { success, error } = useToast();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState({ status: "", adminNotes: "" });

    const token = getStoredToken();
    const authHeader = { Authorization: `Bearer ${token}` } as const;

    const fetchComplaints = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/v1/private/complaints?status=${statusFilter}&search=${searchTerm}`, {
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
    }, [statusFilter, searchTerm, token]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchComplaints();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [fetchComplaints]);

    const handleEditClick = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setEditData({ status: complaint.status, adminNotes: complaint.adminNotes || "" });
        setIsModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch(`/api/v1/private/complaints/${selectedComplaint?._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeader,
                },
                body: JSON.stringify(editData),
            });
            const data = await res.json();
            if (data.success) {
                success("Complaint updated successfully");
                setIsModalOpen(false);
                fetchComplaints();
            } else {
                error(data.message || "Failed to update complaint");
            }
        } catch (err) {
            error("Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Status counts ──
    const counts = { PENDING: 0, IN_PROGRESS: 0, RESOLVED: 0, REJECTED: 0 };
    complaints.forEach((c) => { counts[c.status]++; });

    return (
        <div className="w-full mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                            <FiMessageSquare className="text-emerald-600" size={20} />
                        </div>
                        Complaints
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm ml-[calc(2rem+12px)]">Review and resolve user complaints.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-[calc(2rem+12px)] sm:ml-0">
                    <button onClick={fetchComplaints} disabled={isLoading} className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-40" title="Refresh">
                        <FiRefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {[
                    { label: "Total",       value: complaints.length,     color: "text-gray-700",    dot: "bg-gray-400" },
                    { label: "Pending",     value: counts.PENDING,        color: "text-amber-600",   dot: "bg-amber-500" },
                    { label: "In Progress", value: counts.IN_PROGRESS,    color: "text-blue-600",    dot: "bg-blue-500" },
                    { label: "Resolved",    value: counts.RESOLVED,       color: "text-emerald-600", dot: "bg-emerald-500" },
                    { label: "Rejected",    value: counts.REJECTED,       color: "text-red-600",     dot: "bg-red-500" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                        </div>
                        <p className={`text-2xl font-bold ${s.color}`}>{isLoading ? "—" : s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Table card ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="font-semibold text-gray-800 shrink-0">All Complaints</h2>
                    <div className="flex items-center gap-2 w-full sm:max-w-md">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            <input
                                type="search"
                                placeholder="Search issue, email or name…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-5 space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse flex gap-4 items-center p-4 rounded-xl border border-gray-100">
                                <div className="h-9 w-9 rounded-full bg-gray-200 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                                    <div className="h-3 w-1/4 rounded bg-gray-200" />
                                </div>
                                <div className="h-6 w-20 rounded-full bg-gray-200" />
                                <div className="h-8 w-8 rounded-lg bg-gray-200" />
                            </div>
                        ))}
                    </div>
                ) : complaints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 gap-4">
                        <div className="p-5 bg-gray-100 rounded-2xl"><FiMessageSquare size={32} className="text-gray-400" /></div>
                        <div className="text-center">
                            <p className="text-gray-700 font-semibold">{searchTerm ? "No complaints match your search" : "No complaints found"}</p>
                            <p className="text-gray-400 text-xs mt-1">Check back later for new complaints.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {["User", "Complaint", "Status", "Date", "Actions"].map((h) => (
                                        <th key={h} className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${h === "Actions" ? "text-right" : ""} ${h === "Date" ? "hidden lg:table-cell" : ""}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {complaints.map((c) => (
                                    <tr key={c._id} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 text-white text-[10px] font-bold shadow-sm">
                                                    {c.userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">{c.userName}</p>
                                                    <p className="text-gray-400 text-[11px] truncate max-w-[150px]">{c.userEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="font-bold text-emerald-800 text-sm line-clamp-1">{c.reason}</p>
                                            <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{c.description}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLES[c.status]}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[c.status]}`} />
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="hidden lg:table-cell px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end">
                                                <button onClick={() => handleEditClick(c)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Review">
                                                    <FiEdit2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {isModalOpen && selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                        
                        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-base">
                                <div className="p-1.5 bg-emerald-100 rounded-lg"><FiAlertCircle size={14} className="text-emerald-600" /></div>
                                Update Complaint
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"><FiX size={17} /></button>
                        </div>

                        <form onSubmit={handleUpdate} className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6 custom-scrollbar">
                                
                                {/* User Info Card */}
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <FiUser size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{selectedComplaint.userName}</p>
                                            <p className="text-xs text-gray-500">{selectedComplaint.userEmail}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Complaint Detail</p>
                                        <p className="text-sm font-bold text-emerald-800">{selectedComplaint.reason}</p>
                                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{selectedComplaint.description}</p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                                        <select
                                            value={editData.status}
                                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all cursor-pointer"
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="RESOLVED">Resolved</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin Resolution / Notes</label>
                                        <textarea
                                            value={editData.adminNotes}
                                            onChange={(e) => setEditData({ ...editData, adminNotes: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all h-32 placeholder:text-gray-400"
                                            placeholder="Provide technical resolution or notes for the user..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white rounded-b-2xl">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={14} />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
