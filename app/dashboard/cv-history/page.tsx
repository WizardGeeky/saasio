"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";
import { usePrivilege } from "@/app/utils/usePrivilege";
import {
  FiLayers,
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiFileText,
  FiCalendar,
  FiAlertCircle,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiPackage,
  FiTag,
  FiZap,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiCpu,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CvHistoryRecord {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  resumeName: string;
  resumeTitle: string;
  fileName: string;
  templateId: string;
  templateName: string;
  source: string;
  subscriptionId: string | null;
  subscriptionPlanName: string | null;
  subscriptionProjectName: string | null;
  subscriptionStatus: string | null;
  subscriptionPlanPrice: number | null;
  subscriptionCurrency: string;
  createdAt: string;
}

interface Stats {
  totalDownloads: number;
  uniqueUsers: number;
  subscriptionDownloads: number;
  freeDownloads: number;
  aiGenerations: number;
  thisWeek: number;
  topTemplate: string;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

type SubscriptionFilter = "all" | "subscribed" | "free";
type SourceFilter = "all" | "ai" | "manual";
type DateRange = "all" | "today" | "week" | "month";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
}

function SourceBadge({ source }: { source: string }) {
  const isAi = source?.toLowerCase().includes("ai");
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
        isAi
          ? "bg-violet-50 text-violet-700 border-violet-200"
          : "bg-gray-50 text-gray-600 border-gray-200"
      }`}
    >
      {isAi ? <FiZap size={10} /> : <FiFileText size={10} />}
      {source || "resume-config"}
    </span>
  );
}

function SubscriptionBadge({ record }: { record: CvHistoryRecord }) {
  if (!record.subscriptionId) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200">
        Free
      </span>
    );
  }
  const statusColor =
    record.subscriptionStatus === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <div className="space-y-0.5">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${statusColor}`}
      >
        <FiPackage size={10} />
        {record.subscriptionPlanName || "Subscribed"}
      </span>
      {record.subscriptionProjectName && (
        <div className="text-xs text-gray-400 truncate max-w-[140px]">
          {record.subscriptionProjectName}
        </div>
      )}
    </div>
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

