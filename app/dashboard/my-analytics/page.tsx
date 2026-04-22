"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    BarChart, Bar, ComposedChart, Line,
    AreaChart, Area,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
    ChartContainer, ChartTooltip, ChartTooltipContent,
    ChartLegend, ChartLegendContent, type ChartConfig,
} from "@/components/ui/chart";
import { getStoredToken } from "@/app/utils/token";
import {
    FiZap, FiPackage, FiMessageSquare, FiRefreshCw,
    FiAlertCircle, FiUser, FiCalendar, FiShield,
    FiTarget, FiCheckCircle, FiGrid, FiAward, FiCheckSquare,
} from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "today" | "7d" | "30d" | "6m" | "all";

type RecentResume = {
    _id: string;
    templateId: string;
    templateName: string;
    fileName: string;
    resumeName: string;
    resumeTitle: string;
    source: string;
    createdAt: string;
};

type AnalyticsData = {
    global: {
        profile: {
            name: string;
            email: string;
            role: string;
            status: string;
            memberSince: string | null;
        };
        ats: {
            total: number;
            avgScore: number;
        };
        sectionScores: {
            skills: number;
            experience: number;
            projects: number;
            education: number;
        };
        topJobRoles: Array<{ role: string; count: number }>;
        subscriptions: {
            total: number;
            active: number;
            cancelled: number;
            expired: number;
        };
        resumes: {
            total: number;
            available: number | null;
            hasUnlimited: boolean;
            activePlans: number;
            mostUsedTemplate: {
                templateId: string;
                templateName: string;
                count: number;
            } | null;
        };
        complaints: {
            total: number;
            pending: number;
            inProgress: number;
            resolved: number;
            rejected: number;
        };
        cvs: {
            total: number;
        };
        quizzes: {
            total: number;
            avgScore: number;
            best: number;
        };
    };
    periodStats: {
        ats: {
            total: number;
            avgScore: number;
        };
        subscriptions: number;
        resumes: number;
        complaints: number;
        cvs: number;
        quizzes: number;
    };
    series: {
        ats:     Array<{ label: string; count: number; avgScore: number }>;
        cvs:     Array<{ label: string; count: number }>;
        quizzes: Array<{ label: string; count: number }>;
    };
    recentResumes: RecentResume[];
};

const PERIODS: { label: string; value: Period }[] = [
    { label: "Today",    value: "today" },
    { label: "7 Days",   value: "7d"    },
    { label: "30 Days",  value: "30d"   },
    { label: "6 Months", value: "6m"    },
    { label: "All Time", value: "all"   },
];

// ─── Chart configs ────────────────────────────────────────────────────────────

const atsConfig: ChartConfig = {
    count:    { label: "ATS Scans", color: "hsl(262, 70%, 60%)" },
    avgScore: { label: "Avg Score", color: "hsl(38,  92%, 50%)" },
};

const sectionConfig: ChartConfig = {
    score: { label: "Score", color: "hsl(215, 90%, 55%)" },
};

const cvConfig: ChartConfig = {
    count: { label: "CVs Generated", color: "hsl(262, 70%, 60%)" },
};

const quizConfig: ChartConfig = {
    count: { label: "Quiz Participations", color: "hsl(32, 95%, 55%)" },
};

// ─── Colour palette ───────────────────────────────────────────────────────────

const DONUT_PALETTE = [
    "hsl(142,71%,45%)",
    "hsl(0,71%,55%)",
    "hsl(38,92%,50%)",
    "hsl(215,90%,55%)",
    "hsl(262,70%,60%)",
];

const COLOR_MAP: Record<string, string> = {
    blue:   "bg-blue-50   text-blue-600   border-blue-100",
    green:  "bg-green-50  text-green-600  border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    amber:  "bg-amber-50  text-amber-600  border-amber-100",
    red:    "bg-red-50    text-red-600    border-red-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    teal:   "bg-teal-50   text-teal-600   border-teal-100",
};

// ─── Reusable components ──────────────────────────────────────────────────────

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

