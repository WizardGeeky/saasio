"use client";

import React, { useState, useEffect } from "react";
import {
    FiUser, FiMail, FiPhone, FiBriefcase, FiMapPin,
    FiGlobe, FiShield, FiRefreshCw, FiEdit2,
    FiX, FiCheck, FiCalendar, FiActivity, FiLock,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";

interface ProfileData {
    _id: string;
    fullname: string;
    email: string;
    mobile: string;
    occupation: string;
    state: string;
    country: string;
    source: string;
    accountStatus: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

const SOURCE_OPTIONS = ["DIRECT", "GOOGLE", "LINKEDIN", "TWITTER", "REFERRAL", "OTHER"];

const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
    ACTIVE:    { pill: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    SUSPENDED: { pill: "bg-red-100 text-red-700 border-red-200",            dot: "bg-red-500"     },
    INACTIVE:  { pill: "bg-gray-100 text-gray-500 border-gray-200",         dot: "bg-gray-400"    },
};

function initials(name: string) {
    return name.split(" ").map(n => n[0] ?? "").join("").toUpperCase().slice(0, 2);
}
function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProfilePage() {
    const { success: toastSuccess, error: toastError } = useToast();
    const token = getStoredToken();
    const auth = { Authorization: `Bearer ${token}` } as const;

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        fullname: "", mobile: "", occupation: "", state: "", country: "", source: "",
    });

    async function load() {
        setLoading(true);
        try {
            const res = await fetch("/api/v1/private/profile", { headers: auth });
            const data = await res.json();
            if (res.ok) {
                setProfile(data.user);
                const u = data.user;
                setForm({ fullname: u.fullname, mobile: u.mobile, occupation: u.occupation, state: u.state, country: u.country, source: u.source });
            } else toastError(data.message ?? "Failed to load");
        } catch { toastError("Network error"); }
        finally { setLoading(false); }
    }

    useEffect(() => { load(); }, []);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/v1/private/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...auth },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) { toastSuccess("Profile updated!"); setProfile(data.user); setEditing(false); }
            else toastError(data.message ?? "Failed to save");
        } catch { toastError("Unexpected error"); }
        finally { setSaving(false); }
    }

    const input = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";
    const lbl   = "block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5";

    /* ── Skeleton ── */
    if (loading) return (
        <div className="max-w-9xl mx-auto space-y-4 mb-10 animate-pulse">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex gap-5">
                <div className="h-20 w-20 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                    <div className="h-5 w-44 rounded bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-200" />
                    <div className="flex gap-2 pt-1">
                        <div className="h-6 w-24 rounded-full bg-gray-200" />
                        <div className="h-6 w-20 rounded-full bg-gray-200" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[0, 1].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                        {[0, 1, 2].map(j => <div key={j} className="h-10 rounded-xl bg-gray-100" />)}
                    </div>
                ))}
            </div>
        </div>
    );

    if (!profile) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <p className="text-gray-500 text-sm">Could not load profile.</p>
            <button onClick={load} className="text-sm text-emerald-600 font-semibold hover:underline">Retry</button>
        </div>
    );

    const st = STATUS_STYLE[profile.accountStatus] ?? STATUS_STYLE.INACTIVE;

    return (
        <div className="max-w-9xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">

            {/* ─── Hero card ─── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                <div className="flex items-start gap-4 sm:gap-5">

                    {/* Avatar */}
                    <div className="shrink-0 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full text-white font-bold text-2xl sm:text-3xl shadow-lg"
                        style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                        {initials(profile.fullname)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight truncate">
                                    {profile.fullname}
                                </h1>
                                <p className="text-sm text-gray-500 mt-0.5 truncate">{profile.occupation}</p>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={load} title="Refresh"
                                    className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                                    <FiRefreshCw size={15} />
                                </button>
                                {!editing ? (
                                    <button onClick={() => setEditing(true)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 active:scale-95 transition-all">
                                        <FiEdit2 size={13} /> Edit
                                    </button>
                                ) : (
                                    <button onClick={() => setEditing(false)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl active:scale-95 transition-all">
                                        <FiX size={13} /> Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                                <FiShield size={10} /> {profile.role}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-2.5 py-1 rounded-full ${st.pill}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                {profile.accountStatus}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                                <FiCalendar size={10} /> {fmtDate(profile.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                                <FiActivity size={10} /> {profile.source}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Details ─── */}
            <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">

                {/* Account Info — read-only */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-100 rounded-lg"><FiLock size={12} className="text-slate-500" /></div>
                            <span className="text-sm font-semibold text-gray-800">Account Info</span>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full tracking-wide">READ-ONLY</span>
                    </div>

                    {/* Email */}
                    <div>
                        <p className={lbl}><FiMail size={9} className="inline mr-1" />Email</p>
                        <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 truncate">
                            {profile.email}
                        </div>
                    </div>

                    {/* Role + Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className={lbl}><FiShield size={9} className="inline mr-1" />Role</p>
                            <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                                <span className="text-xs font-bold text-emerald-700">{profile.role}</span>
                            </div>
                        </div>
                        <div>
                            <p className={lbl}><FiActivity size={9} className="inline mr-1" />Status</p>
                            <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold border px-2 py-0.5 rounded-full ${st.pill}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                    {profile.accountStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Joined + Updated */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className={lbl}><FiCalendar size={9} className="inline mr-1" />Joined</p>
                            <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600">
                                {fmtDate(profile.createdAt)}
                            </div>
                        </div>
                        <div>
                            <p className={lbl}><FiCalendar size={9} className="inline mr-1" />Updated</p>
                            <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600">
                                {fmtDate(profile.updatedAt)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Details — editable */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 rounded-lg"><FiUser size={12} className="text-emerald-600" /></div>
                            <span className="text-sm font-semibold text-gray-800">Personal Details</span>
                        </div>
                        {editing && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full tracking-wide">
                                EDITING
                            </span>
                        )}
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className={lbl}><FiUser size={9} className="inline mr-1" />Full Name <span className="text-red-400">*</span></label>
                        <input type="text" required disabled={!editing}
                            value={editing ? form.fullname : profile.fullname}
                            onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))}
                            className={input} />
                    </div>

                    {/* Mobile */}
                    <div>
                        <label className={lbl}><FiPhone size={9} className="inline mr-1" />Mobile</label>
                        <input type="tel" disabled={!editing}
                            value={editing ? form.mobile : profile.mobile}
                            onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                            className={input} />
                    </div>

                    {/* Occupation */}
                    <div>
                        <label className={lbl}><FiBriefcase size={9} className="inline mr-1" />Occupation <span className="text-red-400">*</span></label>
                        <input type="text" required disabled={!editing}
                            value={editing ? form.occupation : profile.occupation}
                            onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
                            className={input} />
                    </div>

                    {/* State + Country */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={lbl}><FiMapPin size={9} className="inline mr-1" />State <span className="text-red-400">*</span></label>
                            <input type="text" required disabled={!editing}
                                value={editing ? form.state : profile.state}
                                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                                className={input} />
                        </div>
                        <div>
                            <label className={lbl}><FiGlobe size={9} className="inline mr-1" />Country <span className="text-red-400">*</span></label>
                            <input type="text" required disabled={!editing}
                                value={editing ? form.country : profile.country}
                                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                                className={input} />
                        </div>
                    </div>

                    {/* Source */}
                    <div>
                        <label className={lbl}>Source</label>
                        <select disabled={!editing}
                            value={editing ? form.source : profile.source}
                            onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                            className={input + " cursor-pointer"}>
                            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Save button */}
                    {editing && (
                        <button type="submit" disabled={saving}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 active:scale-[0.98] transition-all mt-1">
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheck size={14} />}
                            Save Changes
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
