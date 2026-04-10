"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    FiKey, FiPlus, FiEdit2, FiTrash2, FiRefreshCw,
    FiX, FiSave, FiLock, FiCheck, FiSearch,
    FiChevronLeft, FiChevronRight,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";
import { usePrivilege } from "@/app/utils/usePrivilege";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrivilegeData {
    _id: string;
    name: string;
    apiPath: string;
    method: string;
    createdAt: string;
}

type ModalType = "new" | "edit" | null;

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = typeof METHODS[number];

const METHOD_STYLES: Record<string, string> = {
    GET:    "bg-blue-100 text-blue-700 border-blue-200",
    POST:   "bg-emerald-100 text-emerald-700 border-emerald-200",
    PUT:    "bg-amber-100 text-amber-700 border-amber-200",
    PATCH:  "bg-purple-100 text-purple-700 border-purple-200",
    DELETE: "bg-red-100 text-red-700 border-red-200",
};

const EMPTY_FORM = { name: "", apiPath: "", method: "GET" as Method };
const PAGE_SIZE = 10;
const METHOD_ORDER = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function resourceLabel(apiPath: string): string {
    const seg = apiPath.split("/").pop() ?? apiPath;
    return seg.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrivilegesPage() {
    const { can, isLoading: privLoading } = usePrivilege();
    const { success: toastSuccess, error: toastError } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [privileges, setPrivileges] = useState<PrivilegeData[]>([]);
    const [modal, setModal] = useState<ModalType>(null);
    const [selected, setSelected] = useState<PrivilegeData | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const token = getStoredToken();
    const canRead   = !privLoading && can("GET",    "/api/v1/private/privileges");
    const canCreate = !privLoading && can("POST",   "/api/v1/private/privileges");
    const canUpdate = !privLoading && can("PUT",    "/api/v1/private/privileges");
    const canDelete = !privLoading && can("DELETE", "/api/v1/private/privileges");

    const authHeader = { Authorization: `Bearer ${token}` } as const;

    const fetchPrivileges = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/v1/private/privileges?all=true", { headers: authHeader });
            const data = await res.json();
            if (res.ok) setPrivileges(data.privileges ?? []);
            else toastError(data.message ?? "Failed to load privileges");
        } catch { toastError("Network error"); }
        finally { setIsLoading(false); }
    }, [token]);

    useEffect(() => {
        if (!privLoading && canRead) fetchPrivileges();
        else if (!privLoading) setIsLoading(false);
    }, [privLoading, canRead, fetchPrivileges]);

    // ── Filtered + paginated ──────────────────────────────────────────────────

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const base = !q ? privileges : privileges.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.apiPath.toLowerCase().includes(q) ||
            p.method.toLowerCase().includes(q)
        );
        // Sort: group by apiPath alphabetically, then by method order within each group
        return [...base].sort((a, b) => {
            if (a.apiPath !== b.apiPath) return a.apiPath.localeCompare(b.apiPath);
            return METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method);
        });
    }, [privileges, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Reset to page 1 when search changes
    useEffect(() => { setPage(1); }, [search]);

    // ── Stats ─────────────────────────────────────────────────────────────────

    const methodCounts = useMemo(() => {
        const counts: Record<string, number> = { GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0 };
        privileges.forEach(p => { counts[p.method] = (counts[p.method] ?? 0) + 1; });
        return counts;
    }, [privileges]);

    const uniquePaths = useMemo(() => new Set(privileges.map(p => p.apiPath)).size, [privileges]);

    // ── Modal helpers ─────────────────────────────────────────────────────────

    const openNew = () => {
        setSelected(null);
        setForm({ ...EMPTY_FORM });
        setModal("new");
    };

    const openEdit = (p: PrivilegeData) => {
        setSelected(p);
        setForm({ name: p.name, apiPath: p.apiPath, method: p.method as Method });
        setModal("edit");
    };

    const closeModal = () => { setModal(null); setSelected(null); };

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const isEdit = modal === "edit";
        try {
            const payload = isEdit
                ? { id: selected!._id, ...form }
                : form;

            const res = await fetch("/api/v1/private/privileges", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", ...authHeader },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                toastSuccess(isEdit ? "Privilege updated!" : "Privilege created!");
                closeModal();
                fetchPrivileges();
            } else toastError(data.message ?? "Failed to save");
        } catch { toastError("Unexpected error"); }
        finally { setIsSaving(false); }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/private/privileges?id=${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers: authHeader,
            });
            const data = await res.json();
            if (res.ok) { toastSuccess("Privilege deleted!"); setDeleteConfirmId(null); fetchPrivileges(); }
            else toastError(data.message ?? "Failed to delete");
        } catch { toastError("Unexpected error"); }
    };

    // ── Access denied ─────────────────────────────────────────────────────────

    if (!privLoading && !canRead) return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4 px-4 animate-in fade-in duration-500">
            <div className="p-5 bg-red-100 rounded-2xl"><FiLock size={36} className="text-red-500" /></div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-sm">You don&apos;t have permission to view privileges.</p>
            </div>
        </div>
    );

    return (
        <div className="w-full mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                            <FiKey className="text-emerald-600" size={20} />
                        </div>
                        Privileges
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm ml-[calc(2rem+12px)]">
                        Manage API access permissions assigned to roles.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-[calc(2rem+12px)] sm:ml-0">
                    <button
                        onClick={fetchPrivileges}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-40"
                        title="Refresh"
                    >
                        <FiRefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    {canCreate && (
                        <button
                            onClick={openNew}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-lg shadow-md shadow-emerald-600/25 transition-all"
                        >
                            <FiPlus size={15} /> New Privilege
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm sm:col-span-1 lg:col-span-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total</p>
                    <p className="text-3xl font-bold text-gray-700">{isLoading ? "—" : privileges.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Resources</p>
                    <p className="text-3xl font-bold text-gray-700">{isLoading ? "—" : uniquePaths}</p>
                </div>
                {METHODS.map((m) => (
                    <div key={m} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border mb-1 ${METHOD_STYLES[m]}`}>{m}</span>
                        <p className={`text-3xl font-bold ${m === "DELETE" ? "text-red-600" : m === "GET" ? "text-blue-600" : m === "POST" ? "text-emerald-600" : m === "PUT" ? "text-amber-600" : "text-purple-600"}`}>
                            {isLoading ? "—" : methodCounts[m] ?? 0}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Table card ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                {/* Search bar */}
                <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="font-semibold text-gray-800 shrink-0">
                        All Privileges
                        {!isLoading && filtered.length !== privileges.length && (
                            <span className="ml-2 text-xs font-normal text-gray-400">
                                ({filtered.length} of {privileges.length})
                            </span>
                        )}
                    </h2>
                    <div className="relative w-full sm:max-w-xs">
                        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="search"
                            placeholder="Search by name, path or method…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-5 space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="animate-pulse flex gap-4 items-center p-3.5 rounded-xl border border-gray-100">
                                <div className="h-6 w-14 rounded-full bg-gray-200 shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                                </div>
                                <div className="h-7 w-16 rounded-lg bg-gray-200" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 gap-4">
                        <div className="p-5 bg-gray-100 rounded-2xl"><FiKey size={32} className="text-gray-400" /></div>
                        <div className="text-center">
                            <p className="text-gray-700 font-semibold">{search ? "No privileges match your search" : "No privileges found"}</p>
                            <p className="text-gray-400 text-xs mt-1">{search ? "Try a different keyword." : "Run syncPrivileges or create one manually."}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="sm:hidden">
                            {paginated.map((p, idx) => {
                                const globalIdx = (currentPage - 1) * PAGE_SIZE + idx;
                                const prev = globalIdx > 0 ? filtered[globalIdx - 1] : null;
                                const isNewGroup = !prev || prev.apiPath !== p.apiPath;
                                const groupCount = filtered.filter(x => x.apiPath === p.apiPath).length;
                                return (
                                    <React.Fragment key={p._id}>
                                        {isNewGroup && (
                                            <div className="flex items-center gap-2.5 px-4 py-2 bg-gray-50 border-y border-gray-100">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 shrink-0">
                                                    <FiKey size={11} className="text-emerald-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-xs font-bold text-gray-700">{resourceLabel(p.apiPath)}</span>
                                                    <span className="ml-2 text-[10px] text-gray-400 font-mono">{p.apiPath}</span>
                                                </div>
                                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
                                                    {groupCount} op{groupCount !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        )}
                                        <div className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`shrink-0 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${METHOD_STYLES[p.method] ?? "bg-gray-100 text-gray-600"}`}>
                                                        {p.method}
                                                    </span>
                                                    <span className="text-sm font-semibold text-gray-900 truncate">{p.name}</span>
                                                </div>
                                                {deleteConfirmId === p._id ? (
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button onClick={() => handleDelete(p._id)} className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"><FiCheck size={10} /> Yes</button>
                                                        <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">No</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {canUpdate && <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><FiEdit2 size={13} /></button>}
                                                        {canDelete && <button onClick={() => setDeleteConfirmId(p._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><FiTrash2 size={13} /></button>}
                                                    </div>
                                                )}
                                            </div>
                                            {deleteConfirmId === p._id && (
                                                <p className="text-xs text-red-500 font-medium mt-1.5">Delete this privilege? It will be removed from all roles.</p>
                                            )}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {["Method", "Name", "API Path", "ID", "Created", "Actions"].map((h) => (
                                            <th
                                                key={h}
                                                className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap
                                                    ${h === "Actions" ? "text-right" : ""}
                                                    ${["ID", "Created"].includes(h) ? "hidden lg:table-cell" : ""}
                                                `}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map((p, idx) => {
                                        const globalIdx = (currentPage - 1) * PAGE_SIZE + idx;
                                        const prev = globalIdx > 0 ? filtered[globalIdx - 1] : null;
                                        const isNewGroup = !prev || prev.apiPath !== p.apiPath;
                                        const groupCount = filtered.filter(x => x.apiPath === p.apiPath).length;
                                        return (
                                            <React.Fragment key={p._id}>
                                                {isNewGroup && (
                                                    <tr className="bg-gray-50 border-y border-gray-200">
                                                        <td colSpan={6} className="px-5 py-2">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 shrink-0">
                                                                    <FiKey size={11} className="text-emerald-600" />
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-700">{resourceLabel(p.apiPath)}</span>
                                                                <span className="text-xs text-gray-400 font-mono">{p.apiPath}</span>
                                                                <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                                                                    {groupCount} operation{groupCount !== 1 ? "s" : ""}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                                    <td className="px-5 py-3 whitespace-nowrap">
                                                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${METHOD_STYLES[p.method] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                                            {p.method}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className="font-semibold text-gray-800 text-sm">{p.name}</span>
                                                    </td>
                                                    <td className="px-5 py-3 max-w-[240px]">
                                                        <span className="text-xs text-gray-500 font-mono truncate block">{p.apiPath}</span>
                                                    </td>
                                                    <td className="hidden lg:table-cell px-5 py-3 max-w-[200px]">
                                                        <span className="text-xs text-gray-400 font-mono truncate block">{p._id}</span>
                                                    </td>
                                                    <td className="hidden lg:table-cell px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                                                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {deleteConfirmId === p._id ? (
                                                            <div className="flex items-center gap-1.5 justify-end">
                                                                <span className="text-xs text-red-500 font-medium hidden xl:inline whitespace-nowrap">Delete?</span>
                                                                <button onClick={() => handleDelete(p._id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"><FiCheck size={11} /> Yes</button>
                                                                <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">No</button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-1">
                                                                {canUpdate && (
                                                                    <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit">
                                                                        <FiEdit2 size={15} />
                                                                    </button>
                                                                )}
                                                                {canDelete && (
                                                                    <button onClick={() => setDeleteConfirmId(p._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                                                        <FiTrash2 size={15} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination — always shown */}
                        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4">
                                <p className="text-xs text-gray-500">
                                    Showing{" "}
                                    <span className="font-semibold text-gray-700">
                                        {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}
                                    </span>{" "}
                                    of <span className="font-semibold text-gray-700">{filtered.length}</span>
                                    <span className="text-gray-400 ml-1">· {PAGE_SIZE} per page</span>
                                </p>
                                {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <FiChevronLeft size={16} />
                                    </button>

                                    {/* Page numbers */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                                        .reduce<(number | "…")[]>((acc, n, i, arr) => {
                                            if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push("…");
                                            acc.push(n);
                                            return acc;
                                        }, [])
                                        .map((n, i) =>
                                            n === "…" ? (
                                                <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-xs">…</span>
                                            ) : (
                                                <button
                                                    key={n}
                                                    onClick={() => setPage(n as number)}
                                                    className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === n ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"}`}
                                                >
                                                    {n}
                                                </button>
                                            )
                                        )
                                    }

                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <FiChevronRight size={16} />
                                    </button>
                                </div>
                                )}
                        </div>
                    </>
                )}
            </div>

            {/* ── Modal ── */}
            {modal && (
                <PrivilegeModal
                    type={modal}
                    form={form}
                    setForm={setForm}
                    onClose={closeModal}
                    onSubmit={handleSave}
                    isSaving={isSaving}
                    existingId={selected?._id}
                />
            )}
        </div>
    );
}

// ─── Privilege Modal ──────────────────────────────────────────────────────────

function PrivilegeModal({ type, form, setForm, onClose, onSubmit, isSaving, existingId }: {
    type: "new" | "edit";
    form: typeof EMPTY_FORM;
    setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSaving: boolean;
    existingId?: string;
}) {
    const isNew = type === "new";
    const previewId = `${form.method}:${form.apiPath.trim().toLowerCase()}`;

    const inputCls = "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all placeholder:text-gray-400";
    const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90dvh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-base">
                        <div className="p-1.5 bg-emerald-100 rounded-lg"><FiKey size={14} className="text-emerald-600" /></div>
                        {isNew ? "Create New Privilege" : "Edit Privilege"}
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <FiX size={17} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">

                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className={labelCls}>Display Name <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. View Users"
                                required
                                autoFocus
                                className={inputCls}
                            />
                        </div>

                        {/* Method + API Path */}
                        <div className="grid grid-cols-[120px_1fr] gap-3">
                            <div className="space-y-1.5">
                                <label className={labelCls}>Method <span className="text-red-400">*</span></label>
                                <select
                                    value={form.method}
                                    onChange={e => setForm(f => ({ ...f, method: e.target.value as Method }))}
                                    required
                                    className={inputCls + " cursor-pointer"}
                                >
                                    {METHODS.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelCls}>API Path <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={form.apiPath}
                                    onChange={e => setForm(f => ({ ...f, apiPath: e.target.value }))}
                                    placeholder="/api/v1/private/resource"
                                    required
                                    className={inputCls + " font-mono text-xs"}
                                />
                            </div>
                        </div>

                        {/* ID preview */}
                        {form.apiPath.trim() && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                <span className="text-xs text-gray-500 font-medium shrink-0">Generated ID:</span>
                                <code className={`text-xs font-mono truncate ${existingId && previewId !== existingId ? "text-amber-600" : "text-gray-700"}`}>
                                    {previewId}
                                </code>
                                {existingId && previewId !== existingId && (
                                    <span className="shrink-0 text-[10px] text-amber-600 font-medium bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                        ID changes
                                    </span>
                                )}
                            </div>
                        )}

                        {!isNew && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <span className="text-xs text-amber-700 leading-relaxed">
                                    Changing the method or API path will update the privilege ID and re-link all roles automatically.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isSaving
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <FiSave size={14} />
                            }
                            {isNew ? "Create Privilege" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
