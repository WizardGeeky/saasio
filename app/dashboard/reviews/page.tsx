"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";
import { usePrivilege } from "@/app/utils/usePrivilege";
import {
    FiStar,
    FiRefreshCw,
    FiSearch,
    FiCalendar,
    FiAlertCircle,
    FiX,
    FiChevronLeft,
    FiChevronRight,
    FiUser,
    FiFilter,
    FiChevronDown,
    FiChevronUp,
    FiFileText,
    FiMessageSquare,
    FiTrendingUp,
    FiClock,
} from "react-icons/fi";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReviewRecord {
    _id: string;
    userId: string;
    userName: string;
    userEmail: string;
    rating: number;
    title?: string;
    body?: string;
    resumeName?: string;
    templateName?: string;
    status: "PUBLISHED" | "PENDING" | "HIDDEN";
    createdAt: string;
}

interface Stats {
    totalReviews: number;
    avgRating: number;
    fiveStarCount: number;
    thisWeek: number;
}

interface Pagination {
    total: number;
    page: number;
    pages: number;
    limit: number;
}

type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";
type StatusFilter = "all" | "published" | "pending" | "hidden";
type DateRange = "all" | "today" | "week" | "month";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatDateTime(iso: string) {
    const d = new Date(iso);
    return (
        d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
        " · " +
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    );
}

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <FiStar
                    key={n}
                    size={size}
                    className={n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                />
            ))}
        </div>
    );
}

function StatusBadge({ status }: { status: ReviewRecord["status"] }) {
    const map: Record<ReviewRecord["status"], string> = {
        PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
        PENDING: "bg-amber-50 text-amber-700 border-amber-200",
        HIDDEN: "bg-gray-100 text-gray-500 border-gray-200",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status]}`}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
    );
}

function FilterPills<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { value: T; label: string; activeClass: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex gap-1.5 flex-wrap">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                        value === opt.value
                            ? opt.activeClass + " ring-2 ring-offset-1 ring-current"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ record, onClose }: { record: ReviewRecord; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100">
                    <div className="min-w-0 flex-1 pr-3">
                        <StarDisplay rating={record.rating} size={16} />
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mt-1 leading-tight">
                            {record.title || "No title"}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(record.createdAt)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">User</h3>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                            <FiUser size={14} className="text-gray-400 shrink-0" />
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-800">{record.userName}</div>
                                <div className="text-xs text-gray-500 truncate">{record.userEmail}</div>
                            </div>
                        </div>
                    </div>

                    {record.body && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Review</h3>
                            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3 leading-relaxed">
                                {record.body}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        {[
                            ["Resume", record.resumeName || "—"],
                            ["Template", record.templateName || "—"],
                            ["Status", record.status],
                            ["Date", formatDate(record.createdAt)],
                        ].map(([label, value]) => (
                            <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                                <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                                <div className="text-gray-800 text-xs font-medium">{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
    pagination,
    onPage,
    limit,
    onLimitChange,
}: {
    pagination: Pagination;
    onPage: (p: number) => void;
    limit: number;
    onLimitChange: (l: number) => void;
}) {
    const { page, pages, total } = pagination;
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    const pageNums: number[] = [];
    if (pages <= 5) {
        for (let i = 1; i <= pages; i++) pageNums.push(i);
    } else {
        const half = 2;
        for (let i = 0; i < 5; i++) {
            pageNums.push(Math.max(1, Math.min(page - half + i, pages - 4 + i)));
        }
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                    {total === 0 ? "No records" : `Showing ${from}–${to} of ${total}`}
                </span>
                <select
                    value={limit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                    {[10, 20, 50].map((n) => (
                        <option key={n} value={n}>{n} / page</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPage(page - 1)}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <FiChevronLeft size={16} />
                </button>
                {pageNums.map((p) => (
                    <button
                        key={p}
                        onClick={() => onPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                            page === p ? "bg-indigo-600 text-white" : "hover:bg-gray-100 text-gray-600"
                        }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => onPage(page + 1)}
                    disabled={page >= pages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <FiChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
    color,
    bg,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    bg: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:block">
            <div className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 sm:mb-3`}>
                <Icon size={16} className={color} />
            </div>
            <div className="min-w-0">
                <div className="text-sm sm:text-xl font-bold text-gray-900 leading-tight">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
        </div>
    );
}

// ─── Filter configs ───────────────────────────────────────────────────────────

