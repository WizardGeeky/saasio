"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    FiUsers, FiPlus, FiEdit2, FiTrash2, FiRefreshCw,
    FiX, FiSave, FiCheck, FiLock, FiUser, FiMail,
    FiPhone, FiShield,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";
import { usePrivilege } from "@/app/utils/usePrivilege";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

interface UserData {
    _id: string;
    fullname: string;
    email: string;
    mobile: string;
    occupation: string;
    state: string;
    country: string;
    source: string;
    accountStatus: AccountStatus;
    role: string;
    createdAt: string;
    updatedAt: string;
}

interface RoleOption { _id: string; }

type ModalType = "new" | "edit" | null;

const EMPTY_FORM = {
    fullname: "", email: "", mobile: "", occupation: "",
    state: "", country: "", source: "DIRECT", role: "", accountStatus: "INACTIVE" as AccountStatus,
};

const STATUS_STYLES: Record<AccountStatus, string> = {
    ACTIVE:    "bg-emerald-100 text-emerald-700 border-emerald-200",
    SUSPENDED: "bg-red-100 text-red-700 border-red-200",
    INACTIVE:  "bg-gray-100 text-gray-500 border-gray-200",
};
const STATUS_DOT: Record<AccountStatus, string> = {
    ACTIVE: "bg-emerald-500", SUSPENDED: "bg-red-500", INACTIVE: "bg-gray-400",
};

