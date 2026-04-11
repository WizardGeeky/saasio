"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    AreaChart, Area, BarChart, Bar, ComposedChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
    ChartContainer, ChartTooltip, ChartTooltipContent,
    ChartLegend, ChartLegendContent, type ChartConfig,
} from "@/components/ui/chart";
import { usePrivilege } from "@/app/utils/usePrivilege";
import { getStoredToken } from "@/app/utils/token";
import {
    FiUsers, FiShield, FiKey, FiFolder,
    FiCpu, FiMessageSquare, FiCreditCard, FiZap,
    FiPackage, FiDollarSign, FiAlertCircle, FiRefreshCw, FiTrendingUp,
    FiChevronLeft, FiChevronRight,
} from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "today" | "7d" | "30d" | "6m" | "all";

type CountPoint = {
    label: string;
    count: number;
};

type RevenuePoint = {
    label: string;
    transactions: number;
    subscriptions: number;
};

type TransactionPoint = {
    label: string;
    success: number;
    failed: number;
    pending: number;
};

type SubscriptionPoint = {
    label: string;
    count: number;
    revenue: number;
};

type AtsPoint = {
    label: string;
    count: number;
    avgScore: number;
};

type DashboardAnalyticsData = {
    global: {
        users: {
            total: number;
            active: number;
            inactive: number;
            suspended: number;
        };
        roles: number;
        privileges: number;
        projects: {
            total: number;
            active: number;
            inactive: number;
            suspended: number;
        };
        aiModels: {
            total: number;
            active: number;
        };
        complaints: {
            total: number;
            pending: number;
            inProgress: number;
            resolved: number;
            rejected: number;
        };
        transactions: {
            total: number;
            success: number;
            pending: number;
            failed: number;
            revenue: number;
        };
        subscriptions: {
            total: number;
            active: number;
            cancelled: number;
            expired: number;
            revenue: number;
        };
        atsRecords: {
            total: number;
            avgScore: number;
        };
        resumes: {
            available: number;
            unlimitedPlans: number;
            topTemplates: Array<{
                templateId: string;
                templateName: string;
                memberCount: number;
                downloadCount: number;
            }>;
            mostUsedTemplate: {
                templateId: string;
                templateName: string;
                memberCount: number;
                downloadCount: number;
            };
        };
    };
    periodStats: {
        users: number;
        transactions: {
            total: number;
            success: number;
            failed: number;
            pending: number;
            revenue: number;
        };
        subscriptions: {
            total: number;
            active: number;
            revenue: number;
        };
        atsRecords: {
            total: number;
            avgScore: number;
        };
        complaints: number;
    };
    series: {
        revenue: RevenuePoint[];
        transactions: TransactionPoint[];
        subscriptions: SubscriptionPoint[];
        users: CountPoint[];
        atsRecords: AtsPoint[];
        complaints: CountPoint[];
    };
};

const DEFAULT_MOST_USED_RESUME_TEMPLATE = {
    templateId: "classic",
    templateName: "Classic",
    memberCount: 0,
    downloadCount: 0,
};

const PERIODS: { label: string; value: Period }[] = [
    { label: "Today",    value: "today" },
    { label: "7 Days",   value: "7d"    },
    { label: "30 Days",  value: "30d"   },
    { label: "6 Months", value: "6m"    },
    { label: "All Time", value: "all"   },
];

// ─── Chart configs ────────────────────────────────────────────────────────────

const revenueConfig: ChartConfig = {
    transactions:  { label: "Payments",      color: "hsl(215, 90%, 55%)" },
    subscriptions: { label: "Subscriptions", color: "hsl(160, 70%, 45%)" },
};

const txConfig: ChartConfig = {
    success: { label: "Success", color: "hsl(142, 71%, 45%)" },
    failed:  { label: "Failed",  color: "hsl(0,   71%, 55%)" },
    pending: { label: "Pending", color: "hsl(38,  92%, 50%)" },
};

const subConfig: ChartConfig = {
    count:   { label: "Count",   color: "hsl(262, 70%, 60%)" },
    revenue: { label: "Revenue", color: "hsl(215, 90%, 55%)" },
};

const userConfig: ChartConfig = {
    count: { label: "New Users", color: "hsl(215, 90%, 55%)" },
};

