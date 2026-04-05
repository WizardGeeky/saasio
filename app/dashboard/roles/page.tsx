"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    FiShield,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiRefreshCw,
    FiKey,
    FiX,
    FiSave,
    FiLock,
    FiCheck,
    FiChevronDown,
    FiChevronUp,
    FiAlertTriangle,
    FiUsers,
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
}

interface RoleData {
    _id: string;
    privileges: PrivilegeData[];
    createdAt: string;
    updatedAt: string;
}

type ModalType = "new" | "edit" | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_STYLES: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700 border-blue-200",
    POST: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PUT: "bg-amber-100 text-amber-700 border-amber-200",
    PATCH: "bg-purple-100 text-purple-700 border-purple-200",
    DELETE: "bg-red-100 text-red-700 border-red-200",
};

const METHOD_ORDER = ["GET", "POST", "PUT", "PATCH", "DELETE"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getResourceLabel(apiPath: string): string {
    const segment = apiPath.split("/").pop() ?? apiPath;
    return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function groupByPath(privileges: PrivilegeData[]): Record<string, PrivilegeData[]> {
    const groups: Record<string, PrivilegeData[]> = {};
    for (const p of privileges) {
        if (!groups[p.apiPath]) groups[p.apiPath] = [];
        groups[p.apiPath].push(p);
    }
    // Sort methods within each group by METHOD_ORDER
    for (const key of Object.keys(groups)) {
        groups[key].sort(
            (a, b) => METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method)
        );
    }
    return groups;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RolesPage() {
    const { can, isLoading: privLoading } = usePrivilege();
    const { success: toastSuccess, error: toastError } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [allPrivileges, setAllPrivileges] = useState<PrivilegeData[]>([]);
    const [modal, setModal] = useState<ModalType>(null);
    const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
    const [formName, setFormName] = useState("");
    const [selectedPrivs, setSelectedPrivs] = useState<Set<string>>(new Set());
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const token = getStoredToken();

    const canRead = !privLoading && can("GET", "/api/v1/private/roles");
    const canCreate = !privLoading && can("POST", "/api/v1/private/roles");
    const canUpdate = !privLoading && can("PUT", "/api/v1/private/roles");
    const canDelete = !privLoading && can("DELETE", "/api/v1/private/roles");

    // ── Data fetching ──────────────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [rolesRes, privsRes] = await Promise.all([
                fetch("/api/v1/private/roles", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch("/api/v1/private/privileges?all=true", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const [rolesJson, privsJson] = await Promise.all([
                rolesRes.json(),
                privsRes.json(),
            ]);

            if (rolesRes.ok) setRoles(rolesJson.roles ?? []);
            else toastError(rolesJson.message ?? "Failed to load roles");

            if (privsRes.ok) setAllPrivileges(privsJson.privileges ?? []);
        } catch {
            toastError("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!privLoading && canRead) fetchData();
        else if (!privLoading) setIsLoading(false);
    }, [privLoading, canRead, fetchData]);

    // ── Modal helpers ──────────────────────────────────────────────────────────

    const openNew = () => {
        setSelectedRole(null);
        setFormName("");
        setSelectedPrivs(new Set());
        setModal("new");
    };

    const openEdit = (role: RoleData) => {
        setSelectedRole(role);
        setFormName(role._id);
        setSelectedPrivs(new Set(role.privileges.map((p) => p._id)));
        setModal("edit");
    };

    const closeModal = () => {
        setModal(null);
        setSelectedRole(null);
        setFormName("");
        setSelectedPrivs(new Set());
    };

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const isEdit = modal === "edit";
        const payload = isEdit
            ? { id: selectedRole!._id, privileges: Array.from(selectedPrivs) }
            : { name: formName, privileges: Array.from(selectedPrivs) };

        try {
            const res = await fetch("/api/v1/private/roles", {
                method: isEdit ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                toastSuccess(isEdit ? "Role updated successfully!" : "Role created successfully!");
                closeModal();
                fetchData();
            } else {
                toastError(data.message ?? "Failed to save role");
            }
        } catch {
            toastError("An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/private/roles?id=${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                toastSuccess("Role deleted successfully!");
                setDeleteConfirmId(null);
                fetchData();
            } else {
                toastError(data.message ?? "Failed to delete role");
            }
        } catch {
            toastError("An unexpected error occurred");
        }
    };

    // ── Privilege selection ────────────────────────────────────────────────────

    const togglePriv = (id: string) => {
        setSelectedPrivs((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleGroup = (groupItems: PrivilegeData[]) => {
        const allSelected = groupItems.every((p) => selectedPrivs.has(p._id));
        setSelectedPrivs((prev) => {
            const next = new Set(prev);
            groupItems.forEach((p) => (allSelected ? next.delete(p._id) : next.add(p._id)));
            return next;
        });
    };

    const selectAll = () => setSelectedPrivs(new Set(allPrivileges.map((p) => p._id)));
    const clearAll = () => setSelectedPrivs(new Set());

    const groupedPrivileges = useMemo(() => groupByPath(allPrivileges), [allPrivileges]);

    // ─── Access denied ────────────────────────────────────────────────────────

    if (!privLoading && !canRead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4 px-4 animate-in fade-in duration-500">
                <div className="p-5 bg-red-100 rounded-2xl">
                    <FiLock size={36} className="text-red-500" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
                    <p className="text-gray-500 text-sm mt-1 max-w-sm">
                        You don&apos;t have permission to view roles. Contact your administrator to request access.
                    </p>
                </div>
            </div>
        );
    }

    // ─── Page ─────────────────────────────────────────────────────────────────

    return (
        <div className="w-full mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                            <FiShield className="text-emerald-600" size={20} />
                        </div>
                        Roles &amp; Permissions
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm ml-[calc(2rem+12px)]">
                        Manage roles and assign privileges to control access across the platform.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-[calc(2rem+12px)] sm:ml-0">
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                        title="Refresh"
                    >
                        <FiRefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    {canCreate && (
                        <button
                            onClick={openNew}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-lg shadow-md shadow-emerald-600/25 transition-all"
                        >
                            <FiPlus size={15} />
                            New Role
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <FiShield size={14} className="text-emerald-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Roles</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{isLoading ? "—" : roles.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <FiKey size={14} className="text-blue-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Privileges</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{isLoading ? "—" : allPrivileges.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                        <FiUsers size={14} className="text-purple-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resources</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        {isLoading ? "—" : Object.keys(groupedPrivileges).length}
                    </p>
                </div>
            </div>

            {/* ── Roles Table ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        All Roles
                    </h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                        {roles.length} role{roles.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                        <p className="text-gray-400 text-sm animate-pulse">Loading roles…</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Role
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Privileges
                                    </th>
                                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Created
                                    </th>
                                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Last Updated
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {roles.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-gray-100 rounded-2xl">
                                                    <FiShield size={28} className="text-gray-400" />
                                                </div>
                                                <p className="text-gray-700 font-semibold">No roles found</p>
                                                <p className="text-gray-400 text-xs">
                                                    Create your first role to start managing access.
                                                </p>
                                                {canCreate && (
                                                    <button
                                                        onClick={openNew}
                                                        className="mt-1 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-600/20 transition-all"
                                                    >
                                                        <FiPlus size={14} /> New Role
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    roles.map((role) => (
                                        <tr
                                            key={role._id}
                                            className="hover:bg-gray-50/70 transition-colors group"
                                        >
                                            {/* Role name */}
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <div className="flex-shrink-0 p-1.5 bg-emerald-100 rounded-lg">
                                                        <FiShield size={12} className="text-emerald-600" />
                                                    </div>
                                                    <span className="font-semibold text-gray-900 text-sm font-mono tracking-wide">
                                                        {role._id}
                                                    </span>
                                                    {role._id === "SYSTEM_ADMIN" && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                                                            <FiLock size={9} />
                                                            Protected
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Privileges count */}
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold">
                                                        <FiKey size={10} />
                                                        {role.privileges.length}
                                                        <span className="hidden sm:inline">
                                                            {" "}privilege{role.privileges.length !== 1 ? "s" : ""}
                                                        </span>
                                                    </span>
                                                    {role.privileges.length === allPrivileges.length &&
                                                        allPrivileges.length > 0 && (
                                                            <span className="hidden sm:inline text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                                                                Full access
                                                            </span>
                                                        )}
                                                </div>
                                            </td>

                                            {/* Created */}
                                            <td className="hidden lg:table-cell px-6 py-4 text-gray-500 text-xs">
                                                {new Date(role.createdAt).toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            {/* Updated */}
                                            <td className="hidden md:table-cell px-6 py-4 text-gray-500 text-xs">
                                                {new Date(role.updatedAt).toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 sm:px-6 py-4">
                                                {deleteConfirmId === role._id ? (
                                                    <div className="flex items-center gap-1.5 justify-end flex-wrap">
                                                        <span className="text-xs text-red-600 font-medium hidden sm:inline whitespace-nowrap">
                                                            Confirm delete?
                                                        </span>
                                                        <button
                                                            onClick={() => handleDelete(role._id)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"
                                                        >
                                                            <FiCheck size={11} /> Yes
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmId(null)}
                                                            className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1">
                                                        {canUpdate && (
                                                            <button
                                                                onClick={() => openEdit(role)}
                                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                                title="Edit privileges"
                                                            >
                                                                <FiEdit2 size={14} />
                                                            </button>
                                                        )}
                                                        {canDelete && role._id !== "SYSTEM_ADMIN" && (
                                                            <button
                                                                onClick={() => {
                                                                    setDeleteConfirmId(role._id);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Delete role"
                                                            >
                                                                <FiTrash2 size={14} />
                                                            </button>
                                                        )}
                                                        {!canUpdate && !canDelete && (
                                                            <span className="text-xs text-gray-300">—</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Security Notice ── */}
            <div className="p-5 bg-emerald-900 text-white rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <FiShield size={70} />
                </div>
                <p className="text-sm text-emerald-100 relative z-10 leading-relaxed max-w-2xl">
                    <span className="font-bold text-white">Access Control Notice:</span>{" "}
                    Roles define what each user can see and do. Assigning a privilege grants access to that API
                    endpoint and its corresponding UI. The{" "}
                    <span className="font-semibold text-amber-300">SYSTEM_ADMIN</span> role is protected and
                    always has full access.
                </p>
            </div>

            {/* ── Modal ── */}
            {modal && (
                <RoleModal
                    type={modal}
                    formName={formName}
                    setFormName={setFormName}
                    selectedPrivs={selectedPrivs}
                    togglePriv={togglePriv}
                    toggleGroup={toggleGroup}
                    selectAll={selectAll}
                    clearAll={clearAll}
                    groupedPrivileges={groupedPrivileges}
                    allPrivileges={allPrivileges}
                    onClose={closeModal}
                    onSubmit={handleSave}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
}

// ─── Role Modal ───────────────────────────────────────────────────────────────

interface RoleModalProps {
    type: "new" | "edit";
    formName: string;
    setFormName: (v: string) => void;
    selectedPrivs: Set<string>;
    togglePriv: (id: string) => void;
    toggleGroup: (items: PrivilegeData[]) => void;
    selectAll: () => void;
    clearAll: () => void;
    groupedPrivileges: Record<string, PrivilegeData[]>;
    allPrivileges: PrivilegeData[];
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isSaving: boolean;
}

function RoleModal({
    type,
    formName,
    setFormName,
    selectedPrivs,
    togglePriv,
    toggleGroup,
    selectAll,
    clearAll,
    groupedPrivileges,
    allPrivileges,
    onClose,
    onSubmit,
    isSaving,
}: RoleModalProps) {
    const isNew = type === "new";
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(Object.keys(groupedPrivileges))
    );

    const toggleExpand = (path: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            next.has(path) ? next.delete(path) : next.add(path);
            return next;
        });
    };

    const allSelected = allPrivileges.length > 0 && allPrivileges.every((p) => selectedPrivs.has(p._id));
    const someSelected = allPrivileges.some((p) => selectedPrivs.has(p._id));

    const previewName = isNew
        ? formName.trim().toUpperCase().replace(/\s+/g, "_") || "ROLE_NAME"
        : formName;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col max-h-[92dvh] sm:max-h-[88vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-base">
                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <FiShield size={14} className="text-emerald-600" />
                        </div>
                        {isNew ? "Create New Role" : `Edit Role — ${formName}`}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <FiX size={17} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 custom-scrollbar">

                        {/* Role name (new only) */}
                        {isNew && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Role Name
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all placeholder:text-gray-400 font-mono tracking-wide"
                                    placeholder="e.g. VIEWER or Support Manager"
                                    required
                                    autoFocus
                                />
                                {formName.trim() && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                        <span className="text-gray-400">Stored as:</span>
                                        <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                            {previewName}
                                        </span>
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Privilege picker */}
                        <div className="space-y-3">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Assign Privileges
                                    </label>
                                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                        {selectedPrivs.size} / {allPrivileges.length}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={allSelected ? clearAll : selectAll}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                            allSelected
                                                ? "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                                                : "bg-emerald-600 text-white border-transparent hover:bg-emerald-700 shadow-sm"
                                        }`}
                                    >
                                        {allSelected ? (
                                            <>Clear All</>
                                        ) : (
                                            <>
                                                <FiCheck size={11} /> Select All
                                            </>
                                        )}
                                    </button>
                                    {someSelected && !allSelected && (
                                        <button
                                            type="button"
                                            onClick={clearAll}
                                            className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Privilege groups */}
                            {Object.keys(groupedPrivileges).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2 bg-gray-50 rounded-xl border border-gray-200">
                                    <FiKey size={22} className="text-gray-300" />
                                    <p className="text-xs text-gray-400">No privileges available</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(groupedPrivileges).map(([path, items]) => {
                                        const isExpanded = expandedGroups.has(path);
                                        const allGroupSelected = items.every((p) => selectedPrivs.has(p._id));
                                        const someGroupSelected = items.some((p) => selectedPrivs.has(p._id));
                                        const label = getResourceLabel(path);

                                        return (
                                            <div
                                                key={path}
                                                className="border border-gray-200 rounded-xl overflow-hidden"
                                            >
                                                {/* Group header */}
                                                <div
                                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${
                                                        allGroupSelected
                                                            ? "bg-emerald-50 border-b border-emerald-100"
                                                            : someGroupSelected
                                                            ? "bg-blue-50/50 border-b border-blue-100/50"
                                                            : "bg-gray-50 border-b border-gray-100"
                                                    }`}
                                                    onClick={() => toggleExpand(path)}
                                                >
                                                    {/* Group checkbox */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleGroup(items);
                                                        }}
                                                        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                                            allGroupSelected
                                                                ? "bg-emerald-500 border-emerald-500"
                                                                : someGroupSelected
                                                                ? "bg-blue-400 border-blue-400"
                                                                : "border-gray-300 bg-white hover:border-emerald-400"
                                                        }`}
                                                        title={allGroupSelected ? "Deselect all" : "Select all"}
                                                    >
                                                        {(allGroupSelected || someGroupSelected) && (
                                                            <FiCheck size={10} className="text-white" />
                                                        )}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-semibold text-gray-800">
                                                            {label}
                                                        </span>
                                                        <span className="ml-2 text-xs text-gray-400 font-mono hidden sm:inline">
                                                            {path.replace("/api/v1/private/", "")}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-xs text-gray-400">
                                                            {items.filter((p) => selectedPrivs.has(p._id)).length}/
                                                            {items.length}
                                                        </span>
                                                        {isExpanded ? (
                                                            <FiChevronUp size={14} className="text-gray-400" />
                                                        ) : (
                                                            <FiChevronDown size={14} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Group items */}
                                                {isExpanded && (
                                                    <div className="px-4 py-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {items.map((priv) => {
                                                            const checked = selectedPrivs.has(priv._id);
                                                            return (
                                                                <label
                                                                    key={priv._id}
                                                                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-all ${
                                                                        checked
                                                                            ? "bg-emerald-50 border-emerald-200"
                                                                            : "bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-gray-100"
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => togglePriv(priv._id)}
                                                                        className="sr-only"
                                                                    />
                                                                    <div
                                                                        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                                                            checked
                                                                                ? "bg-emerald-500 border-emerald-500"
                                                                                : "border-gray-300 bg-white"
                                                                        }`}
                                                                    >
                                                                        {checked && (
                                                                            <FiCheck size={10} className="text-white" />
                                                                        )}
                                                                    </div>
                                                                    <span
                                                                        className={`inline-flex items-center justify-center min-w-[52px] px-2 py-0.5 text-xs font-bold rounded-md border ${
                                                                            METHOD_STYLES[priv.method] ??
                                                                            "bg-gray-100 text-gray-700 border-gray-200"
                                                                        }`}
                                                                    >
                                                                        {priv.method}
                                                                    </span>
                                                                    <span className="text-xs text-gray-700 font-medium truncate">
                                                                        {priv.name}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Zero privileges warning */}
                            {selectedPrivs.size === 0 && allPrivileges.length > 0 && (
                                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <FiAlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        No privileges selected. This role will have no access to any protected
                                        resource.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <FiSave size={14} />
                            )}
                            {isNew ? "Create Role" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
