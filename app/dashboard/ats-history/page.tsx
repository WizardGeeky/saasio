"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";
import { usePrivilege } from "@/app/utils/usePrivilege";
import {
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiFileText,
  FiTrendingUp,
  FiAward,
  FiCalendar,
  FiAlertCircle,
  FiBarChart2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiTag,
  FiCpu,
  FiUser,
  FiTarget,
  FiCheckCircle,
} from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionScores {
  skills: number;
  experience: number;
  projects: number;
  education: number;
}

interface AtsAnalysis {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  sectionScores: SectionScores;
  suggestions: string[];
}

interface AtsHistoryRecord {
  _id: string;
  jobRoleName: string;
  fileName: string;
  analysis: AtsAnalysis;
  modelId: { displayName: string; provider: string; modelName: string } | null;
  userDisplayName: string;
  userDisplayEmail: string;
  createdAt: string;
}

interface Stats {
  totalRecords: number;
  uniqueUsers: number;
  avgScore: number;
  highMatch: number;
  mediumMatch: number;
  lowMatch: number;
  thisWeek: number;
  avgSectionScores: SectionScores;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

type ScoreFilter = "all" | "high" | "medium" | "low";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreStyle(score: number) {
  if (score >= 80)
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
      bar: "bg-emerald-500",
    };
  if (score >= 60)
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
      bar: "bg-amber-500",
    };
  return {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    bar: "bg-red-500",
  };
}

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