const RATING_OPTIONS: { value: RatingFilter; label: string; activeClass: string }[] = [
    { value: "all", label: "All Ratings", activeClass: "bg-gray-100 text-gray-700 border-gray-200" },
    { value: "5", label: "★ 5", activeClass: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: "4", label: "★ 4", activeClass: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: "3", label: "★ 3", activeClass: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: "2", label: "★ 2", activeClass: "bg-orange-100 text-orange-700 border-orange-200" },
    { value: "1", label: "★ 1", activeClass: "bg-red-100 text-red-700 border-red-200" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string; activeClass: string }[] = [
    { value: "all", label: "All Status", activeClass: "bg-gray-100 text-gray-700 border-gray-200" },
    { value: "published", label: "Published", activeClass: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { value: "pending", label: "Pending", activeClass: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: "hidden", label: "Hidden", activeClass: "bg-gray-100 text-gray-500 border-gray-200" },
];

const DATE_OPTIONS: { value: DateRange; label: string; activeClass: string }[] = [
    { value: "all", label: "All Time", activeClass: "bg-gray-100 text-gray-700 border-gray-200" },
    { value: "today", label: "Today", activeClass: "bg-rose-100 text-rose-700 border-rose-200" },
    { value: "week", label: "This Week", activeClass: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: "month", label: "This Month", activeClass: "bg-teal-100 text-teal-700 border-teal-200" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
    const { error: toastError } = useToast();
    const { can, isLoading: privLoading } = usePrivilege();
    const token = getStoredToken();

    const canRead = !privLoading && can("GET", "/api/v1/private/reviews");

    const [records, setRecords] = useState<ReviewRecord[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1, limit: 20 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [dateRange, setDateRange] = useState<DateRange>("all");
    const [limit, setLimit] = useState(20);
    const [detailRecord, setDetailRecord] = useState<ReviewRecord | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const fetchData = useCallback(
        async (
            page = 1,
            q = search,
            rf = ratingFilter,
            sf = statusFilter,
            dr = dateRange,
            lim = limit,
        ) => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(lim),
                    search: q,
                    rating: rf,
                    status: sf,
                    dateRange: dr,
                });
                const res = await fetch(`/api/v1/private/reviews?${params}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok) {
                    toastError(data.message ?? "Failed to load reviews");
                    return;
                }
                setRecords(data.records ?? []);
                setStats(data.stats ?? null);
                setPagination(data.pagination ?? { total: 0, page: 1, pages: 1, limit: lim });
            } catch {
                toastError("Network error");
            } finally {
                setLoading(false);
            }
        },
        [token, search, ratingFilter, statusFilter, dateRange, limit],
    );

    useEffect(() => {
        if (canRead) fetchData(1, search, ratingFilter, statusFilter, dateRange, limit);
    }, [canRead]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        fetchData(1, searchInput, ratingFilter, statusFilter, dateRange, limit);
    };

    const clearAll = () => {
        setSearch(""); setSearchInput("");
        setRatingFilter("all"); setStatusFilter("all"); setDateRange("all");
        fetchData(1, "", "all", "all", "all", limit);
    };

    const activeFilterCount = [ratingFilter !== "all", statusFilter !== "all", dateRange !== "all"].filter(Boolean).length;
    const hasActiveFilters = !!search || activeFilterCount > 0;

    if (!privLoading && !canRead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <FiAlertCircle size={26} className="text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Access Denied</h2>
                <p className="text-sm text-gray-500 mt-1">You do not have permission to view all reviews.</p>
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
                            <FiStar size={20} className="text-amber-500" />
                            Reviews
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">All user reviews across the platform</p>
                    </div>
                    <button
                        onClick={() => fetchData(pagination.page, search, ratingFilter, statusFilter, dateRange, limit)}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50 shrink-0"
                    >
                        <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* Stats */}
                {loading && !stats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 animate-pulse flex items-center gap-3">
                                <div className="w-9 h-9 bg-gray-200 rounded-lg shrink-0" />
                                <div className="flex-1">
                                    <div className="h-4 w-10 bg-gray-200 rounded mb-1.5" />
                                    <div className="h-3 w-16 bg-gray-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard icon={FiMessageSquare} label="Total Reviews" value={stats.totalReviews} color="text-indigo-600" bg="bg-indigo-50" />
                        <StatCard icon={FiStar} label="Avg Rating" value={`${stats.avgRating} / 5`} color="text-amber-600" bg="bg-amber-50" />
                        <StatCard icon={FiTrendingUp} label="5-Star Reviews" value={stats.fiveStarCount} color="text-emerald-600" bg="bg-emerald-50" />
                        <StatCard icon={FiClock} label="This Week" value={stats.thisWeek} color="text-violet-600" bg="bg-violet-50" />
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1 min-w-0">
                            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by user, resume, template, review text..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                            />
                        </div>
                        <button type="submit" className="shrink-0 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            className={`sm:hidden shrink-0 flex items-center gap-1 px-3 py-2 text-sm border rounded-lg transition-colors relative ${
                                activeFilterCount > 0 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            <FiFilter size={14} />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                            {showFilters ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                        </button>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearAll}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
                            >
                                <FiX size={14} />
                                <span className="hidden sm:inline">Clear all</span>
                            </button>
                        )}
                    </form>

                    <div className={`flex-col gap-2.5 ${showFilters ? "flex" : "hidden sm:flex"}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 min-w-[80px]">
                                <FiFilter size={11} /> Rating
                            </span>
                            <FilterPills options={RATING_OPTIONS} value={ratingFilter} onChange={(v) => { setRatingFilter(v); fetchData(1, search, v, statusFilter, dateRange, limit); }} />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 min-w-[80px]">
                                <FiFilter size={11} /> Status
                            </span>
                            <FilterPills options={STATUS_OPTIONS} value={statusFilter} onChange={(v) => { setStatusFilter(v); fetchData(1, search, ratingFilter, v, dateRange, limit); }} />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 min-w-[80px]">
                                <FiCalendar size={11} /> Date
                            </span>
                            <FilterPills options={DATE_OPTIONS} value={dateRange} onChange={(v) => { setDateRange(v); fetchData(1, search, ratingFilter, statusFilter, v, limit); }} />
                        </div>
                    </div>
                </div>

                {/* Records */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {["#", "User", "Rating", "Review", "Resume / Template", "Status", "Date"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <td key={j} className="px-4 py-3">
                                                    <div className="h-4 bg-gray-100 rounded w-full" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">No reviews found</td>
                                    </tr>
                                ) : records.map((rec, idx) => (
                                    <tr
                                        key={rec._id}
                                        className="hover:bg-gray-50/70 cursor-pointer transition-colors"
                                        onClick={() => setDetailRecord(rec)}
                                    >
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {(pagination.page - 1) * pagination.limit + idx + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-800 text-xs">{rec.userName}</div>
                                            <div className="text-gray-400 text-xs truncate max-w-[160px]">{rec.userEmail}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StarDisplay rating={rec.rating} />
                                            <span className="text-xs text-gray-500 mt-0.5 block">{rec.rating} / 5</span>
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            {rec.title && <div className="font-medium text-gray-800 text-xs truncate">{rec.title}</div>}
                                            {rec.body && <div className="text-gray-500 text-xs truncate mt-0.5">{rec.body}</div>}
                                            {!rec.title && !rec.body && <span className="text-gray-300 text-xs italic">No text</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            {rec.resumeName && <div className="text-xs text-gray-700 truncate max-w-[140px]">{rec.resumeName}</div>}
                                            {rec.templateName && <div className="text-xs text-gray-400 truncate max-w-[140px]">{rec.templateName}</div>}
                                            {!rec.resumeName && !rec.templateName && <span className="text-gray-300 text-xs">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={rec.status} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                            {formatDate(rec.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="p-4 animate-pulse space-y-2">
                                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                                </div>
                            ))
                        ) : records.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 text-sm">No reviews found</div>
                        ) : records.map((rec) => (
                            <div
                                key={rec._id}
                                className="p-4 hover:bg-gray-50/60 active:bg-gray-100 cursor-pointer transition-colors"
                                onClick={() => setDetailRecord(rec)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <StarDisplay rating={rec.rating} />
                                        {rec.title && (
                                            <p className="font-semibold text-gray-900 text-sm mt-1 truncate">{rec.title}</p>
                                        )}
                                        {rec.body && (
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{rec.body}</p>
                                        )}
                                    </div>
                                    <StatusBadge status={rec.status} />
                                </div>

                                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                                    <FiUser size={11} className="text-gray-400" />
                                    <span className="font-medium text-gray-700">{rec.userName}</span>
                                    <span className="text-gray-300">·</span>
                                    <span className="truncate text-gray-400">{rec.userEmail}</span>
                                </div>

                                {(rec.resumeName || rec.templateName) && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                                        <FiFileText size={10} className="shrink-0" />
                                        <span className="truncate">{rec.resumeName || rec.templateName}</span>
                                    </div>
                                )}

                                <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                    <FiCalendar size={10} />
                                    {formatDate(rec.createdAt)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <PaginationBar
                        pagination={pagination}
                        onPage={(p) => fetchData(p, search, ratingFilter, statusFilter, dateRange, limit)}
                        limit={limit}
                        onLimitChange={(l) => { setLimit(l); fetchData(1, search, ratingFilter, statusFilter, dateRange, l); }}
                    />
                </div>
            </div>

            {detailRecord && <DetailModal record={detailRecord} onClose={() => setDetailRecord(null)} />}
        </div>
    );
}
