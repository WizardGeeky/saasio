"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";
import {
    FiStar,
    FiRefreshCw,
    FiCalendar,
    FiFileText,
    FiMessageSquare,
    FiTrendingUp,
} from "react-icons/fi";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReviewRecord {
    _id: string;
    rating: number;
    title?: string;
    body?: string;
    resumeName?: string;
    templateName?: string;
    status: "PUBLISHED" | "PENDING" | "HIDDEN";
    createdAt: string;
}

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

function StarDisplay({ rating, size = 15 }: { rating: number; size?: number }) {
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

function SmallStatCard({
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon size={18} className={color} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyReviewsPage() {
    const { error: toastError } = useToast();
    const [reviews, setReviews] = useState<ReviewRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const token = getStoredToken();
            const res = await fetch("/api/v1/private/reviews/my", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                toastError(data.message ?? "Failed to load reviews");
                return;
            }
            setReviews(data.data ?? []);
        } catch {
            toastError("Network error");
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const totalReviews = reviews.length;
    const avgRating = totalReviews
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
        : 0;
    const fiveStarCount = reviews.filter((r) => r.rating === 5).length;

    return (
        <div className="mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                            <FiStar size={20} />
                        </span>
                        My Reviews
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 sm:pl-14">
                        Reviews you have submitted after downloading resumes.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchReviews}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FiRefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <SmallStatCard icon={FiMessageSquare} label="Total Reviews" value={totalReviews} color="text-indigo-600" bg="bg-indigo-50" />
                <SmallStatCard icon={FiStar} label="Avg Rating" value={totalReviews ? `${avgRating} / 5` : "—"} color="text-amber-500" bg="bg-amber-50" />
                <SmallStatCard icon={FiTrendingUp} label="5-Star Given" value={fiveStarCount} color="text-emerald-600" bg="bg-emerald-50" />
            </div>

            {/* Reviews list */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                            <FiStar size={18} />
                        </span>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Your Reviews</h2>
                            <p className="text-sm text-slate-500">Feedback you have left for the service.</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3 p-5 sm:p-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 p-4">
                                <div className="h-4 w-28 rounded bg-slate-200" />
                                <div className="mt-3 h-3 w-48 rounded bg-slate-100" />
                                <div className="mt-4 h-3 w-64 rounded bg-slate-100" />
                            </div>
                        ))}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <FiStar size={22} />
                        </span>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">No reviews yet</h3>
                        <p className="mt-2 max-w-md text-sm text-slate-500">
                            After you download a resume, you will be prompted to leave a review. Your reviews will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {reviews.map((review) => (
                            <article key={review._id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <StarDisplay rating={review.rating} />
                                            <span className="text-sm font-semibold text-slate-700">{review.rating} / 5</span>
                                            <StatusBadge status={review.status} />
                                        </div>
                                        {review.title && (
                                            <p className="mt-2 text-base font-semibold text-slate-900">{review.title}</p>
                                        )}
                                        {review.body && (
                                            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{review.body}</p>
                                        )}
                                    </div>
                                </div>

                                {(review.resumeName || review.templateName) && (
                                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                                        {review.resumeName && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                                <FiFileText size={11} />
                                                {review.resumeName}
                                            </span>
                                        )}
                                        {review.templateName && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-200 px-3 py-1 text-xs font-medium text-violet-700">
                                                {review.templateName}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                                    <FiCalendar size={11} />
                                    {formatDateTime(review.createdAt)}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