function MiniBar({
  value,
  color = "bg-indigo-500",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-7 text-right">{value}%</span>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  record,
  onClose,
}: {
  record: AtsHistoryRecord;
  onClose: () => void;
}) {
  const s = scoreStyle(record.analysis.score);
  const ss = record.analysis.sectionScores;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {record.jobRoleName || "Unnamed Role"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{record.fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User + Model info */}
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <FiUser size={13} className="text-gray-400" />
              <span className="text-gray-700">{record.userDisplayName}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 text-xs">
                {record.userDisplayEmail}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <FiCpu size={13} className="text-gray-400" />
              <span className="text-gray-700">
                {record.modelId?.displayName ?? "Unknown model"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <FiCalendar size={13} className="text-gray-400" />
              <span className="text-gray-700">
                {formatDateTime(record.createdAt)}
              </span>
            </div>
          </div>

          {/* Overall Score */}
          <div
            className={`flex items-center gap-4 p-4 rounded-xl border ${s.bg} ${s.border}`}
          >
            <div className={`text-5xl font-bold ${s.text}`}>
              {record.analysis.score}
            </div>
            <div>
              <div className={`text-sm font-semibold ${s.text}`}>
                {record.analysis.score >= 80
                  ? "High Match"
                  : record.analysis.score >= 60
                    ? "Medium Match"
                    : "Low Match"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Overall ATS score
              </div>
            </div>
          </div>

          {/* Section Scores */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Section Scores
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(["skills", "experience", "projects", "education"] as const).map(
                (key) => {
                  const val = ss[key];
                  const cs = scoreStyle(val);
                  return (
                    <div
                      key={key}
                      className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-600 capitalize">
                          {key}
                        </span>
                        <span className={`text-xs font-semibold ${cs.text}`}>
                          {val}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cs.bar}`}
                          style={{ width: `${Math.min(100, val)}%` }}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Keywords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                <FiCheckCircle size={13} /> Matched Keywords (
                {record.analysis.matchedKeywords.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {record.analysis.matchedKeywords.slice(0, 20).map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs"
                  >
                    {kw}
                  </span>
                ))}
                {record.analysis.matchedKeywords.length > 20 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                    +{record.analysis.matchedKeywords.length - 20} more
                  </span>
                )}
                {record.analysis.matchedKeywords.length === 0 && (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                <FiAlertCircle size={13} /> Missing Keywords (
                {record.analysis.missingKeywords.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {record.analysis.missingKeywords.slice(0, 20).map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs"
                  >
                    {kw}
                  </span>
                ))}
                {record.analysis.missingKeywords.length > 20 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                    +{record.analysis.missingKeywords.length - 20} more
                  </span>
                )}
                {record.analysis.missingKeywords.length === 0 && (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {record.analysis.suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Suggestions
              </h3>
              <ul className="space-y-2">
                {record.analysis.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AtsHistoryPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const { can, isLoading: privLoading } = usePrivilege();
  const token = getStoredToken();

  const canRead = !privLoading && can("GET", "/api/v1/private/ai-ats");

  const [records, setRecords] = useState<AtsHistoryRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [detailRecord, setDetailRecord] = useState<AtsHistoryRecord | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(
    async (page = 1, q = search, sf = scoreFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
          search: q,
          scoreFilter: sf,
        });
        const res = await fetch(`/api/v1/private/ats-history?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          toastError(data.message ?? "Failed to load history");
          return;
        }
        setRecords(data.records ?? []);
        setStats(data.stats ?? null);
        setPagination(
          data.pagination ?? { total: 0, page: 1, pages: 1, limit: 20 },
        );
      } catch {
        toastError("Network error");
      } finally {
        setLoading(false);
      }
    },
    [token, search, scoreFilter],
  );

  useEffect(() => {
    if (canRead) fetchData(1, search, scoreFilter);
  }, [canRead]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    fetchData(1, searchInput, scoreFilter);
  };

  const handleScoreFilter = (sf: ScoreFilter) => {
    setScoreFilter(sf);
    fetchData(1, search, sf);
  };

  const handlePage = (p: number) => fetchData(p, search, scoreFilter);

  // ── Permission guard ──
  if (!privLoading && !canRead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <FiAlertCircle size={26} className="text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Access Denied</h2>
        <p className="text-sm text-gray-500 mt-1">
          You do not have permission to view ATS history.
        </p>
      </div>
    );
  }

  const total = stats?.totalRecords ?? 0;
  const distMax = total > 0 ? total : 1;

  const scoreFilterOptions: {
    value: ScoreFilter;
    label: string;
    color: string;
  }[] = [
    {
      value: "all",
      label: "All",
      color: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
    },
    {
      value: "high",
      label: "High ≥80",
      color:
        "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
    },
    {
      value: "medium",
      label: "Medium 60–79",
      color: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
    },
    {
      value: "low",
      label: "Low <60",
      color: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiClock size={22} className="text-indigo-500" />
              ATS History
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              All ATS analyses across all users
            </p>
          </div>
          <button
            onClick={() => fetchData(pagination.page, search, scoreFilter)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Stats Cards ─────────────────────────────────────────────── */}
        {loading && !stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
              >
                <div className="h-3 w-16 bg-gray-200 rounded mb-3" />
                <div className="h-6 w-10 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                {
                  icon: FiFileText,
                  label: "Total Analyses",
                  value: stats.totalRecords,
                  color: "text-indigo-600",
                  bg: "bg-indigo-50",
                },
                {
                  icon: FiUsers,
                  label: "Unique Users",
                  value: stats.uniqueUsers,
                  color: "text-violet-600",
                  bg: "bg-violet-50",
                },
                {
                  icon: FiTrendingUp,
                  label: "Avg Score",
                  value: `${stats.avgScore}%`,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  icon: FiAward,
                  label: "High Match ≥80",
                  value: stats.highMatch,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  icon: FiCalendar,
                  label: "This Week",
                  value: stats.thisWeek,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  icon: FiAlertCircle,
                  label: "Low Match <60",
                  value: stats.lowMatch,
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}
                  >
                    <Icon size={16} className={color} />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <FiSearch
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by job role..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Search
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                    fetchData(1, "", scoreFilter);
                  }}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </form>

            {/* Score Filter */}
            <div className="flex gap-1.5 flex-wrap">
              {scoreFilterOptions.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => handleScoreFilter(value)}
                  className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                    scoreFilter === value
                      ? color + " ring-2 ring-offset-1 ring-current"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Records Table / Cards ────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table — desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Job Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Sections
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Date
                  </th>
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
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-gray-400 text-sm"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  records.map((rec, idx) => {
                    const s = scoreStyle(rec.analysis.score);
                    const ss = rec.analysis.sectionScores;
                    const rowNum =
                      (pagination.page - 1) * pagination.limit + idx + 1;
                    return (
                      <tr
                        key={rec._id}
                        className="hover:bg-gray-50/70 cursor-pointer transition-colors"
                        onClick={() => setDetailRecord(rec)}
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {rowNum}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800 text-xs">
                            {rec.userDisplayName}
                          </div>
                          <div
                            className="text-gray-400 text-xs truncate max-w-[200px]"
                            title={rec.userDisplayEmail}
                          >
                            {rec.userDisplayEmail}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800 max-w-[180px] truncate">
                            {rec.jobRoleName || "—"}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-[180px]">
                            {rec.fileName}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                            />
                            {rec.analysis.score}%
                          </span>
                        </td>
                        <td className="px-4 py-3 space-y-1 min-w-[140px]">
                          <MiniBar
                            value={ss.skills}
                            color={scoreStyle(ss.skills).bar}
                          />
                          <MiniBar
                            value={ss.experience}
                            color={scoreStyle(ss.experience).bar}
                          />
                          <MiniBar
                            value={ss.projects}
                            color={scoreStyle(ss.projects).bar}
                          />
                          <MiniBar
                            value={ss.education}
                            color={scoreStyle(ss.education).bar}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {rec.modelId ? (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <FiCpu size={11} className="text-gray-400" />
                              {rec.modelId.displayName}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(rec.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
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
              <div className="py-12 text-center text-gray-400 text-sm">
                No records found
              </div>
            ) : (
              records.map((rec) => {
                const s = scoreStyle(rec.analysis.score);
                return (
                  <div
                    key={rec._id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setDetailRecord(rec)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {rec.jobRoleName || "Unnamed Role"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <FiUser size={11} />
                          {rec.userDisplayName}
                        </div>
                        <div
                          className="text-xs text-gray-400 mt-0.5 truncate"
                          title={rec.userDisplayEmail}
                        >
                          {rec.userDisplayEmail}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                          {rec.modelId && (
                            <span className="flex items-center gap-1">
                              <FiCpu size={10} /> {rec.modelId.displayName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FiCalendar size={10} /> {formatDate(rec.createdAt)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {rec.analysis.score}%
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1.5">
                      {(
                        [
                          "skills",
                          "experience",
                          "projects",
                          "education",
                        ] as const
                      ).map((key) => {
                        const val = rec.analysis.sectionScores[key];
                        const cs = scoreStyle(val);
                        return (
                          <div key={key} className="text-center">
                            <div className={`text-xs font-semibold ${cs.text}`}>
                              {val}%
                            </div>
                            <div className="text-xs text-gray-400 capitalize">
                              {key.slice(0, 3)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft size={16} />
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    let p = i + 1;
                    if (pagination.pages > 5) {
                      const half = 2;
                      p = Math.max(
                        1,
                        Math.min(
                          pagination.page - half + i,
                          pagination.pages - 4 + i,
                        ),
                      );
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => handlePage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          pagination.page === p
                            ? "bg-indigo-600 text-white"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  },
                )}
                <button
                  onClick={() => handlePage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────── */}
      {detailRecord && (
        <DetailModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
        />
      )}
    </div>
  );
}