const atsConfig: ChartConfig = {
    count:    { label: "ATS Scans", color: "hsl(262, 70%, 60%)" },
    avgScore: { label: "Avg Score", color: "hsl(38,  92%, 50%)" },
};

const compConfig: ChartConfig = {
    count: { label: "Complaints", color: "hsl(0, 71%, 55%)" },
};

const resumeUsageConfig: ChartConfig = {
    memberCount: { label: "Members", color: "hsl(173, 80%, 40%)" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
    blue:   "bg-blue-50   text-blue-600   border-blue-100",
    green:  "bg-green-50  text-green-600  border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    amber:  "bg-amber-50  text-amber-600  border-amber-100",
    red:    "bg-red-50    text-red-600    border-red-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    teal:   "bg-teal-50   text-teal-600   border-teal-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
};

function StatCard({
    icon: Icon, label, value, sub, color = "blue",
}: {
    icon: React.ElementType; label: string; value: string | number;
    sub?: string; color?: string;
}) {
    const cls = COLOR_MAP[color] ?? COLOR_MAP.blue;
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2.5 rounded-xl border mb-3 ${cls}`}>
                <Icon size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
            <div className="text-sm font-medium text-gray-500">{label}</div>
            {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
        </div>
    );
}

// ─── Chart Card ──────────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children, className = "" }: {
    title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
            <div className="mb-4">
                <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

const DONUT_PALETTE = [
    "hsl(142,71%,45%)",
    "hsl(0,71%,55%)",
    "hsl(38,92%,50%)",
    "hsl(215,90%,55%)",
    "hsl(262,70%,60%)",
];

function DonutChart({ title, subtitle, data }: {
    title: string;
    subtitle?: string;
    data: Array<{ name: string; value: number; color?: string }>;
}) {
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
        <ChartCard title={title} subtitle={subtitle}>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height={160} minWidth={0}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={46}
                            outerRadius={66}
                            paddingAngle={2}
                            dataKey="value"
                            strokeWidth={0}
                        >
                            {data.map((entry, i) => (
                                <Cell
                                    key={entry.name}
                                    fill={entry.color ?? DONUT_PALETTE[i % DONUT_PALETTE.length]}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
                {data.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                            <div
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: d.color ?? DONUT_PALETTE[i % DONUT_PALETTE.length] }}
                            />
                            <span className="text-gray-500">{d.name}</span>
                        </div>
                        <span className="font-medium text-gray-700">
                            {d.value.toLocaleString("en-IN")}
                            {total > 0 && (
                                <span className="text-gray-400 ml-1">
                                    ({Math.round((d.value / total) * 100)}%)
                                </span>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Skeleton className="xl:col-span-2 h-72" />
                <Skeleton className="h-72" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
        </div>
    );
}

// ─── Section Heading ─────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            {children}
        </h2>
    );
}

function getResumeChartPageSize(width: number) {
    if (width < 640) return 4;
    if (width < 1024) return 6;
    return 8;
}

function formatResumeTick(value: string) {
    return value.length > 12 ? `${value.slice(0, 11)}...` : value;
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { can, isLoading: privLoading } = usePrivilege();
    const router = useRouter();
    const [period, setPeriod]   = useState<Period>("7d");
    const [data,   setData]     = useState<DashboardAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);
    const [resumePage, setResumePage] = useState(0);
    const [resumeItemsPerPage, setResumeItemsPerPage] = useState(8);

    const canView = !privLoading && can("GET", "/api/v1/private/analytics");

    // Redirect non-admin users to their own analytics page
    useEffect(() => {
        if (!privLoading && !canView) {
            router.replace("/dashboard/my-analytics");
        }
    }, [privLoading, canView, router]);

    const fetchData = useCallback(async () => {
        if (!canView) return;
        setLoading(true);
        setError(null);
        try {
            const token = getStoredToken();
            const res  = await fetch(`/api/v1/private/analytics?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message ?? "Failed to fetch analytics");
            setData(json.data);
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "Failed to fetch analytics");
        } finally {
            setLoading(false);
        }
    }, [period, canView]);

    useEffect(() => {
        if (!privLoading) fetchData();
    }, [privLoading, fetchData]);

    useEffect(() => {
        const updateResumePageSize = () => {
            setResumeItemsPerPage(getResumeChartPageSize(window.innerWidth));
        };

        updateResumePageSize();
        window.addEventListener("resize", updateResumePageSize);

        return () => window.removeEventListener("resize", updateResumePageSize);
    }, []);

    const g = data?.global;
    const p = data?.periodStats;
    const s = data?.series;
    const periodLabel = PERIODS.find((x) => x.value === period)?.label ?? "7 Days";
    const availableResumeCount = g?.resumes?.available ?? 0;
    const unlimitedResumePlans = g?.resumes?.unlimitedPlans ?? 0;
    const availableResumeValue = unlimitedResumePlans > 0
        ? `${availableResumeCount.toLocaleString("en-IN")}+`
        : availableResumeCount.toLocaleString("en-IN");
    const availableResumeSub = unlimitedResumePlans > 0
        ? `${unlimitedResumePlans} unlimited active plan${unlimitedResumePlans === 1 ? "" : "s"}`
        : "Across active subscriptions";
    const resumeUsageChartData = (g?.resumes?.topTemplates ?? [DEFAULT_MOST_USED_RESUME_TEMPLATE])
        .map((template) => ({
            templateName: template.templateName,
            memberCount: template.memberCount,
        }))
        .sort((left, right) => right.memberCount - left.memberCount || left.templateName.localeCompare(right.templateName));
    const resumeUsagePageCount = Math.max(1, Math.ceil(resumeUsageChartData.length / resumeItemsPerPage));
    const safeResumePage = Math.min(resumePage, resumeUsagePageCount - 1);
    const resumePageStart = safeResumePage * resumeItemsPerPage;
    const resumePageEnd = Math.min(resumePageStart + resumeItemsPerPage, resumeUsageChartData.length);
    const visibleResumeUsageData = resumeUsageChartData.slice(resumePageStart, resumePageEnd);
    const resumeUsageChartMax = Math.max(1, ...visibleResumeUsageData.map((template) => template.memberCount));

    useEffect(() => {
        setResumePage((current) => Math.min(current, resumeUsagePageCount - 1));
    }, [resumeUsagePageCount]);

    // While redirecting, render nothing
    if (!privLoading && !canView) return null;

    return (
        <div className="mx-auto w-full space-y-8 pb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Platform-wide metrics and insights</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
                        {PERIODS.map(({ label, value }) => (
                            <button
                                key={value}
                                onClick={() => setPeriod(value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                    period === value
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* ── Loading ── */}
            {(privLoading || (loading && !data)) && <LoadingSkeleton />}

            {/* ── Error ── */}
            {error && !loading && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <FiAlertCircle size={16} className="shrink-0" />
                    {error}
                </div>
            )}

            {/* ── Content ── */}
            {g && p && s && (
                <>
                    {/* ═══ 1. Global Overview ═══ */}
                    <section>
                        <SectionHeading>All-Time Overview</SectionHeading>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                            <StatCard
                                icon={FiUsers} label="Total Users" color="blue"
                                value={g.users.total.toLocaleString("en-IN")}
                                sub={`${g.users.active} active · ${g.users.suspended} suspended`}
                            />
                            <StatCard
                                icon={FiDollarSign} label="Total Revenue" color="green"
                                value={`₹${(g.transactions.revenue + g.subscriptions.revenue).toLocaleString("en-IN")}`}
                                sub={`Payments + Subscriptions`}
                            />
                            <StatCard
                                icon={FiCreditCard} label="Transactions" color="indigo"
                                value={g.transactions.total.toLocaleString("en-IN")}
                                sub={`${g.transactions.success} success · ${g.transactions.failed} failed`}
                            />
                            <StatCard
                                icon={FiPackage} label="Subscriptions" color="purple"
                                value={g.subscriptions.total.toLocaleString("en-IN")}
                                sub={`${g.subscriptions.active} active`}
                            />
                            <StatCard
                                icon={FiZap} label="ATS Scans" color="amber"
                                value={g.atsRecords.total.toLocaleString("en-IN")}
                                sub={`Avg Score: ${g.atsRecords.avgScore}`}
                            />
                            <StatCard
                                icon={FiTrendingUp} label="Current Available Resumes" color="green"
                                value={availableResumeValue}
                                sub={availableResumeSub}
                            />
                            <StatCard
                                icon={FiFolder} label="Projects" color="teal"
                                value={g.projects.total.toLocaleString("en-IN")}
                                sub={`${g.projects.active} active`}
                            />
                            <StatCard
                                icon={FiCpu} label="AI Models" color="purple"
                                value={g.aiModels.total.toLocaleString("en-IN")}
                                sub={`${g.aiModels.active} active`}
                            />
                            <StatCard
                                icon={FiMessageSquare} label="Complaints" color="red"
                                value={g.complaints.total.toLocaleString("en-IN")}
                                sub={`${g.complaints.pending} pending · ${g.complaints.resolved} resolved`}
                            />
                            <StatCard
                                icon={FiShield} label="Roles" color="indigo"
                                value={g.roles.toLocaleString("en-IN")}
                            />
                            <StatCard
                                icon={FiKey} label="Privileges" color="orange"
                                value={g.privileges.toLocaleString("en-IN")}
                            />
                        </div>
                    </section>

                    {/* ═══ 2. Period Activity ═══ */}
                    <section>
                        <SectionHeading>{periodLabel} Activity</SectionHeading>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <StatCard
                                icon={FiUsers} label="New Users" color="blue"
                                value={p.users.toLocaleString("en-IN")}
                            />
                            <StatCard
                                icon={FiDollarSign} label="Payment Revenue" color="green"
                                value={`₹${p.transactions.revenue.toLocaleString("en-IN")}`}
                                sub={`${p.transactions.total} orders · ${p.transactions.success} success`}
                            />
                            <StatCard
                                icon={FiPackage} label="Sub Revenue" color="purple"
                                value={`₹${p.subscriptions.revenue.toLocaleString("en-IN")}`}
                                sub={`${p.subscriptions.total} subscriptions`}
                            />
                            <StatCard
                                icon={FiZap} label="ATS Scans" color="amber"
                                value={p.atsRecords.total.toLocaleString("en-IN")}
                                sub={`Avg Score: ${p.atsRecords.avgScore}`}
                            />
                            <StatCard
                                icon={FiMessageSquare} label="Complaints" color="red"
                                value={p.complaints.toLocaleString("en-IN")}
                            />
                        </div>
                    </section>

                    {/* ═══ 3. Revenue Charts ═══ */}
                    <section>
                        <SectionHeading>Resume Insights</SectionHeading>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/80">
                                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                                            Resume Usage by Format
                                        </h3>
                                        <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-400">
                                            Showing {resumePageStart + 1}-{resumePageEnd} of {resumeUsageChartData.length} resume formats
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                            Page {safeResumePage + 1} of {resumeUsagePageCount}
                                        </span>
                                        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-900">
                                            <button
                                                type="button"
                                                onClick={() => setResumePage((current) => Math.max(0, current - 1))}
                                                disabled={safeResumePage === 0}
                                                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                                aria-label="Previous resume formats page"
                                            >
                                                <FiChevronLeft size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResumePage((current) => Math.min(resumeUsagePageCount - 1, current + 1))}
                                                disabled={safeResumePage >= resumeUsagePageCount - 1}
                                                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                                aria-label="Next resume formats page"
                                            >
                                                <FiChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <ChartContainer config={resumeUsageConfig} className="h-[320px] w-full aspect-auto sm:h-[360px]">
                                    <BarChart
                                        data={visibleResumeUsageData}
                                        margin={{ top: 8, right: 8, left: -8, bottom: 24 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(148,163,184,0.24)"
                                            vertical
                                        />
                                        <XAxis
                                            dataKey="templateName"
                                            tick={{ fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={0}
                                            angle={-18}
                                            textAnchor="end"
                                            height={60}
                                            tickFormatter={formatResumeTick}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                            width={32}
                                            domain={[0, resumeUsageChartMax]}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={
                                                <ChartTooltipContent
                                                    labelFormatter={(value) => String(value)}
                                                />
                                            }
                                        />
                                        <Bar
                                            dataKey="memberCount"
                                            fill="var(--color-memberCount)"
                                            radius={[8, 8, 0, 0]}
                                            maxBarSize={56}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        </div>
                    </section>

                    <section>
                        <SectionHeading>Revenue &amp; Payments</SectionHeading>
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                            {/* Revenue Trend — area */}
                            <ChartCard
                                title="Revenue Trend"
                                subtitle={`Payments + Subscriptions (₹) — ${periodLabel}`}
                                className="xl:col-span-2"
                            >
                                <ChartContainer config={revenueConfig} className="h-56 w-full aspect-auto">
                                    <AreaChart data={s.revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gTx" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="hsl(215,90%,55%)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(215,90%,55%)" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gSub" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="hsl(160,70%,45%)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(160,70%,45%)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => `₹${v}`} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Area type="monotone" dataKey="transactions"  stroke="hsl(215,90%,55%)" fill="url(#gTx)"  strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="subscriptions" stroke="hsl(160,70%,45%)" fill="url(#gSub)" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ChartContainer>
                            </ChartCard>

                            {/* Transaction Status Donut */}
                            <DonutChart
                                title="Transaction Status"
                                subtitle="All-time breakdown"
                                data={[
                                    { name: "Success", value: g.transactions.success, color: "hsl(142,71%,45%)" },
                                    { name: "Pending", value: g.transactions.pending, color: "hsl(38,92%,50%)"  },
                                    { name: "Failed",  value: g.transactions.failed,  color: "hsl(0,71%,55%)"   },
                                ]}
                            />
                        </div>

                        {/* Transaction Volume — stacked bar */}
                        <div className="mt-4">
                            <ChartCard title="Transaction Volume" subtitle={`Success / Failed / Pending — ${periodLabel}`}>
                                <ChartContainer config={txConfig} className="h-52 w-full aspect-auto">
                                    <BarChart data={s.transactions} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar dataKey="success" stackId="tx" fill="hsl(142,71%,45%)" />
                                        <Bar dataKey="failed"  stackId="tx" fill="hsl(0,71%,55%)"   />
                                        <Bar dataKey="pending" stackId="tx" fill="hsl(38,92%,50%)"  radius={[4,4,0,0]} />
                                    </BarChart>
                                </ChartContainer>
                            </ChartCard>
                        </div>
                    </section>

                    {/* ═══ 4. Subscriptions ═══ */}
                    <section>
                        <SectionHeading>Subscriptions</SectionHeading>
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                            {/* Subscription count + revenue bar */}
                            <ChartCard title="Subscription Activity" subtitle={`Count &amp; Revenue — ${periodLabel}`} className="xl:col-span-2">
                                <ChartContainer config={subConfig} className="h-56 w-full aspect-auto">
                                    <BarChart data={s.subscriptions} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="left"  tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => `₹${v}`} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar yAxisId="left"  dataKey="count"   fill="hsl(262,70%,60%)" radius={[4,4,0,0]} />
                                        <Bar yAxisId="right" dataKey="revenue" fill="hsl(215,90%,55%)" radius={[4,4,0,0]} />
                                    </BarChart>
                                </ChartContainer>
                            </ChartCard>

                            {/* Subscription Status Donut */}
                            <DonutChart
                                title="Subscription Status"
                                subtitle="All-time breakdown"
                                data={[
                                    { name: "Active",    value: g.subscriptions.active,    color: "hsl(142,71%,45%)" },
                                    { name: "Cancelled", value: g.subscriptions.cancelled, color: "hsl(0,71%,55%)"   },
                                    { name: "Expired",   value: g.subscriptions.expired,   color: "hsl(38,92%,50%)"  },
                                ]}
                            />
                        </div>
                    </section>

                    {/* ═══ 5. Users, ATS & Complaints ═══ */}
                    <section>
                        <SectionHeading>Users, ATS &amp; Complaints</SectionHeading>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                            {/* User Growth — area */}
                            <ChartCard title="User Registrations" subtitle={`New sign-ups — ${periodLabel}`}>
                                <ChartContainer config={userConfig} className="h-52 w-full aspect-auto">
                                    <AreaChart data={s.users} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="hsl(215,90%,55%)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(215,90%,55%)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <Area type="monotone" dataKey="count" stroke="hsl(215,90%,55%)" fill="url(#gUsers)" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ChartContainer>
                            </ChartCard>

                            {/* ATS Usage — composed (bar + line) */}
                            <ChartCard title="ATS Usage" subtitle={`Scans &amp; Avg Score — ${periodLabel}`}>
                                <ChartContainer config={atsConfig} className="h-52 w-full aspect-auto">
                                    <ComposedChart data={s.atsRecords} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="left"  tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={36} domain={[0, 100]} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar  yAxisId="left"  dataKey="count"    fill="hsl(262,70%,60%)" radius={[4,4,0,0]} />
                                        <Line yAxisId="right" dataKey="avgScore" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={false} type="monotone" />
                                    </ComposedChart>
                                </ChartContainer>
                            </ChartCard>

                            {/* Complaints — bar */}
                            <ChartCard title="Complaints" subtitle={`Submitted over time — ${periodLabel}`}>
                                <ChartContainer config={compConfig} className="h-52 w-full aspect-auto">
                                    <BarChart data={s.complaints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <Bar dataKey="count" fill="hsl(0,71%,55%)" radius={[4,4,0,0]} />
                                    </BarChart>
                                </ChartContainer>
                            </ChartCard>
                        </div>
                    </section>

                    {/* ═══ 6. Status Breakdowns ═══ */}
                    <section>
                        <SectionHeading>Status Breakdowns</SectionHeading>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <DonutChart
                                title="Users by Status"
                                data={[
                                    { name: "Active",    value: g.users.active,    color: "hsl(142,71%,45%)" },
                                    { name: "Inactive",  value: g.users.inactive,  color: "hsl(38,92%,50%)"  },
                                    { name: "Suspended", value: g.users.suspended, color: "hsl(0,71%,55%)"   },
                                ]}
                            />
                            <DonutChart
                                title="Complaints by Status"
                                data={[
                                    { name: "Pending",     value: g.complaints.pending,    color: "hsl(38,92%,50%)"  },
                                    { name: "In Progress", value: g.complaints.inProgress,  color: "hsl(215,90%,55%)" },
                                    { name: "Resolved",    value: g.complaints.resolved,    color: "hsl(142,71%,45%)" },
                                    { name: "Rejected",    value: g.complaints.rejected,    color: "hsl(0,71%,55%)"   },
                                ]}
                            />
                            <DonutChart
                                title="Projects by Status"
                                data={[
                                    { name: "Active",    value: g.projects.active,    color: "hsl(142,71%,45%)" },
                                    { name: "Inactive",  value: g.projects.inactive,  color: "hsl(38,92%,50%)"  },
                                    { name: "Suspended", value: g.projects.suspended, color: "hsl(0,71%,55%)"   },
                                ]}
                            />
                            <DonutChart
                                title="AI Models"
                                data={[
                                    { name: "Active",   value: g.aiModels.active,                    color: "hsl(142,71%,45%)" },
                                    { name: "Inactive", value: g.aiModels.total - g.aiModels.active, color: "hsl(38,92%,50%)"  },
                                ]}
                            />
                        </div>
                    </section>

                    {/* ═══ 7. Revenue Summary Card ═══ */}
                    <section>
                        <SectionHeading>Revenue Summary</SectionHeading>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                            {/* Gradient total card */}
                            <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg sm:col-span-2">
                                <div className="flex items-center gap-2 mb-1 opacity-80">
                                    <FiDollarSign size={16} />
                                    <span className="text-sm font-medium">Total Platform Revenue</span>
                                </div>
                                <div className="text-4xl font-bold mb-4">
                                    ₹{(g.transactions.revenue + g.subscriptions.revenue).toLocaleString("en-IN")}
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-white/15 rounded-xl p-3">
                                        <div className="opacity-70 text-xs mb-1">Payments</div>
                                        <div className="font-semibold">₹{g.transactions.revenue.toLocaleString("en-IN")}</div>
                                        <div className="opacity-60 text-xs mt-0.5">{g.transactions.success} orders</div>
                                    </div>
                                    <div className="bg-white/15 rounded-xl p-3">
                                        <div className="opacity-70 text-xs mb-1">Subscriptions</div>
                                        <div className="font-semibold">₹{g.subscriptions.revenue.toLocaleString("en-IN")}</div>
                                        <div className="opacity-60 text-xs mt-0.5">{g.subscriptions.active} active</div>
                                    </div>
                                </div>
                            </div>

                            <StatCard icon={FiShield} label="Total Roles"      value={g.roles}      color="indigo" />
                            <StatCard icon={FiKey}    label="Total Privileges" value={g.privileges} color="orange" />
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
