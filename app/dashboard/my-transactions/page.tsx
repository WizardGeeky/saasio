"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    FiCreditCard, FiRefreshCw, FiSearch, FiDownload, FiEye,
    FiCheckCircle, FiClock, FiXCircle, FiTrendingUp,
    FiChevronLeft, FiChevronRight, FiCopy, FiCheck,
    FiX, FiPrinter, FiFilter, FiSmartphone, FiWifi,
    FiDollarSign,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus = "SUCCESS" | "PENDING" | "FAILED";

interface Transaction {
    _id: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    userId: string;
    userEmail: string;
    userName: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paymentMethod?: string;
    paymentChannel?: string;
    description?: string;
    notes?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

interface Stats {
    success: { count: number; totalAmount: number };
    pending: { count: number; totalAmount: number };
    failed:  { count: number; totalAmount: number };
    total:   { count: number; totalAmount: number };
}

interface Pagination {
    total: number;
    page:  number;
    pages: number;
    limit: number;
}

interface RazorpayDetail {
    id: string;
    status: string;
    method: string;
    bank?: string;
    wallet?: string;
    vpa?: string;
    email: string;
    contact: string;
    description?: string;
    created_at: number;
    captured: boolean;
    card?: { name: string; network: string; issuer?: string; last4: string; type: string };
    acquirer_data?: Record<string, string>;
    error_code?: string;
    error_description?: string;
}

interface ReceiptData {
    order: Transaction;
    razorpay: RazorpayDetail | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (paise: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(paise / 100);

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const STATUS_CFG: Record<PaymentStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    SUCCESS: { label: "Success", bg: "bg-emerald-50", text: "text-emerald-700", icon: <FiCheckCircle size={11} /> },
    PENDING: { label: "Pending", bg: "bg-amber-50",   text: "text-amber-700",   icon: <FiClock size={11} /> },
    FAILED:  { label: "Failed",  bg: "bg-red-50",     text: "text-red-700",     icon: <FiXCircle size={11} /> },
};

const METHOD_CFG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    card:         { label: "Card",    bg: "bg-violet-50",  text: "text-violet-700", icon: <FiCreditCard size={10} /> },
    upi:          { label: "UPI",     bg: "bg-cyan-50",    text: "text-cyan-700",   icon: <FiWifi size={10} /> },
    netbanking:   { label: "Net Banking", bg: "bg-blue-50", text: "text-blue-700",  icon: <FiDollarSign size={10} /> },
    wallet:       { label: "Wallet",  bg: "bg-orange-50",  text: "text-orange-700", icon: <FiSmartphone size={10} /> },
};

function getMethodCfg(method?: string) {
    if (!method) return null;
    return METHOD_CFG[method.toLowerCase()] ?? { label: method, bg: "bg-gray-100", text: "text-gray-600", icon: <FiCreditCard size={10} /> };
}

// ─── Copy Cell ────────────────────────────────────────────────────────────────

function CopyCell({ value }: { value?: string }) {
    const [copied, setCopied] = useState(false);
    if (!value) return <span className="text-gray-300 text-xs">—</span>;
    const short = value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
    const copy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };
    return (
        <span className="inline-flex items-center gap-1 group/cell">
            <span className="font-mono text-xs text-gray-600">{short}</span>
            <button onClick={copy} className="opacity-0 group-hover/cell:opacity-100 transition-opacity p-0.5 rounded text-gray-400 hover:text-gray-600">
                {copied ? <FiCheck size={11} className="text-emerald-500" /> : <FiCopy size={11} />}
            </button>
        </span>
    );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
    const s = STATUS_CFG[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            {s.icon} {s.label}
        </span>
    );
}

function MethodBadge({ method }: { method?: string }) {
    const cfg = getMethodCfg(method);
    if (!cfg) return <span className="text-gray-300 text-xs">—</span>;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

// ─── Payment Method Mini-cards ────────────────────────────────────────────────

function PaymentMethodCards({ transactions }: { transactions: Transaction[] }) {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
        const key = t.paymentMethod ? t.paymentMethod.toLowerCase() : "unknown";
        counts[key] = (counts[key] ?? 0) + 1;
    });

    const cards = [
        { key: "card",       label: "Card",        icon: <FiCreditCard size={16} />, color: "from-violet-500 to-purple-600" },
        { key: "upi",        label: "UPI",         icon: <FiWifi size={16} />,       color: "from-cyan-500 to-blue-500" },
        { key: "netbanking", label: "Net Banking",  icon: <FiDollarSign size={16} />, color: "from-blue-500 to-indigo-600" },
        { key: "wallet",     label: "Wallet",      icon: <FiSmartphone size={16} />, color: "from-orange-400 to-red-500" },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cards.map(c => (
                <div key={c.key} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-4 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-5`} />
                    <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${c.color} text-white mb-2`}>
                        {c.icon}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{counts[c.key] ?? 0}</p>
                    <p className="text-xs text-gray-400 mt-0.5">payments</p>
                </div>
            ))}
        </div>
    );
}

