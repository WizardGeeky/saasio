"use client";

import React, { useState, useEffect } from "react";
import {
    FiUser, FiMail, FiPhone, FiBriefcase, FiMapPin,
    FiGlobe, FiShield, FiRefreshCw, FiEdit2,
    FiX, FiCheck, FiCalendar, FiActivity, FiLock,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";
import { useDashTheme } from "@/app/contexts/DashThemeContext";

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

const STATUS_STYLE: Record<string, {
    darkBg: string; darkDot: string; darkText: string;
    lightBg: string; lightDot: string; lightText: string;
}> = {
    ACTIVE:    { darkBg: "bg-emerald-500/20", darkDot: "bg-emerald-400", darkText: "text-emerald-300", lightBg: "bg-emerald-50 border border-emerald-200", lightDot: "bg-emerald-500", lightText: "text-emerald-700" },
    SUSPENDED: { darkBg: "bg-red-500/20",     darkDot: "bg-red-400",     darkText: "text-red-300",     lightBg: "bg-red-50    border border-red-200",     lightDot: "bg-red-500",     lightText: "text-red-700"     },
    INACTIVE:  { darkBg: "bg-white/10",       darkDot: "bg-gray-400",    darkText: "text-gray-300",    lightBg: "bg-gray-50   border border-gray-200",    lightDot: "bg-gray-400",    lightText: "text-gray-500"    },
};

function initials(name: string) {
    return name.split(" ").map(n => n[0] ?? "").join("").toUpperCase().slice(0, 2);
}
function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProfilePage() {
    const { isDark } = useDashTheme();
    const { success: toastSuccess, error: toastError } = useToast();
    const token = getStoredToken();
    const auth  = { Authorization: `Bearer ${token}` } as const;

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving,  setSaving]  = useState(false);
    const [form, setForm] = useState({
        fullname: "", mobile: "", occupation: "", state: "", country: "", source: "",
    });

    async function load() {
        setLoading(true);
        try {
            const res  = await fetch("/api/v1/private/profile", { headers: auth });
            const data = await res.json();
            if (res.ok) {
                setProfile(data.user);
                const u = data.user;
                setForm({ fullname: u.fullname, mobile: u.mobile, occupation: u.occupation, state: u.state, country: u.country, source: u.source });
            } else toastError(data.message ?? "Failed to load");
        } catch { toastError("Network error"); }
        finally   { setLoading(false); }
    }

    useEffect(() => { load(); }, []);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const res  = await fetch("/api/v1/private/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...auth },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) { toastSuccess("Profile updated!"); setProfile(data.user); setEditing(false); }
            else toastError(data.message ?? "Failed to save");
        } catch { toastError("Unexpected error"); }
        finally   { setSaving(false); }
    }

    function cancelEdit() {
        if (!profile) return;
        setForm({ fullname: profile.fullname, mobile: profile.mobile, occupation: profile.occupation, state: profile.state, country: profile.country, source: profile.source });
        setEditing(false);
    }

    /* ── Theme-aware class strings ── */
    const card   = isDark ? "bg-[#0d0e1c] border-[#1e2035]" : "bg-white border-gray-200";
    const cardHd = isDark ? "border-[#1e2035]"               : "border-gray-100";
    const cardFt = isDark ? "bg-[#111220] border-[#1e2035]"  : "bg-gray-50/60 border-gray-100";
    const txt1   = isDark ? "text-slate-100"  : "text-gray-900";
    const txt2   = isDark ? "text-slate-400"  : "text-gray-500";
    const txt3   = isDark ? "text-slate-300"  : "text-gray-700";
    const divider = isDark ? "border-[#1e2035]" : "border-gray-100";

    const inputCls = [
        "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all",
        isDark
            ? "bg-[#111220] border-[#252843] text-slate-200 placeholder:text-slate-600 disabled:bg-[#0d0e1c] disabled:text-slate-500 disabled:cursor-not-allowed focus:bg-[#181930] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
            : "bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20",
    ].join(" ");

    const labelCls = `block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${isDark ? "text-slate-500" : "text-gray-500"}`;

    const iconBtn  = isDark
        ? "p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
        : "p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all";

    /* ── Skeleton ── */
    const skBg  = isDark ? "bg-[#1e2035]" : "bg-gray-200";
    const skBg2 = isDark ? "bg-[#111220]" : "bg-gray-100";

    if (loading) return (
        <div className="w-full mx-auto pb-10 animate-pulse space-y-4">
            <div className="lg:hidden rounded-2xl overflow-hidden">
                <div className={`h-28 ${skBg}`} />
                <div className={`${isDark ? "bg-[#0d0e1c]" : "bg-white"} p-4 grid grid-cols-2 gap-2`}>
                    {[0,1,2,3].map(i => <div key={i} className={`h-14 rounded-xl ${skBg2}`} />)}
                </div>
            </div>
            <div className={`hidden lg:flex rounded-2xl overflow-hidden shadow-sm border ${isDark ? "border-[#1e2035]" : "border-gray-200"}`}>
                <div className={`w-64 ${skBg}`} style={{ minHeight: 420 }} />
                <div className={`flex-1 ${isDark ? "bg-[#0d0e1c]" : "bg-white"} p-8 space-y-4`}>
                    <div className="grid grid-cols-2 gap-4">
                        {[0,1,2,3,4,5].map(i => (
                            <div key={i} className={`space-y-1.5 ${i === 2 || i === 5 ? "col-span-2" : ""}`}>
                                <div className={`h-3 w-20 rounded ${skBg2}`} />
                                <div className={`h-10 rounded-xl ${skBg2}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (!profile) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <p className={`text-sm ${txt2}`}>Could not load profile.</p>
            <button onClick={load} className="text-sm text-violet-500 font-semibold hover:underline">Retry</button>
        </div>
    );

    const st       = STATUS_STYLE[profile.accountStatus] ?? STATUS_STYLE.INACTIVE;
    const location = [profile.state, profile.country].filter(Boolean).join(", ");

    /* ── Shared form fields (renders inside both mobile + desktop) ── */
    const FormFields = (
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
                <label className={labelCls}><FiUser size={9} className="inline mr-1" />Full Name <span className="text-red-400">*</span></label>
                <input type="text" required disabled={!editing}
                    value={editing ? form.fullname : profile.fullname}
                    onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))}
                    placeholder="Your full name" className={inputCls} />
            </div>
            <div>
                <label className={labelCls}><FiPhone size={9} className="inline mr-1" />Mobile</label>
                <input type="tel" disabled={!editing}
                    value={editing ? form.mobile : (profile.mobile || "")}
                    onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                    placeholder="+91 00000 00000" className={inputCls} />
            </div>
            <div className="col-span-2">
                <label className={labelCls}><FiBriefcase size={9} className="inline mr-1" />Occupation <span className="text-red-400">*</span></label>
                <input type="text" required disabled={!editing}
                    value={editing ? form.occupation : profile.occupation}
                    onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
                    placeholder="e.g. Software Engineer" className={inputCls} />
            </div>
            <div>
                <label className={labelCls}><FiMapPin size={9} className="inline mr-1" />State <span className="text-red-400">*</span></label>
                <input type="text" required disabled={!editing}
                    value={editing ? form.state : profile.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    placeholder="e.g. Karnataka" className={inputCls} />
            </div>
            <div>
                <label className={labelCls}><FiGlobe size={9} className="inline mr-1" />Country <span className="text-red-400">*</span></label>
                <input type="text" required disabled={!editing}
                    value={editing ? form.country : profile.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    placeholder="e.g. India" className={inputCls} />
            </div>
            <div className="col-span-2">
                <label className={labelCls}><FiActivity size={9} className="inline mr-1" />How did you hear about us?</label>
                <select disabled={!editing}
                    value={editing ? form.source : profile.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className={inputCls + " cursor-pointer"}>
                    {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </div>
    );

    /* ── Edit / Cancel button ── */
    const EditBtn = !editing ? (
        <button type="button" onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-xl active:scale-95 transition-all shadow-sm"
            style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}>
            <FiEdit2 size={11} /> Edit
        </button>
    ) : (
        <button type="button" onClick={cancelEdit}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl active:scale-95 transition-all ${isDark ? "text-slate-300 bg-white/10 hover:bg-white/15" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}>
            <FiX size={11} /> Cancel
        </button>
    );

    /* ── Save button ── */
    const SaveBtn = editing && (
        <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white rounded-xl shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}>
            {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                : <><FiCheck size={13} />Save Changes</>}
        </button>
    );

    return (
        <div className="w-full mx-auto pb-10 animate-in fade-in slide-in-from-bottom-3 duration-400">

            {/* ════════════════════════════════════════════════
                MOBILE  (hidden lg+)
            ════════════════════════════════════════════════ */}
            <div className="lg:hidden space-y-3">

                {/* Compact hero */}
                <div className="rounded-2xl overflow-hidden shadow-sm"
                    style={{ background: "linear-gradient(135deg, #3730a3 0%, #6d28d9 60%, #7c3aed 100%)" }}>

                    <div className="flex items-center gap-3 px-4 pt-5 pb-3">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shrink-0 select-none"
                            style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.25)" }}>
                            {initials(profile.fullname)}
                        </div>
                        {/* Name + badges */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{profile.fullname}</p>
                            <p className="text-xs text-indigo-200 truncate">{profile.occupation || "—"}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.darkBg} ${st.darkText}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${st.darkDot}`} />{profile.accountStatus}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/85">
                                    <FiShield size={8} />{profile.role}
                                </span>
                            </div>
                        </div>
                        <button type="button" onClick={load}
                            className="p-1.5 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-all shrink-0">
                            <FiRefreshCw size={13} />
                        </button>
                    </div>

                    {/* 2×2 info chips */}
                    <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                        {[
                            { icon: FiMail,     label: "Email",    val: profile.email },
                            { icon: FiPhone,    label: "Mobile",   val: profile.mobile || "—" },
                            { icon: FiMapPin,   label: "Location", val: location || "—" },
                            { icon: FiCalendar, label: "Joined",   val: fmtDate(profile.createdAt) },
                        ].map(({ icon: Icon, label, val }) => (
                            <div key={label} className="flex items-center gap-2 rounded-xl px-3 py-2"
                                style={{ background: "rgba(255,255,255,0.08)" }}>
                                <Icon size={12} className="text-indigo-300 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">{label}</p>
                                    <p className="text-[11px] text-white/80 font-medium truncate">{val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form card */}
                <form onSubmit={save}>
                    <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
                        {/* Header */}
                        <div className={`flex items-center justify-between px-4 py-3.5 border-b ${cardHd}`}>
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${editing ? (isDark ? "bg-violet-500/20" : "bg-violet-100") : (isDark ? "bg-white/5" : "bg-gray-100")}`}>
                                    {editing
                                        ? <FiEdit2 size={12} className={isDark ? "text-violet-400" : "text-violet-600"} />
                                        : <FiLock  size={12} className={isDark ? "text-slate-500" : "text-gray-400"} />}
                                </div>
                                <p className={`text-sm font-bold ${txt1}`}>Personal Details</p>
                            </div>
                            {EditBtn}
                        </div>

                        {/* Fields */}
                        <div className="p-4">{FormFields}</div>

                        {/* Status pills */}
                        <div className={`px-4 pb-3 flex items-center gap-2 flex-wrap border-t ${cardHd} pt-3`}>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.lightBg} ${st.lightText}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.lightDot}`} />{profile.accountStatus}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isDark ? "bg-violet-500/15 border border-violet-500/30 text-violet-400" : "bg-violet-50 border border-violet-200 text-violet-700"}`}>
                                <FiShield size={9} />{profile.role}
                            </span>
                        </div>

                        {/* Save */}
                        {editing && <div className="px-4 pb-4">{SaveBtn}</div>}
                    </div>
                </form>
            </div>

            {/* ════════════════════════════════════════════════
                DESKTOP  (hidden below lg)
            ════════════════════════════════════════════════ */}
            <form onSubmit={save} className="hidden lg:block">
                <div className="mb-6">
                    <h1 className={`text-2xl font-bold ${txt1}`}>My Profile</h1>
                    <p className={`text-sm mt-0.5 ${txt2}`}>Manage your personal information and account details</p>
                </div>

                <div className={`rounded-2xl overflow-hidden shadow-sm border flex ${isDark ? "border-[#1e2035]" : "border-gray-200"}`}>

                    {/* Left panel — gradient (same in light + dark; it's always dark) */}
                    <div className="w-64 xl:w-72 shrink-0 flex flex-col items-center text-center px-8 py-10"
                        style={{ background: "linear-gradient(160deg, #3730a3 0%, #6d28d9 50%, #7c3aed 100%)" }}>

                        <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white select-none mb-4 shadow-xl"
                            style={{ background: "rgba(255,255,255,0.15)", border: "3px solid rgba(255,255,255,0.3)" }}>
                            {initials(profile.fullname)}
                        </div>

                        <p className="text-xl font-bold text-white leading-tight">{profile.fullname}</p>
                        <p className="text-sm text-indigo-200 mt-0.5">{profile.occupation || "—"}</p>

                        <div className={`flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full text-xs font-semibold ${st.darkBg} ${st.darkText}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.darkDot}`} />{profile.accountStatus}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white/90">
                            <FiShield size={10} />{profile.role}
                        </div>

                        <div className={`w-full border-t border-white/15 my-5`} />

                        <div className="w-full space-y-3 text-left">
                            {[
                                { icon: FiMail,     label: "Email",    val: profile.email },
                                { icon: FiPhone,    label: "Mobile",   val: profile.mobile },
                                { icon: FiMapPin,   label: "Location", val: location },
                                { icon: FiCalendar, label: "Joined",   val: fmtDate(profile.createdAt) },
                                { icon: FiActivity, label: "Source",   val: profile.source },
                            ].filter(r => r.val).map(({ icon: Icon, label, val }) => (
                                <div key={label} className="flex items-start gap-2.5">
                                    <Icon size={13} className="text-indigo-300 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">{label}</p>
                                        <p className="text-xs text-white/80 truncate">{val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right panel */}
                    <div className={`flex-1 min-w-0 flex flex-col ${isDark ? "bg-[#0d0e1c]" : "bg-white"}`}>

                        {/* Header */}
                        <div className={`flex items-center justify-between px-8 py-5 border-b ${cardHd}`}>
                            <div className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-lg ${editing ? (isDark ? "bg-violet-500/20" : "bg-violet-100") : (isDark ? "bg-white/5" : "bg-gray-100")}`}>
                                    {editing
                                        ? <FiEdit2 size={13} className={isDark ? "text-violet-400" : "text-violet-600"} />
                                        : <FiLock  size={13} className={isDark ? "text-slate-500" : "text-gray-400"} />}
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${txt1}`}>Personal Details</p>
                                    <p className={`text-xs ${txt2}`}>{editing ? "Changes are not saved yet" : "Click Edit to update your info"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={load} title="Refresh" className={iconBtn}>
                                    <FiRefreshCw size={14} />
                                </button>
                                {!editing ? (
                                    <button type="button" onClick={() => setEditing(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all active:scale-95 shadow-sm"
                                        style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}>
                                        <FiEdit2 size={12} /> Edit
                                    </button>
                                ) : (
                                    <button type="button" onClick={cancelEdit}
                                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl active:scale-95 transition-all ${isDark ? "text-slate-300 bg-white/10 hover:bg-white/15" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}>
                                        <FiX size={12} /> Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="flex-1 px-8 py-6">{FormFields}</div>

                        {/* Footer */}
                        <div className={`px-8 py-4 border-t flex items-center justify-between gap-4 ${cardFt}`}>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className={`flex items-center gap-1.5 text-xs ${txt3}`}>
                                    <FiMail size={11} className={isDark ? "text-slate-500" : "text-gray-400"} />
                                    {profile.email}
                                </div>
                                <span className={isDark ? "text-slate-700" : "text-gray-300"}>·</span>
                                <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? "text-violet-400" : "text-violet-700"}`}>
                                    <FiShield size={11} className={isDark ? "text-violet-500" : "text-violet-400"} />
                                    {profile.role}
                                </div>
                                <span className={isDark ? "text-slate-700" : "text-gray-300"}>·</span>
                                <div className={`flex items-center gap-1.5 text-xs ${isDark ? "text-slate-600" : "text-gray-400"}`}>
                                    <FiLock size={10} /> Read-only fields
                                </div>
                            </div>
                            {editing && (
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0"
                                    style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}>
                                    {saving
                                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                                        : <><FiCheck size={13} />Save Changes</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
