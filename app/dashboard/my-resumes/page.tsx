"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    FiBriefcase,
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiDownload,
    FiFileText,
    FiLayers,
    FiPackage,
    FiRefreshCw,
    FiSearch,
    FiTag,
} from "react-icons/fi";
import { getStoredToken } from "@/app/utils/token";

type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "";
type SubscriptionSource = "snapshot" | "matched" | "none";

interface ResumeSubscription {
    id: string;
    projectId: string;
    projectName: string;
    planName: string;
    planPrice: number | null;
    currency: string;
    status: SubscriptionStatus;
    usageCount?: number | null;
    maxUsage?: number | null;
    remaining?: number | null;
    source: SubscriptionSource;
}

interface OwnedResume {
    key: string;
    latestRecordId: string;
    hasResumeSnapshot: boolean;
    fileName: string;
    resumeName: string;
    resumeTitle: string;
    templateId: string;
    templateName: string;
    downloads: number;
    firstDownloadedAt: string;
    lastDownloadedAt: string;
    source: string;
    subscription: ResumeSubscription | null;
}

interface ResumeHistoryItem {
    _id: string;
    hasResumeSnapshot: boolean;
    fileName: string;
    resumeName: string;
    resumeTitle: string;
    templateId: string;
    templateName: string;
    source: string;
    createdAt: string;
    subscription: ResumeSubscription | null;
}

interface ResumeStats {
    totalDownloads: number;
    ownedResumes: number;
    uniqueFormats: number;
    subscriptionDownloads: number;
    freeDownloads: number;
    latestDownloadAt: string | null;
}

interface Pagination {
    total: number;
    page: number;
    pages: number;
    limit: number;
}

interface MyResumesResponse {
    success: boolean;
    message?: string;
    data: {
        stats: ResumeStats;
        ownedResumes: OwnedResume[];
        history: ResumeHistoryItem[];
        pagination: Pagination;
    };
}

const EMPTY_STATS: ResumeStats = {
    totalDownloads: 0,
    ownedResumes: 0,
    uniqueFormats: 0,
    subscriptionDownloads: 0,
    freeDownloads: 0,
    latestDownloadAt: null,
};

const EMPTY_PAGINATION: Pagination = {
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
};

function formatDateTime(value: string | null) {
    if (!value) return "No history yet";
    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDate(value: string | null) {
    if (!value) return "No history yet";
    return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatCurrency(amount: number | null, currency = "INR") {
    if (amount === null || Number.isNaN(amount)) return "Price unavailable";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount);
}

function prettySource(source: string) {
    if (!source) return "Unknown";
    if (source === "resume-config") return "Resume Builder";
    return source
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function getSubscriptionStatusStyles(status: SubscriptionStatus) {
    if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "EXPIRED") return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "CANCELLED") return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
}