// ─── Receipt Modal ────────────────────────────────────────────────────────────

function ReceiptModal({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
    const { order, razorpay } = data;
    const s = STATUS_CFG[order.status];
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML ?? "";
        const win = window.open("", "_blank", "width=700,height=900");
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html><html><head>
            <title>Receipt – ${order.razorpayPaymentId ?? order.razorpayOrderId}</title>
            <meta charset="utf-8"/>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1e293b; background: #fff; padding: 32px; }
                .receipt { max-width: 560px; margin: 0 auto; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
                .brand { font-size: 22px; font-weight: 800; color: #0f172a; }
                .brand span { color: #10b981; }
                .amount-block { text-align: center; padding: 20px; background: #f8fafc; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
                .amount-block .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
                .amount-block .value { font-size: 32px; font-weight: 800; color: #0f172a; }
                .section { margin-bottom: 20px; }
                .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
                .row { display: flex; justify-content: space-between; padding: 5px 0; }
                .row .key { color: #64748b; font-size: 12px; }
                .row .val { font-size: 12px; font-weight: 600; color: #1e293b; text-align: right; max-width: 60%; word-break: break-all; }
                .footer { margin-top: 28px; padding-top: 16px; border-top: 1px dashed #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
            </style>
            </head><body>${content}</body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    const rpMethod = razorpay?.method
        ? razorpay.method.charAt(0).toUpperCase() + razorpay.method.slice(1)
        : order.paymentMethod
            ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)
            : "—";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92dvh]">
                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <div className="p-1.5 bg-violet-50 rounded-lg"><FiEye size={14} className="text-violet-600" /></div>
                        Payment Receipt
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-all">
                            <FiPrinter size={13} /> Print / Download
                        </button>
                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                            <FiX size={17} />
                        </button>
                    </div>
                </div>

                {/* Receipt content */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                    <div ref={printRef} className="receipt">
                        <div className="header flex justify-between items-start border-b-2 border-slate-100 pb-5 mb-5">
                            <div>
                                <div className="brand text-2xl font-extrabold text-slate-900 tracking-tight">
                                    SAAS<span className="text-emerald-500">IO</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">My Payment Receipt</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Receipt No.</p>
                                <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                                    {order.razorpayOrderId.slice(-12).toUpperCase()}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">{fmtDateTime(order.updatedAt)}</p>
                            </div>
                        </div>

                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 ${s.bg} ${s.text}`}>
                            {s.icon} {s.label}
                        </div>

                        {/* Payment method channel highlight */}
                        {(order.paymentMethod || razorpay?.method) && (
                            <div className="flex items-center gap-2 mb-5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="p-1.5 bg-violet-100 rounded-lg"><FiCreditCard size={14} className="text-violet-600" /></div>
                                <div>
                                    <p className="text-xs text-slate-400">Payment Method</p>
                                    <p className="text-sm font-semibold text-slate-800">{rpMethod}
                                        {razorpay?.card && ` • ${razorpay.card.network} ···· ${razorpay.card.last4}`}
                                        {razorpay?.vpa && ` • ${razorpay.vpa}`}
                                        {razorpay?.bank && ` • ${razorpay.bank}`}
                                        {razorpay?.wallet && ` • ${razorpay.wallet}`}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="amount-block text-center bg-slate-50 rounded-xl p-5 mb-6 border border-slate-100">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Amount Paid</p>
                            <p className="text-4xl font-extrabold text-slate-900">{fmt(order.amount, order.currency)}</p>
                            {order.description && <p className="text-xs text-slate-400 mt-2">{order.description}</p>}
                        </div>

                        <div className="section mb-5">
                            <p className="section-title text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Payment Details</p>
                            <div className="space-y-2">
                                {[
                                    { k: "Payment ID",  v: order.razorpayPaymentId ?? "—" },
                                    { k: "Order ID",    v: order.razorpayOrderId },
                                    { k: "Method",      v: rpMethod },
                                    ...(razorpay?.card ? [
                                        { k: "Card",      v: `${razorpay.card.network} •••• ${razorpay.card.last4}` },
                                        { k: "Card Type", v: razorpay.card.type },
                                    ] : []),
                                    ...(razorpay?.bank   ? [{ k: "Bank",   v: razorpay.bank }]   : []),
                                    ...(razorpay?.wallet ? [{ k: "Wallet", v: razorpay.wallet }]  : []),
                                    ...(razorpay?.vpa    ? [{ k: "UPI ID", v: razorpay.vpa }]     : []),
                                    { k: "Currency", v: order.currency },
                                    { k: "Status",   v: order.status },
                                ].map(({ k, v }) => (
                                    <div key={k} className="row flex justify-between text-sm">
                                        <span className="text-slate-500">{k}</span>
                                        <span className="font-medium text-slate-800 text-right break-all max-w-[60%]">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {order.notes && Object.keys(order.notes).length > 0 && (
                            <div className="section mb-5">
                                <p className="section-title text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Notes</p>
                                <div className="space-y-2">
                                    {Object.entries(order.notes).map(([k, v]) => (
                                        <div key={k} className="row flex justify-between text-sm">
                                            <span className="text-slate-500 capitalize">{k}</span>
                                            <span className="font-medium text-slate-800">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="footer mt-6 pt-4 border-t border-dashed border-slate-200 text-center">
                            <p className="text-xs text-slate-400">Thank you for your payment. For support, contact us at support@saasio.in</p>
                            <p className="text-xs text-slate-300 mt-1">Generated by SAASIO · {new Date().toLocaleDateString("en-IN")}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50];
type SortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export default function MyTransactionsPage() {
    const { error: toastError } = useToast();
    const token = getStoredToken();
    const authHeader = { Authorization: `Bearer ${token}` } as const;

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats]               = useState<Stats | null>(null);
    const [pagination, setPagination]     = useState<Pagination>({ total: 0, page: 1, pages: 1, limit: 20 });
    const [isLoading, setIsLoading]       = useState(true);
    const [receiptLoading, setReceiptLoading] = useState<string | null>(null);
    const [receiptData, setReceiptData]   = useState<ReceiptData | null>(null);

    const [search,     setSearch]     = useState("");
    const [status,     setStatus]     = useState<string>("ALL");
    const [sort,       setSort]       = useState<SortKey>("date_desc");
    const [page,       setPage]       = useState(1);
    const [limit,      setLimit]      = useState(20);
    const [showFilter, setShowFilter] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchTransactions = useCallback(async (
        p: number, lim: number, q: string, st: string, so: string
    ) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(p), limit: String(lim),
                search: q, status: st, sort: so,
            });
            // ← Uses the user-scoped my-transactions endpoint
            const res  = await fetch(`/api/v1/private/checkout/my-transactions?${params}`, { headers: authHeader });
            const json = await res.json();
            if (res.ok && json.success) {
                setTransactions(json.data.transactions);
                setPagination(json.data.pagination);
                setStats(json.data.stats);
            } else {
                toastError(json.message ?? "Failed to load transactions");
            }
        } catch {
            toastError("Network error");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            fetchTransactions(1, limit, search, status, sort);
        }, 350);
    }, [search]);

    useEffect(() => {
        fetchTransactions(page, limit, search, status, sort);
    }, [page, limit, status, sort]);

    const viewReceipt = async (t: Transaction) => {
        if (!t.razorpayPaymentId) {
            setReceiptData({ order: t, razorpay: null });
            return;
        }
        setReceiptLoading(t._id);
        try {
            const res  = await fetch(
                `/api/v1/private/checkout/payment-detail?paymentId=${t.razorpayPaymentId}`,
                { headers: authHeader }
            );
            const json = await res.json();
            if (res.ok && json.success) {
                setReceiptData(json.data);
            } else {
                toastError(json.message ?? "Failed to fetch receipt");
            }
        } catch {
            toastError("Network error");
        } finally {
            setReceiptLoading(null);
        }
    };

    const statCards = stats ? [
        {
            label: "Total Spent",
            value: fmt(stats.total.totalAmount),
            sub: `${stats.total.count} transactions`,
            icon: <FiTrendingUp size={18} />,
            color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100",
        },
        {
            label: "Successful",
            value: stats.success.count.toString(),
            sub: fmt(stats.success.totalAmount),
            icon: <FiCheckCircle size={18} />,
            color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100",
        },
        {
            label: "Pending",
            value: stats.pending.count.toString(),
            sub: fmt(stats.pending.totalAmount),
            icon: <FiClock size={18} />,
            color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100",
        },
        {
            label: "Failed",
            value: stats.failed.count.toString(),
            sub: fmt(stats.failed.totalAmount),
            icon: <FiXCircle size={18} />,
            color: "text-red-600", bg: "bg-red-50", border: "border-red-100",
        },
    ] : [];

    const sortOptions: { value: SortKey; label: string }[] = [
        { value: "date_desc",   label: "Newest first" },
        { value: "date_asc",    label: "Oldest first" },
        { value: "amount_desc", label: "Amount: High → Low" },
        { value: "amount_asc",  label: "Amount: Low → High" },
    ];

    const statusOptions = ["ALL", "SUCCESS", "PENDING", "FAILED"];

    return (
        <div className="w-full mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-violet-50 rounded-xl shrink-0">
                            <FiCreditCard className="text-violet-600" size={20} />
                        </div>
                        My Transactions
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm ml-[calc(2rem+12px)]">
                        Your personal payment history with receipts.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-[calc(2rem+12px)] sm:ml-0">
                    <button
                        onClick={() => fetchTransactions(page, limit, search, status, sort)}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all disabled:opacity-40"
                        title="Refresh"
                    >
                        <FiRefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* ── Summary stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.length > 0 ? statCards.map((s) => (
                    <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-4 shadow-sm`}>
                        <div className={`inline-flex p-2 rounded-xl ${s.bg} ${s.color} mb-3`}>{s.icon}</div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                )) : [...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-pulse">
                        <div className="h-8 w-8 rounded-xl bg-gray-200 mb-3" />
                        <div className="h-2.5 w-16 rounded bg-gray-200 mb-2" />
                        <div className="h-6 w-12 rounded bg-gray-200" />
                    </div>
                ))}
            </div>

            {/* ── Payment method mini-cards ── */}
            {transactions.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payment Channels</p>
                    <PaymentMethodCards transactions={transactions} />
                </div>
            )}

            {/* ── Table card ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search description, payment ID…"
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilter(v => !v)}
                            className={`sm:hidden flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-all ${showFilter ? "bg-violet-50 border-violet-200 text-violet-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        >
                            <FiFilter size={14} /> Filters
                        </button>

                        <div className={`hidden sm:flex items-center gap-2 ${showFilter ? "!flex flex-wrap" : ""}`}>
                            {statusOptions.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { setStatus(s); setPage(1); }}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                                        status === s
                                            ? s === "ALL"     ? "bg-violet-600 text-white border-violet-600"
                                            : s === "SUCCESS" ? "bg-emerald-600 text-white border-emerald-600"
                                            : s === "PENDING" ? "bg-amber-500 text-white border-amber-500"
                                            :                   "bg-red-500 text-white border-red-500"
                                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <select
                            value={sort}
                            onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
                            className="hidden sm:block px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none cursor-pointer text-gray-600"
                        >
                            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>

                        <select
                            value={limit}
                            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                            className="hidden sm:block px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none cursor-pointer text-gray-600"
                        >
                            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
                        </select>
                    </div>
                </div>

                {/* Mobile filter row */}
                {showFilter && (
                    <div className="sm:hidden px-5 pb-3 flex flex-wrap gap-2 border-b border-gray-100">
                        {statusOptions.map((s) => (
                            <button
                                key={s}
                                onClick={() => { setStatus(s); setPage(1); setShowFilter(false); }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                                    status === s
                                        ? s === "ALL"     ? "bg-violet-600 text-white border-violet-600"
                                        : s === "SUCCESS" ? "bg-emerald-600 text-white border-emerald-600"
                                        : s === "PENDING" ? "bg-amber-500 text-white border-amber-500"
                                        :                   "bg-red-500 text-white border-red-500"
                                        : "border-gray-200 text-gray-500"
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                        <select value={sort} onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
                            className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white outline-none text-gray-600">
                            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                )}

                {/* Table */}
                {isLoading ? (
                    <div className="p-5 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse flex gap-4 items-center p-4 rounded-xl border border-gray-100">
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                                    <div className="h-3 w-1/4 rounded bg-gray-200" />
                                </div>
                                <div className="h-5 w-20 rounded-full bg-gray-200" />
                                <div className="h-5 w-16 rounded bg-gray-200" />
                                <div className="h-5 w-16 rounded-full bg-gray-200" />
                            </div>
                        ))}
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 gap-4">
                        <div className="p-5 bg-violet-50 rounded-2xl">
                            <FiCreditCard size={32} className="text-violet-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-gray-700 font-semibold">{search || status !== "ALL" ? "No transactions match your filters" : "No transactions yet"}</p>
                            <p className="text-gray-400 text-xs mt-1">{search || status !== "ALL" ? "Try clearing your search or filters." : "Your completed payments will appear here."}</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {[
                                        { label: "#",         cls: "w-12 text-center" },
                                        { label: "Amount",    cls: "" },
                                        { label: "Status",    cls: "" },
                                        { label: "Method",    cls: "hidden sm:table-cell" },
                                        { label: "Payment ID", cls: "hidden lg:table-cell" },
                                        { label: "Order ID",  cls: "hidden xl:table-cell" },
                                        { label: "Date",      cls: "hidden md:table-cell" },
                                        { label: "Actions",   cls: "text-right" },
                                    ].map(({ label, cls }) => (
                                        <th key={label} className={`px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap ${cls}`}>
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.map((t, idx) => (
                                    <tr
                                        key={t._id}
                                        className="hover:bg-violet-50/30 transition-colors cursor-pointer group"
                                        onClick={() => viewReceipt(t)}
                                    >
                                        <td className="px-4 py-3.5 text-center text-xs font-medium text-gray-400">
                                            {(page - 1) * limit + idx + 1}
                                        </td>

                                        <td className="px-4 py-3.5">
                                            <span className="font-bold text-gray-900 whitespace-nowrap">
                                                {fmt(t.amount, t.currency)}
                                            </span>
                                            {t.description && (
                                                <p className="text-xs text-gray-400 truncate max-w-[120px] mt-0.5">{t.description}</p>
                                            )}
                                        </td>

                                        <td className="px-4 py-3.5">
                                            <StatusBadge status={t.status} />
                                        </td>

                                        <td className="hidden sm:table-cell px-4 py-3.5">
                                            <MethodBadge method={t.paymentMethod} />
                                        </td>

                                        <td className="hidden lg:table-cell px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                                            <CopyCell value={t.razorpayPaymentId} />
                                        </td>

                                        <td className="hidden xl:table-cell px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                                            <CopyCell value={t.razorpayOrderId} />
                                        </td>

                                        <td className="hidden md:table-cell px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                                            {fmtDate(t.createdAt)}
                                        </td>

                                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => viewReceipt(t)}
                                                    disabled={receiptLoading === t._id}
                                                    title="View Receipt"
                                                    className="flex items-center gap-1 p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all disabled:opacity-40"
                                                >
                                                    {receiptLoading === t._id
                                                        ? <span className="h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                                                        : <FiEye size={15} />
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => viewReceipt(t)}
                                                    disabled={receiptLoading === t._id}
                                                    title="Download Receipt"
                                                    className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all disabled:opacity-40"
                                                >
                                                    <FiDownload size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && pagination.pages > 1 && (
                    <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-gray-400">
                            Showing <span className="font-semibold text-gray-700">{(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)}</span> of <span className="font-semibold text-gray-700">{pagination.total}</span> transactions
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(1)} disabled={page === 1}
                                className="px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-violet-600 hover:bg-violet-50 border border-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                First
                            </button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 text-gray-500 hover:text-violet-600 hover:bg-violet-50 border border-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                <FiChevronLeft size={16} />
                            </button>

                            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                let p: number;
                                if (pagination.pages <= 5) p = i + 1;
                                else if (page <= 3) p = i + 1;
                                else if (page >= pagination.pages - 2) p = pagination.pages - 4 + i;
                                else p = page - 2 + i;
                                return p;
                            }).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                        p === page ? "bg-violet-600 text-white border-violet-600 shadow-sm" : "text-gray-500 border-gray-200 hover:bg-violet-50 hover:text-violet-600"
                                    }`}>
                                    {p}
                                </button>
                            ))}

                            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                                className="p-1.5 text-gray-500 hover:text-violet-600 hover:bg-violet-50 border border-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                <FiChevronRight size={16} />
                            </button>
                            <button onClick={() => setPage(pagination.pages)} disabled={page === pagination.pages}
                                className="px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-violet-600 hover:bg-violet-50 border border-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                Last
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {receiptData && (
                <ReceiptModal data={receiptData} onClose={() => setReceiptData(null)} />
            )}
        </div>
    );
}