function DetailModal({
  record,
  onClose,
}: {
  record: CvHistoryRecord;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100">
          <div className="min-w-0 flex-1 pr-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
              {record.resumeName || record.resumeTitle || record.fileName || "Untitled"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
              {record.fileName}
            </p>
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              User
            </h3>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <FiUser size={14} className="text-gray-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800">{record.userName}</div>
                <div className="text-xs text-gray-500 truncate">{record.userEmail}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              CV Details
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["CV Name", record.resumeName || "—"],
                ["CV Title", record.resumeTitle || "—"],
                ["File Name", record.fileName],
                ["Template", record.templateName],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-gray-50 border border-gray-100 rounded-lg p-2.5"
                >
                  <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                  <div className="text-gray-800 text-xs font-medium wrap-break-word" title={value}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <FiCalendar size={13} className="text-gray-400" />
              <span className="text-gray-700 text-xs">{formatDateTime(record.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <SourceBadge source={record.source} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Subscription
            </h3>
            {record.subscriptionId ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Plan", record.subscriptionPlanName || "—"],
                  ["Project", record.subscriptionProjectName || "—"],
                  ["Status", record.subscriptionStatus || "—"],
                  [
                    "Price",
                    record.subscriptionPlanPrice != null
                      ? `${record.subscriptionCurrency} ${record.subscriptionPlanPrice}`
                      : "—",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="bg-gray-50 border border-gray-100 rounded-lg p-2.5"
                  >
                    <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                    <div className="text-gray-800 text-xs font-medium wrap-break-word" title={value}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Free — no subscription used.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  record,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  record: CvHistoryRecord;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center mb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 rounded-xl shrink-0">
            <FiAlertTriangle size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Delete CV Record?</h3>
            <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-0.5">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {record.resumeName || record.resumeTitle || record.fileName || "Untitled"}
          </p>
          <p className="text-xs text-gray-400 truncate">{record.userEmail}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50">
            {isDeleting
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting…</>
              : <><FiTrash2 size={14} /> Delete</>}
          </button>
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
      const p = Math.max(1, Math.min(page - half + i, pages - 4 + i));
      pageNums.push(p);
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
            <option key={n} value={n}>
              {n} / page
            </option>
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
              page === p
                ? "bg-indigo-600 text-white"
                : "hover:bg-gray-100 text-gray-600"
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
        <div
          className="text-sm sm:text-xl font-bold text-gray-900 leading-tight sm:leading-normal line-clamp-2 sm:truncate"
          title={String(value)}
        >
          {value}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ─── Filter options ───────────────────────────────────────────────────────────

const SUBSCRIPTION_OPTIONS: { value: SubscriptionFilter; label: string; activeClass: string }[] = [
  { value: "all",        label: "All",        activeClass: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "subscribed", label: "Subscribed", activeClass: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "free",       label: "Free",       activeClass: "bg-sky-100 text-sky-700 border-sky-200" },
];

const SOURCE_OPTIONS: { value: SourceFilter; label: string; activeClass: string }[] = [
  { value: "all",    label: "All Sources", activeClass: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "ai",     label: "AI",          activeClass: "bg-violet-100 text-violet-700 border-violet-200" },
  { value: "manual", label: "Manual",      activeClass: "bg-indigo-100 text-indigo-700 border-indigo-200" },
];

const DATE_OPTIONS: { value: DateRange; label: string; activeClass: string }[] = [
  { value: "all",   label: "All Time",   activeClass: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "today", label: "Today",      activeClass: "bg-rose-100 text-rose-700 border-rose-200" },
  { value: "week",  label: "This Week",  activeClass: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "month", label: "This Month", activeClass: "bg-teal-100 text-teal-700 border-teal-200" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CvHistoryPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const { can, isLoading: privLoading } = usePrivilege();
  const token = getStoredToken();

  const canRead = !privLoading && can("GET", "/api/v1/private/cv-history");

  const [records, setRecords] = useState<CvHistoryRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [limit, setLimit] = useState(20);
  const [detailRecord, setDetailRecord] = useState<CvHistoryRecord | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<CvHistoryRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(
    async (
      page = 1,
      q = search,
      sf = subscriptionFilter,
      src = sourceFilter,
      dr = dateRange,
      lim = limit,
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(lim),
          search: q,
          subscriptionFilter: sf,
          sourceFilter: src,
          dateRange: dr,
        });
        const res = await fetch(`/api/v1/private/cv-history?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          toastError(data.message ?? "Failed to load CV history");
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
    [token, search, subscriptionFilter, sourceFilter, dateRange, limit],
  );

  useEffect(() => {
    if (canRead) fetchData(1, search, subscriptionFilter, sourceFilter, dateRange, limit);
  }, [canRead]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    fetchData(1, searchInput, subscriptionFilter, sourceFilter, dateRange, limit);
  };

  const handleSubscriptionFilter = (sf: SubscriptionFilter) => {
    setSubscriptionFilter(sf);
    fetchData(1, search, sf, sourceFilter, dateRange, limit);
  };

  const handleSourceFilter = (src: SourceFilter) => {
    setSourceFilter(src);
    fetchData(1, search, subscriptionFilter, src, dateRange, limit);
  };

  const handleDateRange = (dr: DateRange) => {
    setDateRange(dr);
    fetchData(1, search, subscriptionFilter, sourceFilter, dr, limit);
  };

  const handleLimit = (lim: number) => {
    setLimit(lim);
    fetchData(1, search, subscriptionFilter, sourceFilter, dateRange, lim);
  };

  const handlePage = (p: number) =>
    fetchData(p, search, subscriptionFilter, sourceFilter, dateRange, limit);

  const clearAll = () => {
    setSearch("");
    setSearchInput("");
    setSubscriptionFilter("all");
    setSourceFilter("all");
    setDateRange("all");
    fetchData(1, "", "all", "all", "all", limit);
  };

  const handleDelete = async () => {
    if (!deleteRecord) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/private/cv-history/${deleteRecord._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete record.");
      toastSuccess("CV record deleted.");
      setDeleteRecord(null);
      fetchData(pagination.page, search, subscriptionFilter, sourceFilter, dateRange, limit);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete record.");
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = search || subscriptionFilter !== "all" || sourceFilter !== "all" || dateRange !== "all";
  const activeFilterCount = [
    subscriptionFilter !== "all",
    sourceFilter !== "all",
    dateRange !== "all",
  ].filter(Boolean).length;

  if (!privLoading && !canRead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <FiAlertCircle size={26} className="text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Access Denied</h2>
        <p className="text-sm text-gray-500 mt-1">
          You do not have permission to view CV history.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiLayers size={20} className="text-indigo-500" />
              CV History
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              All CV generations and downloads across all users
            </p>
          </div>
          <button
            onClick={() => fetchData(pagination.page, search, subscriptionFilter, sourceFilter, dateRange, limit)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50 shrink-0"
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        {loading && !stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 animate-pulse flex items-center gap-3 sm:block">
                <div className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-200 rounded-lg shrink-0 sm:mb-3" />
                <div className="flex-1">
                  <div className="h-4 w-10 bg-gray-200 rounded mb-1.5" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { icon: FiLayers,  label: "Total CVs",        value: stats.totalDownloads,        color: "text-indigo-600", bg: "bg-indigo-50" },
                { icon: FiUsers,   label: "Unique Users",     value: stats.uniqueUsers,            color: "text-violet-600", bg: "bg-violet-50" },
                { icon: FiCpu,     label: "AI Generated",     value: stats.aiGenerations,          color: "text-emerald-600",bg: "bg-emerald-50" },
                { icon: FiPackage, label: "Subscribed",       value: stats.subscriptionDownloads,  color: "text-sky-600",    bg: "bg-sky-50" },
                { icon: FiFileText,label: "Free",             value: stats.freeDownloads,          color: "text-rose-600",   bg: "bg-rose-50" },
                { icon: FiCalendar,label: "This Week",        value: stats.thisWeek,               color: "text-amber-600",  bg: "bg-amber-50" },
                { icon: FiTag,     label: "Top Template",     value: stats.topTemplate,            color: "text-teal-600",   bg: "bg-teal-50" },
              ].map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </div>
          )
        )}

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, CV name, template..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`sm:hidden shrink-0 flex items-center gap-1 px-3 py-2 text-sm border rounded-lg transition-colors relative ${
                activeFilterCount > 0
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
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
                <FiFilter size={11} /> Subscription
              </span>
              <FilterPills options={SUBSCRIPTION_OPTIONS} value={subscriptionFilter} onChange={handleSubscriptionFilter} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 min-w-[80px]">
                <FiFilter size={11} /> Source
              </span>
              <FilterPills options={SOURCE_OPTIONS} value={sourceFilter} onChange={handleSourceFilter} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 min-w-[80px]">
                <FiCalendar size={11} /> Date
              </span>
              <FilterPills options={DATE_OPTIONS} value={dateRange} onChange={handleDateRange} />
            </div>
          </div>
        </div>

        {/* ── Records ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["#", "User", "CV", "Template", "Source", "Subscription", "Date", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No records found
                    </td>
                  </tr>
                ) : (
                  records.map((rec, idx) => {
                    const rowNum = (pagination.page - 1) * pagination.limit + idx + 1;
                    return (
                      <tr
                        key={rec._id}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs cursor-pointer" onClick={() => setDetailRecord(rec)}>{rowNum}</td>
                        <td className="px-4 py-3 cursor-pointer" onClick={() => setDetailRecord(rec)}>
                          <div className="font-medium text-gray-800 text-xs">{rec.userName}</div>
                          <div className="text-gray-400 text-xs truncate max-w-[180px]" title={rec.userEmail}>
                            {rec.userEmail}
                          </div>
                        </td>
                        <td className="px-4 py-3 cursor-pointer" onClick={() => setDetailRecord(rec)}>
                          <div className="font-medium text-gray-800 max-w-[160px] truncate">
                            {rec.resumeName || rec.resumeTitle || "—"}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-[160px]">{rec.fileName}</div>
                        </td>
                        <td className="px-4 py-3 cursor-pointer" onClick={() => setDetailRecord(rec)}>
                          <div className="text-xs text-gray-700 max-w-[120px] truncate">{rec.templateName}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[120px]">{rec.templateId}</div>
                        </td>
                        <td className="px-4 py-3 cursor-pointer" onClick={() => setDetailRecord(rec)}>
                          <SourceBadge source={rec.source} />
                        </td>
                        <td className="px-4 py-3 cursor-pointer" onClick={() => setDetailRecord(rec)}>
                          <SubscriptionBadge record={rec} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap cursor-pointer" onClick={() => setDetailRecord(rec)}>
                          {formatDate(rec.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setDeleteRecord(rec)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
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
              <div className="py-12 text-center text-gray-400 text-sm">No records found</div>
            ) : (
              records.map((rec) => (
                <div
                  key={rec._id}
                  className={`p-4 transition-colors border-l-[3px] ${
                    rec.subscriptionId ? "border-emerald-400" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2" onClick={() => setDetailRecord(rec)}>
                    <div className="font-semibold text-gray-900 text-sm leading-tight truncate flex-1 cursor-pointer">
                      {rec.resumeName || rec.resumeTitle || rec.fileName || "Untitled"}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <SubscriptionBadge record={rec} />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteRecord(rec); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer" onClick={() => setDetailRecord(rec)}>
                    <FiUser size={11} className="shrink-0 text-gray-400" />
                    <span className="font-medium text-gray-700">{rec.userName}</span>
                    <span className="text-gray-300">·</span>
                    <span className="truncate text-gray-400">{rec.userEmail}</span>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer" onClick={() => setDetailRecord(rec)}>
                    <FiTag size={10} className="shrink-0" />
                    <span className="truncate">{rec.templateName}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 flex-wrap cursor-pointer" onClick={() => setDetailRecord(rec)}>
                    <SourceBadge source={rec.source} />
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FiCalendar size={10} />
                      {formatDate(rec.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <PaginationBar
            pagination={pagination}
            onPage={handlePage}
            limit={limit}
            onLimitChange={handleLimit}
          />
        </div>
      </div>

      {detailRecord && (
        <DetailModal record={detailRecord} onClose={() => setDetailRecord(null)} />
      )}

      {deleteRecord && (
        <DeleteConfirmModal
          record={deleteRecord}
          onConfirm={handleDelete}
          onCancel={() => !isDeleting && setDeleteRecord(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