const SOURCE_OPTIONS = ["DIRECT", "GOOGLE", "LINKEDIN", "TWITTER", "REFERRAL", "OTHER"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
    const { can, isLoading: privLoading } = usePrivilege();
    const { success: toastSuccess, error: toastError } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [users, setUsers] = useState<UserData[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [modal, setModal] = useState<ModalType>(null);
    const [selected, setSelected] = useState<UserData | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const token = getStoredToken();
    const canRead   = !privLoading && can("GET",    "/api/v1/private/users");
    const canCreate = !privLoading && can("POST",   "/api/v1/private/users");
    const canUpdate = !privLoading && can("PUT",    "/api/v1/private/users");
    const canDelete = !privLoading && can("DELETE", "/api/v1/private/users");

    const authHeader = { Authorization: `Bearer ${token}` } as const;

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                fetch("/api/v1/private/users",           { headers: authHeader }),
                fetch("/api/v1/private/roles",           { headers: authHeader }),
            ]);
            const [usersJson, rolesJson] = await Promise.all([usersRes.json(), rolesRes.json()]);
            if (usersRes.ok) setUsers(usersJson.users ?? []);
            if (rolesRes.ok) setRoles(rolesJson.roles ?? []);
        } catch { toastError("Failed to load data"); }
        finally { setIsLoading(false); }
    }, [token]);

    useEffect(() => { if (!privLoading && canRead) fetchData(); else if (!privLoading) setIsLoading(false); }, [privLoading, canRead, fetchData]);

    const openNew = () => {
        setSelected(null);
        setForm({ ...EMPTY_FORM, role: roles[0]?._id ?? "" });
        setModal("new");
    };
    const openEdit = (u: UserData) => {
        setSelected(u);
        setForm({ fullname: u.fullname, email: u.email, mobile: u.mobile, occupation: u.occupation, state: u.state, country: u.country, source: u.source, role: u.role, accountStatus: u.accountStatus });
        setModal("edit");
    };
    const closeModal = () => { setModal(null); setSelected(null); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const isEdit = modal === "edit";
        const payload = isEdit ? { id: selected!._id, ...form } : form;
        // Don't send email/mobile when editing (not updatable)
        if (isEdit) { delete (payload as any).email; delete (payload as any).mobile; }
        try {
            const res = await fetch("/api/v1/private/users", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", ...authHeader },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) { toastSuccess(isEdit ? "User updated!" : "User created!"); closeModal(); fetchData(); }
            else toastError(data.message ?? "Failed to save");
        } catch { toastError("Unexpected error"); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/private/users?id=${id}`, { method: "DELETE", headers: authHeader });
            const data = await res.json();
            if (res.ok) { toastSuccess("User deleted!"); setDeleteConfirmId(null); fetchData(); }
            else toastError(data.message ?? "Failed to delete");
        } catch { toastError("Unexpected error"); }
    };

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        return !q || u.fullname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
    });

    if (!privLoading && !canRead) return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4 px-4 animate-in fade-in duration-500">
            <div className="p-5 bg-red-100 rounded-2xl"><FiLock size={36} className="text-red-500" /></div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-sm">You don&apos;t have permission to view users.</p>
            </div>
        </div>
    );

    // ── Status counts ──
    const counts = { ACTIVE: 0, SUSPENDED: 0, INACTIVE: 0 };
    users.forEach((u) => { counts[u.accountStatus]++; });

    return (
        <div className="w-full mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0"><FiUsers className="text-emerald-600" size={20} /></div>
                        Users
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm ml-[calc(2rem+12px)]">Manage platform users and their access.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-[calc(2rem+12px)] sm:ml-0">
                    <button onClick={fetchData} disabled={isLoading} className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-40" title="Refresh">
                        <FiRefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    {canCreate && (
                        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-lg shadow-md shadow-emerald-600/25 transition-all">
                            <FiPlus size={15} /> New User
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total",     value: users.length,          color: "text-gray-500",    dot: "bg-gray-400" },
                    { label: "Active",    value: counts.ACTIVE,         color: "text-emerald-600", dot: "bg-emerald-500" },
                    { label: "Inactive",  value: counts.INACTIVE,       color: "text-gray-500",    dot: "bg-gray-400" },
                    { label: "Suspended", value: counts.SUSPENDED,      color: "text-red-600",     dot: "bg-red-500" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                        </div>
                        <p className={`text-3xl font-bold ${s.color}`}>{isLoading ? "—" : s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Table card ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="font-semibold text-gray-800 shrink-0">All Users</h2>
                    <input
                        type="search"
                        placeholder="Search by name, email or role…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:max-w-xs px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400"
                    />
                </div>

                {isLoading ? (
                    <div className="p-5 space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse flex gap-4 items-center p-4 rounded-xl border border-gray-100">
                                <div className="h-9 w-9 rounded-full bg-gray-200 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                                    <div className="h-3 w-1/4 rounded bg-gray-200" />
                                </div>
                                <div className="h-6 w-20 rounded-full bg-gray-200" />
                                <div className="h-6 w-16 rounded-full bg-gray-200" />
                                <div className="flex gap-1"><div className="h-8 w-8 rounded-lg bg-gray-200" /><div className="h-8 w-8 rounded-lg bg-gray-200" /></div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 gap-4">
                        <div className="p-5 bg-gray-100 rounded-2xl"><FiUsers size={32} className="text-gray-400" /></div>
                        <div className="text-center">
                            <p className="text-gray-700 font-semibold">{search ? "No users match your search" : "No users found"}</p>
                            <p className="text-gray-400 text-xs mt-1">{search ? "Try a different keyword." : "Create a new user to get started."}</p>
                        </div>
                        {!search && canCreate && (
                            <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all">
                                <FiPlus size={14} /> New User
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y divide-gray-100">
                            {filtered.map((u) => (
                                <div key={u._id} className="p-4 space-y-3 hover:bg-gray-50/60 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-xs font-bold shadow-sm">
                                                {u.fullname.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-gray-900 truncate">{u.fullname}</p>
                                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[u.accountStatus]}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[u.accountStatus]}`} />
                                            {u.accountStatus}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-1.5">
                                            <FiShield size={11} className="text-emerald-500 shrink-0" />
                                            <span className="text-gray-600 font-medium truncate">{u.role}</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-1.5">
                                            <FiPhone size={11} className="text-gray-400 shrink-0" />
                                            <span className="text-gray-600 font-medium truncate">{u.mobile}</span>
                                        </div>
                                    </div>
                                    {deleteConfirmId === u._id ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-red-600 font-medium flex-1">Delete this user?</span>
                                            <button onClick={() => handleDelete(u._id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"><FiCheck size={11} /> Yes</button>
                                            <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">No</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            {canUpdate && <button onClick={() => openEdit(u)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"><FiEdit2 size={13} /> Edit</button>}
                                            {canDelete && <button onClick={() => setDeleteConfirmId(u._id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"><FiTrash2 size={13} /> Delete</button>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {["User", "Email", "Mobile", "Role", "Status", "Source", "Joined", "Actions"].map((h) => (
                                            <th key={h} className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${h === "Actions" ? "text-right" : ""} ${["Mobile", "Source", "Joined"].includes(h) ? "hidden lg:table-cell" : ""}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((u) => (
                                        <tr key={u._id} className="hover:bg-gray-50/70 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 text-white text-[10px] font-bold shadow-sm">
                                                        {u.fullname.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">{u.fullname}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[160px]">
                                                <span className="truncate block">{u.email}</span>
                                            </td>
                                            <td className="hidden lg:table-cell px-5 py-3.5 text-sm text-gray-500 font-mono whitespace-nowrap">{u.mobile}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                                                    <FiShield size={9} />{u.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[u.accountStatus]}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[u.accountStatus]}`} />
                                                    {u.accountStatus}
                                                </span>
                                            </td>
                                            <td className="hidden lg:table-cell px-5 py-3.5 text-xs text-gray-400 font-medium">{u.source}</td>
                                            <td className="hidden lg:table-cell px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {deleteConfirmId === u._id ? (
                                                    <div className="flex items-center gap-1.5 justify-end">
                                                        <span className="text-xs text-red-600 font-medium hidden xl:inline whitespace-nowrap">Delete?</span>
                                                        <button onClick={() => handleDelete(u._id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"><FiCheck size={11} /> Yes</button>
                                                        <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">No</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1">
                                                        {canUpdate && <button onClick={() => openEdit(u)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit"><FiEdit2 size={15} /></button>}
                                                        {canDelete && <button onClick={() => setDeleteConfirmId(u._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><FiTrash2 size={15} /></button>}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* ── Modal ── */}
            {modal && (
                <UserModal
                    type={modal}
                    form={form}
                    setForm={setForm}
                    roles={roles}
                    onClose={closeModal}
                    onSubmit={handleSave}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
}

// ─── User Modal ───────────────────────────────────────────────────────────────

function UserModal({ type, form, setForm, roles, onClose, onSubmit, isSaving }: {
    type: "new" | "edit";
    form: typeof EMPTY_FORM;
    setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
    roles: RoleOption[];
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSaving: boolean;
}) {
    const isNew = type === "new";

    const inputCls = "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400";
    const selectCls = inputCls + " cursor-pointer";
    const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-base">
                        <div className="p-1.5 bg-emerald-100 rounded-lg"><FiUser size={14} className="text-emerald-600" /></div>
                        {isNew ? "Create New User" : "Edit User"}
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"><FiX size={17} /></button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 custom-scrollbar">

                        {/* Full name */}
                        <div className="space-y-1.5">
                            <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                            <div className="relative group">
                                <FiUser size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 pointer-events-none transition-colors" />
                                <input type="text" value={form.fullname} onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))} placeholder="John Doe" required className={inputCls.replace("px-3.5", "pl-9 pr-4")} />
                            </div>
                        </div>

                        {/* Email + Mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className={labelCls}>Email <span className="text-red-400">*</span>{!isNew && <span className="ml-1 text-[10px] font-normal text-gray-400 normal-case">(not editable)</span>}</label>
                                <div className="relative group">
                                    <FiMail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 pointer-events-none transition-colors" />
                                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@company.com" required={isNew} disabled={!isNew} className={inputCls.replace("px-3.5", "pl-9 pr-4")} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelCls}>Mobile <span className="text-red-400">*</span>{!isNew && <span className="ml-1 text-[10px] font-normal text-gray-400 normal-case">(not editable)</span>}</label>
                                <div className="relative group">
                                    <FiPhone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 pointer-events-none transition-colors" />
                                    <input type="tel" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="+91 99999 99999" required={isNew} disabled={!isNew} className={inputCls.replace("px-3.5", "pl-9 pr-4")} />
                                </div>
                            </div>
                        </div>

                        {/* Role + Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className={labelCls}>Role <span className="text-red-400">*</span></label>
                                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required className={selectCls}>
                                    <option value="" disabled>Select a role…</option>
                                    {roles.map(r => <option key={r._id} value={r._id}>{r._id}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelCls}>Account Status</label>
                                <select value={form.accountStatus} onChange={e => setForm(f => ({ ...f, accountStatus: e.target.value as AccountStatus }))} className={selectCls}>
                                    {(["ACTIVE", "INACTIVE", "SUSPENDED"] as AccountStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Occupation + Source */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className={labelCls}>Occupation <span className="text-red-400">*</span></label>
                                <input type="text" value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} placeholder="Software Engineer" required className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelCls}>Source</label>
                                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className={selectCls}>
                                    {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* State + Country */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className={labelCls}>State <span className="text-red-400">*</span></label>
                                <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="Telangana" required className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelCls}>Country <span className="text-red-400">*</span></label>
                                <input type="text" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="India" required className={inputCls} />
                            </div>
                        </div>
                    </div>

                    <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
                        <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={14} />}
                            {isNew ? "Create User" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
