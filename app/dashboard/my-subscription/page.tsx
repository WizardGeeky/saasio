"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    FiBookmark,
    FiRefreshCw,
    FiCheckCircle,
    FiClock,
    FiPackage,
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
    FiCheck,
    FiStar,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";
import CheckoutButton, { PaymentSuccessData } from "@/components/checkout-button";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubscriptionStatus = "ACTIVE" | "EXPIRED";

interface PaymentPlan {
    name: string;
    price: number;
    currency: string;
    descriptions: string[];
    maxUsage: number;
}

interface Project {
    _id: string;
    name: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    plans: PaymentPlan[];
    createdAt: string;
}

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
    usageCount: number;
    maxUsage: number;
    createdAt: string;
    updatedAt: string;
}

interface ActiveSubscription {
    _id: string;
    planName: string;
    projectName: string;
    status: "ACTIVE";
    usageCount: number;
    maxUsage: number;
    hasUsage: boolean;
    remaining: number | null;
}

interface Stats {
    active:    { count: number; totalAmount: number };
    expired:   { count: number; totalAmount: number };
}

interface Pagination {
    total: number;
    page:  number;
    pages: number;
    limit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (rupees: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(rupees);

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

const STATUS_CFG: Record<SubscriptionStatus, { label: string; bg: string; text: string; dot: string }> = {
    ACTIVE:    { label: "Active",    bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    EXPIRED:   { label: "Expired",   bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
};

const SUBSCRIPTION_STATUS_FILTERS: SubscriptionStatus[] = ["ACTIVE", "EXPIRED"];

const PLAN_STYLES = [
    { badge: "bg-slate-100 text-slate-600",   border: "border-slate-200 hover:border-slate-400", highlight: false },
    { badge: "bg-indigo-100 text-indigo-700", border: "border-indigo-300 hover:border-indigo-500 ring-1 ring-indigo-200", highlight: true },
    { badge: "bg-violet-100 text-violet-700", border: "border-violet-200 hover:border-violet-400", highlight: false },
];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, count, amount, icon, bg, text }: {
    label: string; count: number; amount: number;
    icon: React.ReactNode; bg: string; text: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-3">
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${bg}`}>
                <span className={text}>{icon}</span>
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-400">{fmt(amount)} total</p>
            </div>
        </div>
    );
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function Detail({ icon, label, value, mono = false }: {
    icon: React.ReactNode; label: string; value: string; mono?: boolean;
}) {
    return (
        <div className="flex items-start gap-2">
            <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className={`text-sm text-slate-700 break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
            </div>
        </div>
    );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600">
                {icon}
            </div>
            <div>
                <h2 className="text-base font-bold text-slate-800">{title}</h2>
                <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MySubscriptionPage() {
    const { success: toastSuccess, error: toastError } = useToast();

    // ── Projects state ────────────────────────────────────────────────────────
    const [projects, setProjects]       = useState<Project[]>([]);
    const [projLoading, setProjLoading] = useState(true);
    const [projError, setProjError]     = useState<string | null>(null);

    // ── Subscriptions state ───────────────────────────────────────────────────
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [stats, setStats]         = useState<Stats | null>(null);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1, limit: 10 });
    const [subLoading, setSubLoading] = useState(true);
    const [subError, setSubError]     = useState<string | null>(null);
    const [page, setPage]             = useState(1);
    const [statusFilter, setStatusFilter] = useState<SubscriptionStatus>("ACTIVE");
    const [expanded, setExpanded]     = useState<string | null>(null);
    const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);