function DonutChart({ title, subtitle, data }: {
    title: string; subtitle?: string;
    data: Array<{ name: string; value: number; color?: string }>;
}) {
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
        <ChartCard title={title} subtitle={subtitle}>
            <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height={144} minWidth={0}>
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={58}
                            paddingAngle={2} dataKey="value" strokeWidth={0}>
                            {data.map((entry, i) => (
                                <Cell key={entry.name} fill={entry.color ?? DONUT_PALETTE[i % DONUT_PALETTE.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
                {data.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: d.color ?? DONUT_PALETTE[i % DONUT_PALETTE.length] }} />
                            <span className="text-gray-500">{d.name}</span>
                        </div>
                        <span className="font-medium text-gray-700">
                            {d.value}
                            {total > 0 && (
                                <span className="text-gray-400 ml-1">({Math.round((d.value / total) * 100)}%)</span>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-28 rounded-2xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Skeleton className="xl:col-span-2 h-64" />
                <Skeleton className="h-64" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
            </div>
        </div>
    );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            {children}
        </h2>
    );
}

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 75 ? "text-green-600 bg-green-50 border-green-200"
        : score >= 50         ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-red-600 bg-red-50 border-red-200";
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold border ${color}`}>
            {score}
        </span>
    );
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Failed to fetch analytics";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyAnalyticsPage() {
    const [period, setPeriod]   = useState<Period>("7d");
    const [data,   setData]     = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getStoredToken();
            const res   = await fetch(`/api/v1/private/my-analytics?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message ?? "Failed to fetch analytics");
            setData(json.data as AnalyticsData);
        } catch (error: unknown) {
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const g           = data?.global;
    const p           = data?.periodStats;
    const s           = data?.series;
    const periodLabel = PERIODS.find((x) => x.value === period)?.label ?? "7 Days";

    const sectionData = g ? [
        { section: "Skills",     score: g.sectionScores.skills     },
        { section: "Experience", score: g.sectionScores.experience },
        { section: "Projects",   score: g.sectionScores.projects   },
        { section: "Education",  score: g.sectionScores.education  },
    ] : [];

    const memberSince = g?.profile?.memberSince
        ? new Date(g.profile.memberSince).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
        : "—";
    return (
        <div className="mx-auto w-full space-y-8 pb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Your personal feature usage &amp; activity</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
                        {PERIODS.map(({ label, value }) => (
                            <button key={value} onClick={() => setPeriod(value)}
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
                    <button onClick={fetchData} disabled={loading}
                        className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* ── Loading ── */}
            {loading && !data && <LoadingSkeleton />}

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
                    {/* ═══ 1. Profile Card ═══ */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="shrink-0 h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <FiUser size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-lg font-bold text-gray-900 truncate">{g.profile.name}</div>
                            <div className="text-sm text-gray-500 truncate">{g.profile.email}</div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs sm:text-right">
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <FiShield size={13} className="text-indigo-400" />
                                <span className="font-medium text-gray-700">{g.profile.role}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <FiCalendar size={13} className="text-indigo-400" />
                                Member since <span className="font-medium text-gray-700 ml-1">{memberSince}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                    g.profile.status === "ACTIVE"
                                        ? "bg-green-50 text-green-600 border-green-200"
                                        : "bg-gray-100 text-gray-500 border-gray-200"
                                }`}>
                                    {g.profile.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ═══ 2. At-a-Glance Stat Cards ═══ */}
                    <section>
                        <SectionHeading>All-Time Usage</SectionHeading>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard icon={FiZap}         label="Total ATS Scans"   color="purple"
                                value={g.ats.total}
                                sub={`Avg score: ${g.ats.avgScore}`}
                            />
                            <StatCard icon={FiTarget}      label="Avg ATS Score"     color="amber"
                                value={g.ats.avgScore}
                                sub="Out of 100"
                            />
                            <StatCard icon={FiPackage}     label="Subscriptions"     color="indigo"
                                value={g.subscriptions.total}
                                sub={`${g.subscriptions.active} active`}
                            />
                            <StatCard icon={FiMessageSquare} label="Complaints Filed" color="red"
                                value={g.complaints.total}
                                sub={`${g.complaints.resolved} resolved`}
                            />
                        </div>
                    </section>

                    {/* ═══ 3. Period Activity ═══ */}
                    <section>
                        <SectionHeading>{periodLabel} Activity</SectionHeading>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <StatCard icon={FiZap}           label="ATS Scans"      color="purple"
                                value={p.ats.total}
                                sub={p.ats.total > 0 ? `Avg score: ${p.ats.avgScore}` : "No scans yet"}
                            />
                            <StatCard icon={FiPackage}       label="New Subscriptions" color="indigo"
                                value={p.subscriptions}
                            />
                            <StatCard icon={FiMessageSquare} label="Complaints"     color="red"
                                value={p.complaints}
                            />
                        </div>
                    </section>


                    {/* ═══ 4. CV Analytics ═══ */}
                    <section>
                        <SectionHeading>CV Generation</SectionHeading>
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                            <div className="grid grid-cols-2 xl:grid-cols-1 gap-4 xl:col-span-1">
                                <StatCard
                                    icon={FiGrid}
                                    label="Total CVs Generated"
                                    color="purple"
                                    value={g.cvs.total}
                                    sub="All-time AI-generated CVs"
                                />
                                <StatCard
                                    icon={FiZap}
                                    label={`CVs (${periodLabel})`}
                                    color="indigo"
                                    value={p.cvs}
                                    sub={p.cvs > 0 ? "CVs in this period" : "None in this period"}
                                />
                            </div>
                            <ChartCard
                                title="CV Generation Trend"
                                subtitle={`AI-generated CVs over ${periodLabel}`}
                                className="xl:col-span-2"
                            >
                                {s.cvs.every((d) => d.count === 0) ? (
                                    <p className="text-sm text-gray-400 text-center py-10">No CVs generated yet.</p>
                                ) : (
                                    <ChartContainer config={cvConfig} className="h-44 w-full aspect-auto">
                                        <AreaChart data={s.cvs} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gCvsUser" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="hsl(262,70%,60%)" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="hsl(262,70%,60%)" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="hsl(262,70%,60%)"
                                                fill="url(#gCvsUser)"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                )}
                            </ChartCard>
                        </div>
                    </section>

                    {/* ═══ Quiz Participation ═══ */}
                    <section>
                        <SectionHeading>Quiz Participation</SectionHeading>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <StatCard
                                icon={FiCheckSquare}
                                label="Total Participations"
                                value={g.quizzes?.total ?? 0}
                                sub="All quizzes taken"
                            />
                            <StatCard
                                icon={FiAward}
                                label="Avg Score"
                                value={`${g.quizzes?.avgScore ?? 0}%`}
                                sub="Average across all quizzes"
                                color="purple"
                            />
                            <StatCard
                                icon={FiTarget}
                                label="Best Score"
                                value={`${g.quizzes?.best ?? 0}%`}
                                sub="Highest quiz score"
                                color="green"
                            />
                        </div>
                        <ChartCard title="Quiz Participation Trend" subtitle={`Participations — ${periodLabel}`}>
                            {(s.quizzes ?? []).every((d) => d.count === 0) ? (
                                <p className="text-sm text-gray-400 text-center py-8">No quiz participations in this period.</p>
                            ) : (
                                <ChartContainer config={quizConfig} className="h-44 w-full aspect-auto">
                                    <AreaChart data={s.quizzes ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gQuizUser" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="hsl(32,95%,55%)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(32,95%,55%)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Area type="monotone" dataKey="count" stroke="hsl(32,95%,55%)" fill="url(#gQuizUser)" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ChartContainer>
                            )}
                        </ChartCard>
                    </section>

                    {/* ═══ 5. ATS Trend ═══ */}
                    <section>
                        <SectionHeading>ATS Usage Trend</SectionHeading>
                        <ChartCard title="ATS Scan Activity" subtitle={`Scans &amp; avg score over ${periodLabel}`}>
                            <ChartContainer config={atsConfig} className="h-56 w-full aspect-auto">
                                <ComposedChart data={s.ats} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left"  tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} domain={[0, 100]} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar  yAxisId="left"  dataKey="count"    fill="hsl(262,70%,60%)" radius={[4,4,0,0]} />
                                    <Line yAxisId="right" dataKey="avgScore" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={false} type="monotone" />
                                </ComposedChart>
                            </ChartContainer>
                        </ChartCard>
                    </section>

                    {/* ═══ 6. ATS Deep-dive ═══ */}
                    <section>
                        <SectionHeading>ATS Score Breakdown</SectionHeading>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                            {/* Section scores — horizontal bar */}
                            <ChartCard title="Avg Section Scores" subtitle="All-time average per section" className="lg:col-span-2">
                                {sectionData.every((d) => d.score === 0) ? (
                                    <p className="text-sm text-gray-400 text-center py-10">No ATS scans yet.</p>
                                ) : (
                                    <>
                                        <ChartContainer config={sectionConfig} className="h-44 w-full aspect-auto">
                                            <BarChart data={sectionData} layout="vertical"
                                                margin={{ top: 4, right: 32, left: 8, bottom: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                                <YAxis type="category" dataKey="section" width={72} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="score" fill="hsl(215,90%,55%)" radius={[0,4,4,0]} />
                                            </BarChart>
                                        </ChartContainer>
                                        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                                            {sectionData.map((d) => (
                                                <div key={d.section}>
                                                    <div className="text-xs text-gray-400 mb-1">{d.section}</div>
                                                    <ScoreBadge score={d.score} />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </ChartCard>

                            {/* Top job roles */}
                            <ChartCard title="Top Job Roles Analyzed" subtitle="Most frequently scanned">
                                {g.topJobRoles.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-10">No ATS scans yet.</p>
                                ) : (
                                    <div className="space-y-3 mt-1">
                                        {(g.topJobRoles as { role: string; count: number }[]).map((item, i) => {
                                            const max  = g.topJobRoles[0]?.count ?? 1;
                                            const pct  = Math.round((item.count / max) * 100);
                                            return (
                                                <div key={item.role}>
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-gray-600 truncate max-w-[70%]" title={item.role}>
                                                            {item.role || "Unknown"}
                                                        </span>
                                                        <span className="font-semibold text-gray-800">{item.count}</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-gray-100">
                                                        <div
                                                            className="h-1.5 rounded-full"
                                                            style={{
                                                                width: `${pct}%`,
                                                                backgroundColor: DONUT_PALETTE[i % DONUT_PALETTE.length],
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ChartCard>
                        </div>
                    </section>

                    {/* ═══ 7. Subscriptions & Complaints breakdowns ═══ */}
                    <section>
                        <SectionHeading>Subscriptions &amp; Complaints</SectionHeading>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <DonutChart
                                title="Subscription Status"
                                subtitle="All-time breakdown (count only)"
                                data={[
                                    { name: "Active",    value: g.subscriptions.active,    color: "hsl(142,71%,45%)" },
                                    { name: "Cancelled", value: g.subscriptions.cancelled, color: "hsl(0,71%,55%)"   },
                                    { name: "Expired",   value: g.subscriptions.expired,   color: "hsl(38,92%,50%)"  },
                                ]}
                            />

                            <DonutChart
                                title="Complaint Status"
                                subtitle="All-time breakdown"
                                data={[
                                    { name: "Pending",     value: g.complaints.pending,    color: "hsl(38,92%,50%)"  },
                                    { name: "In Progress", value: g.complaints.inProgress,  color: "hsl(215,90%,55%)" },
                                    { name: "Resolved",    value: g.complaints.resolved,    color: "hsl(142,71%,45%)" },
                                    { name: "Rejected",    value: g.complaints.rejected,    color: "hsl(0,71%,55%)"   },
                                ]}
                            />
                        </div>
                    </section>

                    {/* ═══ 8. Overall Score Summary ═══ */}
                    {g.ats.total > 0 && (
                        <section>
                            <SectionHeading>Score Summary</SectionHeading>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-center">
                                    <div className="sm:col-span-1">
                                        <p className="text-xs text-gray-400 mb-2">Overall Avg</p>
                                        <div className="text-4xl font-bold text-gray-900">{g.ats.avgScore}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">/ 100</div>
                                    </div>
                                    {sectionData.map((d) => (
                                        <div key={d.section}>
                                            <p className="text-xs text-gray-400 mb-2">{d.section}</p>
                                            <ScoreBadge score={d.score} />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                                    <FiCheckCircle size={13} className="text-green-400" />
                                    Based on {g.ats.total} total ATS scan{g.ats.total !== 1 ? "s" : ""}
                                </div>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
