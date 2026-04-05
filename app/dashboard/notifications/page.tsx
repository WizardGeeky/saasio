"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    FiBell, FiSend, FiUsers, FiShield, FiMail,
    FiRefreshCw, FiAlertTriangle, FiCheck, FiLock,
    FiEye, FiEyeOff,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";
import { usePrivilege } from "@/app/utils/usePrivilege";

// ─── Types ────────────────────────────────────────────────────────────────────

type Target = "ALL" | "ROLE";

interface RoleOption { _id: string; }

const DEFAULT_HTML = `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
  <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px;">Hello 👋</h2>
  <p style="margin: 0 0 16px; color: #4b5563; font-size: 15px; line-height: 1.6;">Write your message here. You can use HTML to format it.</p>
  <p style="margin: 0; color: #9ca3af; font-size: 13px;">— SAASIO Team</p>
</div>`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const { can, isLoading: privLoading } = usePrivilege();
    const { success: toastSuccess, error: toastError } = useToast();

    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [recipientCount, setRecipientCount] = useState<number | null>(null);
    const [countLoading, setCountLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null);

    const [subject, setSubject] = useState("");
    const [html, setHtml] = useState(DEFAULT_HTML);
    const [target, setTarget] = useState<Target>("ALL");
    const [roleId, setRoleId] = useState("");

    const token = getStoredToken();
    const canSend = !privLoading && can("POST", "/api/v1/private/notifications");
    const canRead  = !privLoading && can("GET",  "/api/v1/private/notifications");

    const authHeader = { Authorization: `Bearer ${token}` } as const;

    // Fetch available roles
    useEffect(() => {
        fetch("/api/v1/private/roles", { headers: authHeader })
            .then(r => r.json())
            .then(d => { setRoles(d.roles ?? []); if (d.roles?.length) setRoleId(d.roles[0]._id); })
            .catch(() => {})
            .finally(() => setRolesLoading(false));
    }, []);

    // Fetch recipient count when target changes
    const fetchCount = useCallback(async () => {
        if (!canRead) return;
        setCountLoading(true);
        try {
            const params = target === "ROLE" && roleId
                ? `?target=ROLE&roleId=${encodeURIComponent(roleId)}`
                : "?target=ALL";
            const res = await fetch(`/api/v1/private/notifications${params}`, { headers: authHeader });
            const data = await res.json();
            if (res.ok) setRecipientCount(data.count);
        } catch {}
        finally { setCountLoading(false); }
    }, [target, roleId, canRead, token]);

    useEffect(() => { fetchCount(); }, [fetchCount]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim()) { toastError("Subject is required"); return; }
        if (!html.trim()) { toastError("Email body is required"); return; }
        setIsSending(true);
        try {
            const payload: Record<string, string> = { subject, html, target };
            if (target === "ROLE") payload.roleId = roleId;
            const res = await fetch("/api/v1/private/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeader },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                toastSuccess(data.message);
                setLastResult({ sent: data.sent, failed: data.failed });
                setSubject("");
                setHtml(DEFAULT_HTML);
            } else toastError(data.message ?? "Failed to send");
        } catch { toastError("Unexpected error"); }
        finally { setIsSending(false); }
    };

    if (!privLoading && !canSend && !canRead) return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4 px-4 animate-in fade-in duration-500">
            <div className="p-5 bg-red-100 rounded-2xl"><FiLock size={36} className="text-red-500" /></div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-sm">You don&apos;t have permission to send notifications.</p>
            </div>
        </div>
    );

    return (
        <div className="w-full mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0"><FiBell className="text-emerald-600" size={20} /></div>
                        Notifications
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm ml-[calc(2rem+12px)]">Compose and send emails to platform users.</p>
                </div>
                <button onClick={fetchCount} disabled={countLoading} className="flex items-center gap-1.5 ml-[calc(2rem+12px)] sm:ml-0 self-start sm:self-auto p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-40" title="Refresh count">
                    <FiRefreshCw size={15} className={countLoading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Left: Compose ── */}
                <div className="lg:col-span-2 space-y-4">
                    <form onSubmit={handleSend} className="space-y-4">

                        {/* Subject */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-3">
                            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FiMail size={15} className="text-emerald-500" /> Compose Email</h2>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="e.g. Important platform update"
                                    required
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all placeholder:text-gray-400"
                                />
                            </div>

                            {/* HTML Body */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Body (HTML) <span className="text-red-400">*</span></label>
                                    <button type="button" onClick={() => setShowPreview(p => !p)} className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                                        {showPreview ? <><FiEyeOff size={12} /> Edit</> : <><FiEye size={12} /> Preview</>}
                                    </button>
                                </div>

                                {showPreview ? (
                                    <div className="min-h-[280px] max-h-[400px] overflow-y-auto border border-gray-200 rounded-xl bg-gray-50 p-4">
                                        <div dangerouslySetInnerHTML={{ __html: html }} />
                                    </div>
                                ) : (
                                    <textarea
                                        value={html}
                                        onChange={e => setHtml(e.target.value)}
                                        rows={12}
                                        required
                                        placeholder="Write your HTML email content here…"
                                        className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-xs text-gray-700 font-mono resize-none transition-all placeholder:text-gray-400 leading-relaxed"
                                    />
                                )}
                                <p className="text-xs text-gray-400">You can use full HTML including inline styles for rich emails.</p>
                            </div>
                        </div>

                        {/* Send button */}
                        <button
                            type="submit"
                            disabled={isSending || !canSend}
                            className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] rounded-xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                            ) : (
                                <><FiSend size={15} /> Send Email to {countLoading ? "…" : (recipientCount ?? 0)} Recipient{recipientCount !== 1 ? "s" : ""}</>
                            )}
                        </button>
                    </form>
                </div>

                {/* ── Right: Target + Result ── */}
                <div className="space-y-4">

                    {/* Target selector */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FiUsers size={15} className="text-emerald-500" /> Recipients</h2>

                        {/* Target toggle */}
                        <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200 gap-1">
                            {(["ALL", "ROLE"] as Target[]).map((t) => (
                                <button key={t} type="button" onClick={() => setTarget(t)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${target === t ? "bg-white text-emerald-700 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                                    {t === "ALL" ? <FiUsers size={12} /> : <FiShield size={12} />}
                                    {t === "ALL" ? "All Users" : "By Role"}
                                </button>
                            ))}
                        </div>

                        {/* Role selector */}
                        {target === "ROLE" && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Role</label>
                                {rolesLoading ? (
                                    <div className="animate-pulse h-10 bg-gray-100 rounded-xl" />
                                ) : (
                                    <select
                                        value={roleId}
                                        onChange={e => setRoleId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all cursor-pointer"
                                    >
                                        {roles.map(r => <option key={r._id} value={r._id}>{r._id}</option>)}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* Recipient count preview */}
                        <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${countLoading ? "bg-gray-50 border-gray-200" : (recipientCount ?? 0) > 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                            <div className={`p-2 rounded-lg ${(recipientCount ?? 0) > 0 ? "bg-emerald-100" : "bg-amber-100"}`}>
                                {(recipientCount ?? 0) > 0 ? <FiUsers size={14} className="text-emerald-600" /> : <FiAlertTriangle size={14} className="text-amber-600" />}
                            </div>
                            <div>
                                {countLoading ? (
                                    <div className="animate-pulse h-4 w-24 bg-gray-200 rounded" />
                                ) : (
                                    <>
                                        <p className="text-sm font-bold text-gray-800">{recipientCount ?? 0} active user{recipientCount !== 1 ? "s" : ""}</p>
                                        <p className="text-xs text-gray-500">will receive this email</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {(recipientCount ?? 0) === 0 && !countLoading && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <FiAlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">No active users found for the selected target. The email will not be sent.</p>
                            </div>
                        )}
                    </div>

                    {/* Last send result */}
                    {lastResult && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FiCheck size={15} className="text-emerald-500" /> Last Send Result</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-emerald-700">{lastResult.sent}</p>
                                    <p className="text-xs text-emerald-600 font-medium mt-0.5">Delivered</p>
                                </div>
                                <div className={`border rounded-xl p-3 text-center ${lastResult.failed > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                                    <p className={`text-2xl font-bold ${lastResult.failed > 0 ? "text-red-600" : "text-gray-400"}`}>{lastResult.failed}</p>
                                    <p className={`text-xs font-medium mt-0.5 ${lastResult.failed > 0 ? "text-red-500" : "text-gray-400"}`}>Failed</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tips card */}
                    <div className="bg-emerald-900 text-white rounded-2xl p-5 space-y-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><FiBell size={60} /></div>
                        <h3 className="font-semibold text-sm relative z-10">Email Tips</h3>
                        <ul className="text-xs text-emerald-200 space-y-1.5 relative z-10 leading-relaxed">
                            <li>• Only <strong className="text-white">ACTIVE</strong> users receive emails</li>
                            <li>• Use inline CSS for best email client compatibility</li>
                            <li>• Test with a small role before sending to all users</li>
                            <li>• Preview your HTML before sending</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
