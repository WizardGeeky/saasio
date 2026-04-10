"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiFilter,
  FiMail,
  FiCalendar,
  FiTag,
  FiDollarSign,
  FiCreditCard,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";

interface Subscription {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  projectId: string;
  projectName: string;
  planName: string;
  planPrice: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (rupees: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(rupees);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const STATUS_CFG: Record<
  SubscriptionStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  ACTIVE: {
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  EXPIRED: {
    label: "Expired",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
};

// ─── Detail row ───────────────────────────────────────────────────────────────

function Detail({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p
          className={`text-sm text-slate-700 break-all ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const { error: toastError } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 15,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── Summary counts derived from current page data (for the top bar) ───────
  const activeCnt = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const cancelledCnt = subscriptions.filter(
    (s) => s.status === "CANCELLED",
  ).length;
  const expiredCnt = subscriptions.filter((s) => s.status === "EXPIRED").length;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/private/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to load subscriptions");

      setSubscriptions(data.data.subscriptions);
      setPagination(data.data.pagination);
    } catch (err: any) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, toastError]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleStatusFilter = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
            <FiPackage size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
            <p className="text-sm text-slate-500">
              All user subscriptions with payment details
            </p>
          </div>
        </div>
        <button
          onClick={fetchSubscriptions}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-colors"
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Quick summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total (this page)",
            val: subscriptions.length,
            icon: <FiUsers size={15} />,
            bg: "bg-indigo-50",
            text: "text-indigo-600",
          },
          {
            label: "Active",
            val: activeCnt,
            icon: <FiCheckCircle size={15} />,
            bg: "bg-emerald-50",
            text: "text-emerald-600",
          },
          {
            label: "Expired",
            val: expiredCnt,
            icon: <FiClock size={15} />,
            bg: "bg-amber-50",
            text: "text-amber-600",
          },
          {
            label: "Cancelled",
            val: cancelledCnt,
            icon: <FiXCircle size={15} />,
            bg: "bg-red-50",
            text: "text-red-600",
          },
        ].map(({ label, val, icon, bg, text }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3"
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-lg ${bg}`}
            >
              <span className={text}>{icon}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-bold text-slate-900">{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 flex-1 min-w-[220px]"
        >
          <div className="relative flex-1">
            <FiSearch
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search email, project, plan…"
              className="w-full pl-8 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <FiFilter size={13} className="text-slate-400" />
          {(["", "ACTIVE", "CANCELLED", "EXPIRED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === s
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Loading subscriptions…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <FiAlertCircle size={18} className="shrink-0" />
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchSubscriptions}
            className="ml-auto text-sm font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && subscriptions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-400">
          <FiPackage size={40} />
          <p className="text-base font-medium">No subscriptions found</p>
          {(search || statusFilter) && (
            <button
              onClick={() => {
                clearSearch();
                handleStatusFilter("");
              }}
              className="text-sm text-indigo-600 underline mt-1"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Subscription list */}
      {!loading && !error && subscriptions.length > 0 && (
        <div className="flex flex-col gap-3">
          {subscriptions.map((sub) => {
            const cfg = STATUS_CFG[sub.status];
            const isOpen = expanded === sub._id;

            return (
              <div
                key={sub._id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* ── Summary row ─────────────────────────────── */}
                <button
                  className="w-full text-left px-5 py-4 flex flex-wrap items-start gap-4"
                  onClick={() => setExpanded(isOpen ? null : sub._id)}
                >
                  {/* User info */}
                  <div className="flex items-center gap-3 min-w-[180px] flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 shrink-0">
                      <FiUser size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {sub.userName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {sub.userEmail}
                      </p>
                    </div>
                  </div>

                  {/* Project + plan */}
                  <div className="min-w-[140px] flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {sub.projectName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {sub.planName} Plan
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="min-w-[80px] text-right sm:text-left">
                    <p className="text-sm font-bold text-slate-900">
                      {fmt(sub.planPrice, sub.currency)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {fmtDate(sub.createdAt)}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full self-center ${cfg.bg} ${cfg.text}`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                    />
                    {cfg.label}
                  </span>

                  {/* Chevron */}
                  <FiChevronDown
                    size={16}
                    className={`text-slate-400 self-center transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* ── Expanded details ─────────────────────────── */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                      {/* User */}
                      <Detail
                        icon={<FiUser size={13} />}
                        label="User Name"
                        value={sub.userName}
                      />
                      <Detail
                        icon={<FiMail size={13} />}
                        label="User Email"
                        value={sub.userEmail}
                      />
                      <Detail
                        icon={<FiTag size={13} />}
                        label="User ID"
                        value={sub.userId}
                        mono
                      />
                      {/* Project */}
                      <Detail
                        icon={<FiPackage size={13} />}
                        label="Project"
                        value={sub.projectName}
                      />
                      <Detail
                        icon={<FiTag size={13} />}
                        label="Project ID"
                        value={sub.projectId}
                        mono
                      />
                      <Detail
                        icon={<FiPackage size={13} />}
                        label="Plan"
                        value={sub.planName}
                      />
                      {/* Payment */}
                      <Detail
                        icon={<FiDollarSign size={13} />}
                        label="Amount Paid"
                        value={fmt(sub.planPrice, sub.currency)}
                      />
                      <Detail
                        icon={<FiCalendar size={13} />}
                        label="Subscribed"
                        value={fmtDateTime(sub.createdAt)}
                      />
                      <Detail
                        icon={<FiCalendar size={13} />}
                        label="Last Updated"
                        value={fmtDateTime(sub.updatedAt)}
                      />
                      <Detail
                        icon={<FiCreditCard size={13} />}
                        label="Order ID"
                        value={sub.razorpayOrderId}
                        mono
                      />
                      <Detail
                        icon={<FiCreditCard size={13} />}
                        label="Payment ID"
                        value={sub.razorpayPaymentId}
                        mono
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && !loading && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft size={14} /> Prev
            </button>
            <span className="text-sm font-medium text-slate-700">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages || loading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