function getTrackingStyles(source: SubscriptionSource) {
    if (source === "snapshot") {
        return { label: "Captured", className: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    }
    if (source === "matched") {
        return { label: "Recovered", className: "bg-sky-50 text-sky-700 border-sky-200" };
    }
    return { label: "No Plan", className: "bg-slate-100 text-slate-600 border-slate-200" };
}

function SmallStatCard({
    label,
    value,
    sublabel,
    icon,
    tint,
}: {
    label: string;
    value: string;
    sublabel: string;
    icon: React.ReactNode;
    tint: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
                {icon}
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
        </div>
    );
}

function MetaLine({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
            <p className="mt-1 text-sm text-slate-700">{value}</p>
        </div>
    );
}

export default function MyResumesPage() {
    const [stats, setStats] = useState<ResumeStats>(EMPTY_STATS);
    const [ownedResumes, setOwnedResumes] = useState<OwnedResume[]>([]);
    const [history, setHistory] = useState<ResumeHistoryItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchMyResumes = useCallback(async (targetPage: number, targetSearch: string) => {
        setLoading(true);
        setError(null);

        try {
            const token = getStoredToken();
            const params = new URLSearchParams({
                page: String(targetPage),
                limit: "10",
            });

            if (targetSearch) {
                params.set("search", targetSearch);
            }

            const res = await fetch(`/api/v1/private/my-resumes?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json() as MyResumesResponse;
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to load resumes.");
            }

            setStats(data.data.stats);
            setOwnedResumes(data.data.ownedResumes);
            setHistory(data.data.history);
            setPagination(data.data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load resumes.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setPage(1);
            setSearchTerm(searchInput.trim());
        }, 300);

        return () => window.clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchMyResumes(page, searchTerm);
    }, [fetchMyResumes, page, searchTerm]);

    const handleRefresh = () => {
        fetchMyResumes(page, searchTerm);
    };

    const historyStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    const historyEnd = pagination.total === 0 ? 0 : Math.min(pagination.total, historyStart + history.length - 1);

    return (
        <div className="mx-auto w-full space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <FiDownload size={20} />
                        </span>
                        My Resumes
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 sm:pl-14">
                        Track every resume you own, the format you downloaded, and the subscription plan used for each download.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FiRefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <SmallStatCard
                    label="Owned Resumes"
                    value={String(stats.ownedResumes)}
                    sublabel={`${stats.uniqueFormats} format${stats.uniqueFormats === 1 ? "" : "s"} used`}
                    icon={<FiFileText size={18} className="text-indigo-600" />}
                    tint="bg-indigo-50 text-indigo-600"
                />
                <SmallStatCard
                    label="Download History"
                    value={String(stats.totalDownloads)}
                    sublabel={stats.latestDownloadAt ? `Last download ${formatDate(stats.latestDownloadAt)}` : "No downloads yet"}
                    icon={<FiClock size={18} className="text-sky-600" />}
                    tint="bg-sky-50 text-sky-600"
                />
                <SmallStatCard
                    label="Subscription Uses"
                    value={String(stats.subscriptionDownloads)}
                    sublabel={`${stats.freeDownloads} without linked plan`}
                    icon={<FiPackage size={18} className="text-emerald-600" />}
                    tint="bg-emerald-50 text-emerald-600"
                />
                <SmallStatCard
                    label="Resume Formats"
                    value={String(stats.uniqueFormats)}
                    sublabel="Tracked across your download history"
                    icon={<FiLayers size={18} className="text-violet-600" />}
                    tint="bg-violet-50 text-violet-600"
                />
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                            <FiFileText size={18} />
                        </span>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Owned Resumes</h2>
                            <p className="text-sm text-slate-500">
                                Unique resume files from your account, grouped by format and resume details.
                            </p>
                        </div>
                    </div>
                </div>

                {loading && ownedResumes.length === 0 ? (
                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="animate-pulse rounded-2xl border border-slate-200 p-4">
                                <div className="h-4 w-32 rounded bg-slate-200" />
                                <div className="mt-3 h-3 w-48 rounded bg-slate-100" />
                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <div className="h-12 rounded-xl bg-slate-100" />
                                    <div className="h-12 rounded-xl bg-slate-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : ownedResumes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <FiFileText size={22} />
                        </span>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">No resumes found</h3>
                        <p className="mt-2 max-w-md text-sm text-slate-500">
                            Once you download resume formats from the builder, they will appear here along with subscription details.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">
                        {ownedResumes.map((resume) => {
                            const tracking = getTrackingStyles(resume.subscription?.source ?? "none");

                            return (
                                <div key={resume.key} className="rounded-2xl border border-slate-200 p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-base font-semibold text-slate-900">
                                                {resume.resumeName || "Untitled Resume"}
                                            </p>
                                            <p className="mt-1 truncate text-sm text-slate-500">
                                                {resume.resumeTitle || "Resume title not provided"}
                                            </p>
                                        </div>

                                        <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                            {resume.templateName || resume.templateId}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3">
                                        <MetaLine label="Downloads" value={`${resume.downloads}`} />
                                        <MetaLine label="Last Download" value={formatDate(resume.lastDownloadedAt)} />
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tracking.className}`}>
                                            {tracking.label}
                                        </span>
                                        {resume.subscription?.status ? (
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getSubscriptionStatusStyles(resume.subscription.status)}`}>
                                                {resume.subscription.status}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        <MetaLine label="Subscription" value={resume.subscription?.planName || "No subscription linked"} />
                                        <MetaLine label="Project" value={resume.subscription?.projectName || "No project linked"} />
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="truncate text-xs text-slate-500">{resume.fileName}</p>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        {resume.hasResumeSnapshot ? (
                                            <Link
                                                href={`/dashboard/resume-config?resumeHistoryId=${resume.latestRecordId}`}
                                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                            >
                                                <FiDownload size={14} />
                                                Open Exact Format
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-slate-400">
                                                Exact format is available for new saved downloads.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <FiClock size={18} />
                            </span>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">My Resumes History</h2>
                                <p className="text-sm text-slate-500">
                                    Every downloaded resume with date, time, format, and subscription type.
                                </p>
                            </div>
                        </div>

                        <div className="relative w-full max-w-md">
                            <FiSearch size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search resume, format, plan, or project..."
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                            <FiPackage size={22} />
                        </span>
                        <h3 className="text-lg font-semibold text-slate-900">Unable to load resume history</h3>
                        <p className="max-w-md text-sm text-slate-500">{error}</p>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Try Again
                        </button>
                    </div>
                ) : loading && history.length === 0 ? (
                    <div className="space-y-3 p-5 sm:p-6">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="animate-pulse rounded-2xl border border-slate-200 p-4">
                                <div className="h-4 w-36 rounded bg-slate-200" />
                                <div className="mt-3 h-3 w-56 rounded bg-slate-100" />
                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="h-12 rounded-xl bg-slate-100" />
                                    <div className="h-12 rounded-xl bg-slate-100" />
                                    <div className="h-12 rounded-xl bg-slate-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <FiClock size={22} />
                        </span>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">No history matches this search</h3>
                        <p className="mt-2 max-w-md text-sm text-slate-500">
                            Try a different search term or download a resume from the resume builder to start building your history.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                        <th className="px-6 py-4">Resume</th>
                                        <th className="px-6 py-4">Format</th>
                                        <th className="px-6 py-4">Subscription Type</th>
                                        <th className="px-6 py-4">Project</th>
                                        <th className="px-6 py-4">Downloaded On</th>
                                        <th className="px-6 py-4">Tracking</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {history.map((item) => {
                                        const tracking = getTrackingStyles(item.subscription?.source ?? "none");

                                        return (
                                            <tr key={item._id} className="align-top">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-slate-900">{item.resumeName || "Untitled Resume"}</p>
                                                    <p className="mt-1 text-sm text-slate-500">{item.resumeTitle || "Resume title not provided"}</p>
                                                    <p className="mt-2 truncate text-xs text-slate-400">{item.fileName}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                                        {item.templateName || item.templateId}
                                                    </span>
                                                    <p className="mt-2 text-xs text-slate-500">{prettySource(item.source)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-slate-900">
                                                        {item.subscription?.planName || "No linked subscription"}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {item.subscription
                                                            ? formatCurrency(item.subscription.planPrice, item.subscription.currency)
                                                            : "Price unavailable"}
                                                    </p>
                                                    {item.subscription?.status ? (
                                                        <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSubscriptionStatusStyles(item.subscription.status)}`}>
                                                            {item.subscription.status}
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-slate-800">{item.subscription?.projectName || "No project linked"}</p>
                                                    {item.subscription?.maxUsage ? (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Usage {item.subscription.usageCount ?? 0} / {item.subscription.maxUsage}
                                                        </p>
                                                    ) : (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {item.subscription ? "Unlimited or unavailable usage info" : "No usage info"}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-2 text-sm text-slate-700">
                                                        <FiCalendar size={14} className="mt-0.5 text-slate-400" />
                                                        <div>
                                                            <p>{formatDateTime(item.createdAt)}</p>
                                                            <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-2">
                                                        <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${tracking.className}`}>
                                                            {tracking.label}
                                                        </span>
                                                        <p className="text-xs text-slate-500">Source: {prettySource(item.source)}</p>
                                                        {item.hasResumeSnapshot ? (
                                                            <Link
                                                                href={`/dashboard/resume-config?resumeHistoryId=${item._id}`}
                                                                className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                                            >
                                                                <FiDownload size={13} />
                                                                Open Exact Format
                                                            </Link>
                                                        ) : (
                                                            <p className="text-xs text-slate-400">
                                                                Exact format not saved for this older download.
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-3 p-5 lg:hidden sm:p-6">
                            {history.map((item) => {
                                const tracking = getTrackingStyles(item.subscription?.source ?? "none");

                                return (
                                    <article key={item._id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-900">{item.resumeName || "Untitled Resume"}</p>
                                                <p className="mt-1 truncate text-sm text-slate-500">{item.resumeTitle || "Resume title not provided"}</p>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                                {item.templateName || item.templateId}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2">
                                            <MetaLine label="Subscription Type" value={item.subscription?.planName || "No linked subscription"} />
                                            <MetaLine label="Project" value={item.subscription?.projectName || "No project linked"} />
                                            <MetaLine label="Downloaded On" value={formatDateTime(item.createdAt)} />
                                            <MetaLine label="Source" value={prettySource(item.source)} />
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tracking.className}`}>
                                                {tracking.label}
                                            </span>
                                            {item.subscription?.status ? (
                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSubscriptionStatusStyles(item.subscription.status)}`}>
                                                    {item.subscription.status}
                                                </span>
                                            ) : null}
                                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                <FiTag size={11} className="mr-1" />
                                                {formatCurrency(item.subscription?.planPrice ?? null, item.subscription?.currency || "INR")}
                                            </span>
                                        </div>

                                        <div className="mt-4">
                                            {item.hasResumeSnapshot ? (
                                                <Link
                                                    href={`/dashboard/resume-config?resumeHistoryId=${item._id}`}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                                >
                                                    <FiDownload size={14} />
                                                    Open Exact Format
                                                </Link>
                                            ) : (
                                                <p className="text-xs text-slate-400">
                                                    Exact format not saved for this older download.
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-slate-200 p-3">
                                                <div className="flex items-start gap-2">
                                                    <FiBriefcase size={14} className="mt-0.5 text-slate-400" />
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Usage</p>
                                                        <p className="mt-1 text-sm text-slate-700">
                                                            {item.subscription?.maxUsage
                                                                ? `${item.subscription.usageCount ?? 0} / ${item.subscription.maxUsage}`
                                                                : "Unlimited or unavailable"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 p-3">
                                                <div className="flex items-start gap-2">
                                                    <FiFileText size={14} className="mt-0.5 text-slate-400" />
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">File</p>
                                                        <p className="mt-1 break-all text-sm text-slate-700">{item.fileName}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <p className="text-sm text-slate-500">
                                Showing {historyStart}-{historyEnd} of {pagination.total} history row{pagination.total === 1 ? "" : "s"}
                            </p>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={pagination.page <= 1 || loading}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <FiChevronLeft size={15} />
                                    Prev
                                </button>

                                <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                                    Page {pagination.page} of {pagination.pages}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
                                    disabled={pagination.page >= pagination.pages || loading}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                    <FiChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