    // ── Fetch projects ────────────────────────────────────────────────────────
    const fetchProjects = useCallback(async () => {
        setProjLoading(true);
        setProjError(null);
        try {
            const token = getStoredToken();
            const res = await fetch("/api/v1/private/projects", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to load projects");
            setProjects((data.projects as Project[]).filter((p) => p.status === "ACTIVE"));
        } catch (err: unknown) {
            setProjError(err instanceof Error ? err.message : "Failed to load projects");
        } finally {
            setProjLoading(false);
        }
    }, []);

    // ── Fetch user subscriptions ──────────────────────────────────────────────
    const fetchSubscriptions = useCallback(async () => {
        setSubLoading(true);
        setSubError(null);
        try {
            const token = getStoredToken();
            const params = new URLSearchParams({ page: String(page), limit: "10" });
            params.set("status", statusFilter);

            const res = await fetch(`/api/v1/private/subscriptions/my?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to load subscriptions");

            setSubscriptions(data.data.subscriptions);
            setPagination(data.data.pagination);
            setStats(data.data.stats);
        } catch (err: unknown) {
            setSubError(err instanceof Error ? err.message : "Failed to load subscriptions");
        } finally {
            setSubLoading(false);
        }
    }, [page, statusFilter]);

    const fetchActiveSubscription = useCallback(async () => {
        try {
            const token = getStoredToken();
            const res = await fetch("/api/v1/private/subscriptions/active", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setActiveSubscription(null);
                return;
            }

            setActiveSubscription((data.data as ActiveSubscription | null) ?? null);
        } catch {
            setActiveSubscription(null);
        }
    }, []);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);
    useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);
    useEffect(() => { fetchActiveSubscription(); }, [fetchActiveSubscription]);

    const showActiveSubscriptionAlert = useCallback(() => {
        const activePlanText = activeSubscription
            ? `${activeSubscription.projectName} - ${activeSubscription.planName}`
            : "your current plan";

        toastError(`You already have an active subscription (${activePlanText}). Please use or finish it before buying another plan.`);
    }, [activeSubscription, toastError]);

    // ── Payment success handler ───────────────────────────────────────────────
    const handlePaymentSuccess = useCallback(async (
        paymentData: PaymentSuccessData,
        project: Project,
        plan: PaymentPlan
    ) => {
        try {
            const token = getStoredToken();
            const res = await fetch("/api/v1/private/subscriptions", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId:         project._id,
                    projectName:       project.name,
                    planName:          plan.name,
                    planPrice:         plan.price,
                    currency:          plan.currency,
                    razorpayOrderId:   paymentData.orderId,
                    razorpayPaymentId: paymentData.paymentId,
                    maxUsage:          plan.maxUsage ?? 0,
                }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to create subscription");

            toastSuccess(`Subscribed to ${project.name} — ${plan.name} plan! A confirmation email has been sent.`);
            fetchSubscriptions();
            fetchActiveSubscription();
        } catch (err: unknown) {
            toastError(`Payment was successful but subscription record failed: ${err instanceof Error ? err.message : "Unexpected error"}`);
        }
    }, [toastSuccess, toastError, fetchSubscriptions, fetchActiveSubscription]);

    const handleStatusFilter = (val: SubscriptionStatus) => { setStatusFilter(val); setPage(1); };
    const isLoading = projLoading || subLoading;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="w-full mx-auto px-4 py-8">

            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
                        <FiBookmark size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Subscription</h1>
                        <p className="text-sm text-slate-500">Browse plans and manage your subscriptions</p>
                    </div>
                </div>
                <button
                    onClick={() => { fetchProjects(); fetchSubscriptions(); fetchActiveSubscription(); }}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-colors"
                >
                    <FiRefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SECTION 1 — Available Plans                                    */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div className="mb-12">
                <SectionHeader
                    icon={<FiPackage size={16} />}
                    title="Available Plans"
                    subtitle="Choose a project and subscribe to a plan"
                />

                {activeSubscription && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                        <FiAlertCircle size={18} className="mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold">You already have an active subscription.</p>
                            <p className="mt-0.5 text-xs text-amber-700">
                                Current plan: {activeSubscription.projectName} - {activeSubscription.planName}. New purchases are disabled until this active subscription is used or expires.
                            </p>
                        </div>
                    </div>
                )}

                {projLoading && (
                    <div className="flex items-center justify-center py-16 gap-3">
                        <div className="h-7 w-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                        <p className="text-sm text-slate-500">Loading plans…</p>
                    </div>
                )}

                {!projLoading && projError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <FiAlertCircle size={18} className="shrink-0" />
                        <p className="text-sm">{projError}</p>
                        <button onClick={fetchProjects} className="ml-auto text-sm font-medium underline">Retry</button>
                    </div>
                )}

                {!projLoading && !projError && projects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                        <FiPackage size={36} />
                        <p className="text-sm font-medium">No active projects available</p>
                    </div>
                )}

                {!projLoading && !projError && projects.map((project) => (
                    <div key={project._id} className="mb-10">
                        {/* Project label */}
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-base font-bold text-slate-800">{project.name}</h3>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                                ACTIVE
                            </span>
                        </div>

                        {/* Plans grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {project.plans.map((plan, idx) => {
                                const style = PLAN_STYLES[idx] ?? PLAN_STYLES[0];
                                const isFree = plan.price === 0;

                                return (
                                    <div
                                        key={plan.name}
                                        className={`relative flex flex-col bg-white rounded-2xl border-2 transition-all duration-200 ${style.border} ${style.highlight ? "shadow-lg" : "shadow-sm"}`}
                                    >
                                        {style.highlight && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                <span className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow">
                                                    <FiStar size={10} /> Most Popular
                                                </span>
                                            </div>
                                        )}

                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${style.badge}`}>
                                                    {plan.name}
                                                </span>
                                            </div>

                                            <div className="mb-5">
                                                {isFree ? (
                                                    <p className="text-3xl font-extrabold text-slate-900">Free</p>
                                                ) : (
                                                    <p className="text-3xl font-extrabold text-slate-900">
                                                        ₹{plan.price.toLocaleString("en-IN")}
                                                        <span className="text-sm font-medium text-slate-400 ml-1">/ plan</span>
                                                    </p>
                                                )}
                                            </div>

                                            {plan.descriptions.length > 0 && (
                                                <ul className="flex flex-col gap-2.5 mb-3 flex-1">
                                                    {plan.descriptions.map((desc, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                            <FiCheck size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                                                            {desc}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {/* Usage limit indicator */}
                                            <div className="mb-5">
                                                {(plan.maxUsage ?? 0) === 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                        <FiCheckCircle size={10} /> Unlimited usage
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                                        {plan.maxUsage} uses included
                                                    </span>
                                                )}
                                            </div>

                                            {isFree ? (
                                                <button
                                                    disabled
                                                    className="w-full py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                                                >
                                                    Free Plan
                                                </button>
                                            ) : activeSubscription ? (
                                                <button
                                                    type="button"
                                                    onClick={showActiveSubscriptionAlert}
                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 active:bg-amber-800"
                                                >
                                                    <FiAlertCircle size={15} />
                                                    Active subscription exists
                                                </button>
                                            ) : (
                                                <CheckoutButton
                                                    amount={plan.price}
                                                    currency={plan.currency}
                                                    description={`${project.name} — ${plan.name} Plan`}
                                                    productName={project.name}
                                                    notes={{ projectId: project._id, projectName: project.name, planName: plan.name }}
                                                    className="w-full justify-center py-2.5"
                                                    onSuccess={(data) => handlePaymentSuccess(data, project, plan)}
                                                    onError={(msg) => toastError(msg)}
                                                >
                                                    <FiCheckCircle size={15} />
                                                    Subscribe — ₹{plan.price.toLocaleString("en-IN")}
                                                </CheckoutButton>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* SECTION 2 — My Subscription History                           */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div className="border-t border-slate-200 pt-10">
                <SectionHeader
                    icon={<FiCreditCard size={16} />}
                    title="My Subscription History"
                    subtitle="All your past and current subscriptions"
                />

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        <StatCard label="Active"    count={stats.active.count}    amount={stats.active.totalAmount}    icon={<FiCheckCircle size={16} />} bg="bg-emerald-50" text="text-emerald-600" />
                        <StatCard label="Expired"   count={stats.expired.count}   amount={stats.expired.totalAmount}   icon={<FiClock size={16} />}       bg="bg-amber-50"   text="text-amber-600" />
                    </div>
                )}

                {/* Filter */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                    <FiFilter size={13} className="text-slate-400" />
                    <span className="text-xs text-slate-500 mr-1">Status:</span>
                    {SUBSCRIPTION_STATUS_FILTERS.map((s) => (
                        <button
                            key={s}
                            onClick={() => handleStatusFilter(s)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                statusFilter === s
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {STATUS_CFG[s].label}
                        </button>
                    ))}
                </div>

                {subLoading && (
                    <div className="flex items-center justify-center py-16 gap-3">
                        <div className="h-7 w-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                        <p className="text-sm text-slate-500">Loading history…</p>
                    </div>
                )}

                {!subLoading && subError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <FiAlertCircle size={18} className="shrink-0" />
                        <p className="text-sm">{subError}</p>
                        <button onClick={fetchSubscriptions} className="ml-auto text-sm font-medium underline">Retry</button>
                    </div>
                )}

                {!subLoading && !subError && subscriptions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                        <FiCreditCard size={36} />
                        <p className="text-sm font-medium">No subscriptions yet</p>
                        <p className="text-xs">Subscribe to a plan above to get started.</p>
                    </div>
                )}

                {!subLoading && !subError && subscriptions.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {subscriptions.map((sub) => {
                            const cfg = STATUS_CFG[sub.status];
                            const isOpen = expanded === sub._id;

                            return (
                                <div key={sub._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Summary row */}
                                    <button
                                        className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-3"
                                        onClick={() => setExpanded(isOpen ? null : sub._id)}
                                    >
                                        {/* Project + plan */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{sub.projectName}</p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-xs text-slate-500">{sub.planName} Plan</span>
                                                <span className="text-xs text-slate-300">·</span>
                                                <span className="text-xs text-slate-500">{fmtDate(sub.createdAt)}</span>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <span className="text-sm font-bold text-slate-900">
                                            {fmt(sub.planPrice, sub.currency)}
                                        </span>

                                        {/* Status */}
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${cfg.bg} ${cfg.text}`}>
                                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>

                                        {/* Chevron */}
                                        <FiChevronDown
                                            size={16}
                                            className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>

                                    {/* Expanded details */}
                                    {isOpen && (
                                        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <Detail icon={<FiMail size={13} />}       label="Email"       value={sub.userEmail} />
                                                <Detail icon={<FiTag size={13} />}        label="Project ID"  value={sub.projectId} mono />
                                                <Detail icon={<FiDollarSign size={13} />} label="Amount Paid" value={fmt(sub.planPrice, sub.currency)} />
                                                <Detail icon={<FiCalendar size={13} />}   label="Subscribed"  value={fmtDateTime(sub.createdAt)} />
                                                <Detail icon={<FiCreditCard size={13} />} label="Order ID"    value={sub.razorpayOrderId} mono />
                                                <Detail icon={<FiCreditCard size={13} />} label="Payment ID"  value={sub.razorpayPaymentId} mono />
                                            </div>

                                            {/* Usage progress bar — shown only for limited plans */}
                                            {(sub.maxUsage ?? 0) > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-semibold text-slate-600">Plan Usage</span>
                                                        <span className="text-xs font-mono text-slate-500">
                                                            {sub.usageCount ?? 0} / {sub.maxUsage} uses
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-2 rounded-full transition-all ${
                                                                (sub.usageCount ?? 0) >= sub.maxUsage
                                                                    ? "bg-red-500"
                                                                    : (sub.usageCount ?? 0) >= sub.maxUsage * 0.8
                                                                    ? "bg-amber-500"
                                                                    : "bg-indigo-500"
                                                            }`}
                                                            style={{ width: `${Math.min(100, ((sub.usageCount ?? 0) / sub.maxUsage) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1.5">
                                                        {Math.max(0, sub.maxUsage - (sub.usageCount ?? 0))} use{Math.max(0, sub.maxUsage - (sub.usageCount ?? 0)) === 1 ? "" : "s"} remaining
                                                    </p>
                                                </div>
                                            )}
                                            {(sub.maxUsage ?? 0) === 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                                        <FiCheckCircle size={11} /> Unlimited usage
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && !subLoading && (
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-slate-500">
                            Showing {(pagination.page - 1) * pagination.limit + 1}–
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || subLoading}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <FiChevronLeft size={14} /> Prev
                            </button>
                            <span className="text-sm font-medium text-slate-700">
                                {pagination.page} / {pagination.pages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages || subLoading}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next <FiChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
