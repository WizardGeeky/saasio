"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    FiFolder, FiPlus, FiEdit2, FiTrash2, FiRefreshCw,
    FiX, FiSave, FiCheck, FiLock, FiChevronDown, FiChevronUp,
    FiDollarSign, FiList, FiPackage,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";
import { usePrivilege } from "@/app/utils/usePrivilege";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

interface PaymentPlan {
    name: string;
    price: number;
    currency: string;
    descriptions: string[];
}

interface ProjectData {
    _id: string;
    name: string;
    status: ProjectStatus;
    plans: PaymentPlan[];
    createdAt: string;
    updatedAt: string;
}

type ModalType = "new" | "edit" | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ProjectStatus, string> = {
    ACTIVE:    "bg-emerald-100 text-emerald-700 border-emerald-200",
    INACTIVE:  "bg-gray-100 text-gray-500 border-gray-200",
    SUSPENDED: "bg-red-100 text-red-700 border-red-200",
};
const STATUS_DOT: Record<ProjectStatus, string> = {
    ACTIVE: "bg-emerald-500", INACTIVE: "bg-gray-400", SUSPENDED: "bg-red-500",
};
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

const defaultPlan = (name: string): PaymentPlan => ({
    name, price: 0, currency: "INR", descriptions: [""],
});

const emptyForm = () => ({
    name:   "",
    status: "INACTIVE" as ProjectStatus,
    plans:  [defaultPlan("Basic"), defaultPlan("Standard"), defaultPlan("Premium")],
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
    const { can, isLoading: privLoading } = usePrivilege();
    const { success: toastSuccess, error: toastError } = useToast();

    const [projects, setProjects]         = useState<ProjectData[]>([]);
    const [isLoading, setIsLoading]       = useState(true);
    const [isSaving, setIsSaving]         = useState(false);
    const [modal, setModal]               = useState<ModalType>(null);
    const [selected, setSelected]         = useState<ProjectData | null>(null);
    const [form, setForm]                 = useState(emptyForm());
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [expandedProject, setExpandedProject] = useState<string | null>(null);

    const token      = getStoredToken();
    const auth       = { Authorization: `Bearer ${token}` } as const;
    const canRead    = !privLoading && can("GET",    "/api/v1/private/projects");
    const canCreate  = !privLoading && can("POST",   "/api/v1/private/projects");
    const canUpdate  = !privLoading && can("PUT",    "/api/v1/private/projects");
    const canDelete  = !privLoading && can("DELETE", "/api/v1/private/projects");

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const res  = await fetch("/api/v1/private/projects", { headers: auth });
            const data = await res.json();
            if (res.ok) setProjects(data.projects ?? []);
            else toastError(data.message ?? "Failed to load");
        } catch { toastError("Network error"); }
        finally { setIsLoading(false); }
    }, [token]);

    useEffect(() => {
        if (!privLoading && canRead) fetchProjects();
        else if (!privLoading) setIsLoading(false);
    }, [privLoading, canRead, fetchProjects]);

    // ── Modal helpers ─────────────────────────────────────────────────────────

    const openNew = () => { setSelected(null); setForm(emptyForm()); setModal("new"); };

    const openEdit = (p: ProjectData) => {
        setSelected(p);
        setForm({
            name:   p.name,
            status: p.status,
            plans:  p.plans.map(pl => ({
                ...pl,
                descriptions: pl.descriptions.length ? pl.descriptions : [""],
            })),
        });
        setModal("edit");
    };

    const closeModal = () => { setModal(null); setSelected(null); };

    // ── Plan helpers ──────────────────────────────────────────────────────────

    const setPlan = (idx: number, field: keyof PaymentPlan, value: any) =>
        setForm(f => {
            const plans = f.plans.map((p, i) => i === idx ? { ...p, [field]: value } : p);
            return { ...f, plans };
        });

    const setDesc = (planIdx: number, descIdx: number, value: string) =>
        setForm(f => {
            const plans = f.plans.map((p, i) => {
                if (i !== planIdx) return p;
                const descriptions = p.descriptions.map((d, j) => j === descIdx ? value : d);
                return { ...p, descriptions };
            });
            return { ...f, plans };
        });

    const addDesc = (planIdx: number) =>
        setForm(f => {
            const plans = f.plans.map((p, i) =>
                i === planIdx ? { ...p, descriptions: [...p.descriptions, ""] } : p
            );
            return { ...f, plans };
        });

    const removeDesc = (planIdx: number, descIdx: number) =>
        setForm(f => {
            const plans = f.plans.map((p, i) => {
                if (i !== planIdx) return p;
                const descriptions = p.descriptions.filter((_, j) => j !== descIdx);
                return { ...p, descriptions: descriptions.length ? descriptions : [""] };
            });
            return { ...f, plans };
        });

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const isEdit = modal === "edit";
        const payload = isEdit
            ? { id: selected!._id, ...form, plans: form.plans.map(p => ({ ...p, descriptions: p.descriptions.filter(d => d.trim()) })) }
            : { ...form, plans: form.plans.map(p => ({ ...p, descriptions: p.descriptions.filter(d => d.trim()) })) };
        try {
            const res  = await fetch("/api/v1/private/projects", {
                method:  isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", ...auth },
                body:    JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) { toastSuccess(isEdit ? "Project updated!" : "Project created!"); closeModal(); fetchProjects(); }
            else toastError(data.message ?? "Failed to save");
        } catch { toastError("Unexpected error"); }
        finally { setIsSaving(false); }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        try {
            const res  = await fetch(`/api/v1/private/projects?id=${id}`, { method: "DELETE", headers: auth });
            const data = await res.json();
            if (res.ok) { toastSuccess("Project deleted!"); setDeleteConfirmId(null); fetchProjects(); }
            else toastError(data.message ?? "Failed to delete");
        } catch { toastError("Unexpected error"); }
    };

    // ── Stats ─────────────────────────────────────────────────────────────────

    const counts = { ACTIVE: 0, INACTIVE: 0, SUSPENDED: 0 };
    projects.forEach(p => { counts[p.status]++; });

    // ── Access denied ─────────────────────────────────────────────────────────

    if (!privLoading && !canRead) return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4 animate-in fade-in duration-500">
            <div className="p-5 bg-red-100 rounded-2xl"><FiLock size={36} className="text-red-500" /></div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 text-sm mt-1">You don&apos;t have permission to view projects.</p>
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
                            <FiFolder className="text-emerald-600" size={20} />
                        </div>
                        Projects
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm ml-[calc(2rem+12px)]">
                        Manage projects and their payment plans.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-[calc(2rem+12px)] sm:ml-0">
                    <button onClick={fetchProjects} disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-40" title="Refresh">
                        <FiRefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    {canCreate && (
                        <button onClick={openNew}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-lg shadow-md shadow-emerald-600/25 transition-all">
                            <FiPlus size={15} /> New Project
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total",     value: projects.length,  color: "text-gray-700",    dot: "bg-gray-400" },
                    { label: "Active",    value: counts.ACTIVE,    color: "text-emerald-600", dot: "bg-emerald-500" },
                    { label: "Inactive",  value: counts.INACTIVE,  color: "text-gray-500",    dot: "bg-gray-400" },
                    { label: "Suspended", value: counts.SUSPENDED, color: "text-red-600",     dot: "bg-red-500" },
                ].map(s => (
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
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">All Projects</h2>
                </div>

                {isLoading ? (
                    <div className="p-5 space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse flex gap-4 items-center p-4 rounded-xl border border-gray-100">
                                <div className="h-9 w-9 rounded-xl bg-gray-200 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                                    <div className="h-3 w-1/5 rounded bg-gray-200" />
                                </div>
                                <div className="h-6 w-20 rounded-full bg-gray-200" />
                                <div className="flex gap-1"><div className="h-8 w-8 rounded-lg bg-gray-200" /><div className="h-8 w-8 rounded-lg bg-gray-200" /></div>
                            </div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="p-5 bg-gray-100 rounded-2xl"><FiFolder size={32} className="text-gray-400" /></div>
                        <div className="text-center">
                            <p className="text-gray-700 font-semibold">No projects yet</p>
                            <p className="text-gray-400 text-xs mt-1">Create your first project to get started.</p>
                        </div>
                        {canCreate && (
                            <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all">
                                <FiPlus size={14} /> New Project
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y divide-gray-100">
                            {projects.map(p => (
                                <div key={p._id} className="p-4 space-y-3 hover:bg-gray-50/60 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                                                <FiFolder size={16} className="text-emerald-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-gray-900 truncate">{p._id}</p>
                                                <p className="text-xs text-gray-400 truncate">{p.name}</p>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[p.status]}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status]}`} />
                                            {p.status}
                                        </span>
                                    </div>

                                    {/* Plan pills */}
                                    <div className="flex gap-1.5 flex-wrap">
                                        {p.plans.map((pl, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                                                <FiPackage size={8} /> {pl.name} · {pl.currency} {pl.price.toLocaleString()}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Expand plans */}
                                    <button onClick={() => setExpandedProject(expandedProject === p._id ? null : p._id)}
                                        className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                        {expandedProject === p._id ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                                        {expandedProject === p._id ? "Hide plans" : "View plans"}
                                    </button>

                                    {expandedProject === p._id && (
                                        <div className="space-y-2">
                                            {p.plans.map((pl, i) => (
                                                <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                                                    <p className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                                        <FiPackage size={10} className="text-emerald-500" /> {pl.name}
                                                        <span className="ml-auto font-semibold text-emerald-600">{pl.currency} {pl.price.toLocaleString()}</span>
                                                    </p>
                                                    <ul className="space-y-1">
                                                        {pl.descriptions.map((d, j) => (
                                                            <li key={j} className="flex items-start gap-1.5 text-xs text-gray-500">
                                                                <FiCheck size={10} className="text-emerald-500 mt-0.5 shrink-0" /> {d}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {deleteConfirmId === p._id ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-red-600 font-medium flex-1">Delete this project?</span>
                                            <button onClick={() => handleDelete(p._id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"><FiCheck size={11} /> Yes</button>
                                            <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">No</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            {canUpdate && <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"><FiEdit2 size={13} /> Edit</button>}
                                            {canDelete && <button onClick={() => setDeleteConfirmId(p._id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"><FiTrash2 size={13} /> Delete</button>}
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
                                        {["Project", "Plans", "Status", "Created", "Actions"].map(h => (
                                            <th key={h} className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${h === "Actions" ? "text-right" : ""} ${h === "Created" ? "hidden lg:table-cell" : ""}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {projects.map(p => (
                                        <React.Fragment key={p._id}>
                                            <tr className="hover:bg-gray-50/70 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                                                            <FiFolder size={15} className="text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{p._id}</p>
                                                            <p className="text-xs text-gray-400">{p.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex gap-1.5">
                                                            {p.plans.map((pl, i) => (
                                                                <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                    {pl.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => setExpandedProject(expandedProject === p._id ? null : p._id)}
                                                            className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                                                            title="View plan details">
                                                            {expandedProject === p._id ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[p.status]}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status]}`} />
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="hidden lg:table-cell px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                                                    {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {deleteConfirmId === p._id ? (
                                                        <div className="flex items-center gap-1.5 justify-end">
                                                            <span className="text-xs text-red-500 font-medium hidden xl:inline">Delete?</span>
                                                            <button onClick={() => handleDelete(p._id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"><FiCheck size={11} /> Yes</button>
                                                            <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">No</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1">
                                                            {canUpdate && <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit"><FiEdit2 size={15} /></button>}
                                                            {canDelete && <button onClick={() => setDeleteConfirmId(p._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><FiTrash2 size={15} /></button>}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Expanded plan details row */}
                                            {expandedProject === p._id && (
                                                <tr className="bg-gray-50/60">
                                                    <td colSpan={5} className="px-5 py-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            {p.plans.map((pl, i) => (
                                                                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                                                                            <FiPackage size={13} className="text-emerald-500" /> {pl.name}
                                                                        </span>
                                                                        <span className="text-sm font-bold text-emerald-600">
                                                                            {pl.currency} {pl.price.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <ul className="space-y-1.5">
                                                                        {pl.descriptions.length === 0
                                                                            ? <li className="text-xs text-gray-400 italic">No descriptions</li>
                                                                            : pl.descriptions.map((d, j) => (
                                                                                <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                                                                                    <FiCheck size={10} className="text-emerald-500 mt-0.5 shrink-0" /> {d}
                                                                                </li>
                                                                            ))
                                                                        }
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* ── Modal ── */}
            {modal && (
                <ProjectModal
                    type={modal}
                    form={form}
                    setForm={setForm}
                    selectedId={selected?._id}
                    isSaving={isSaving}
                    onClose={closeModal}
                    onSubmit={handleSave}
                    setPlan={setPlan}
                    setDesc={setDesc}
                    addDesc={addDesc}
                    removeDesc={removeDesc}
                />
            )}
        </div>
    );
}

// ─── Project Modal ────────────────────────────────────────────────────────────

interface ModalProps {
    type: "new" | "edit";
    form: ReturnType<typeof emptyForm>;
    setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
    selectedId?: string;
    isSaving: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    setPlan: (idx: number, field: keyof PaymentPlan, value: any) => void;
    setDesc: (planIdx: number, descIdx: number, value: string) => void;
    addDesc: (planIdx: number) => void;
    removeDesc: (planIdx: number, descIdx: number) => void;
}

const PLAN_COLORS = [
    "border-blue-200 bg-blue-50",
    "border-emerald-200 bg-emerald-50",
    "border-purple-200 bg-purple-50",
];
const PLAN_BADGE = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-purple-100 text-purple-700",
];

function ProjectModal({ type, form, setForm, selectedId, isSaving, onClose, onSubmit, setPlan, setDesc, addDesc, removeDesc }: ModalProps) {
    const isNew = type === "new";
    const previewId = form.name.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

    const inputCls = "w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-gray-400";
    const [activePlan, setActivePlan] = useState(0);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[95dvh] sm:max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-base">
                        <div className="p-1.5 bg-emerald-100 rounded-lg"><FiFolder size={14} className="text-emerald-600" /></div>
                        {isNew ? "Create New Project" : `Edit — ${selectedId}`}
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"><FiX size={17} /></button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 custom-scrollbar">

                        {/* Project name + status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    Project Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    disabled={!isNew}
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. My SaaS App"
                                    className={inputCls + (!isNew ? " bg-gray-50 text-gray-400 cursor-not-allowed" : "")}
                                />
                                {isNew && previewId && (
                                    <p className="text-[10px] text-gray-400">
                                        ID: <code className="font-mono font-semibold text-gray-700">{previewId}</code>
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status</label>
                                <select
                                    value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
                                    className={inputCls + " cursor-pointer"}>
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                    <option value="SUSPENDED">SUSPENDED</option>
                                </select>
                            </div>
                        </div>

                        {/* Plan tabs */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FiList size={13} className="text-gray-500" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payment Plans</span>
                            </div>

                            {/* Tab switcher */}
                            <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
                                {form.plans.map((pl, i) => (
                                    <button key={i} type="button"
                                        onClick={() => setActivePlan(i)}
                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activePlan === i ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                                        {pl.name || `Plan ${i + 1}`}
                                    </button>
                                ))}
                            </div>

                            {/* Active plan editor */}
                            {form.plans.map((pl, i) => (
                                <div key={i} className={`${i !== activePlan ? "hidden" : ""} border rounded-2xl p-4 space-y-4 ${PLAN_COLORS[i]}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PLAN_BADGE[i]}`}>Plan {i + 1}</span>
                                    </div>

                                    {/* Plan name + price + currency */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Plan Name <span className="text-red-400">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                value={pl.name}
                                                onChange={e => setPlan(i, "name", e.target.value)}
                                                placeholder="Basic"
                                                className={inputCls}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                                <FiDollarSign size={9} /> Price <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min={0}
                                                value={pl.price}
                                                onChange={e => setPlan(i, "price", Number(e.target.value))}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Currency</label>
                                            <select
                                                value={pl.currency}
                                                onChange={e => setPlan(i, "currency", e.target.value)}
                                                className={inputCls + " cursor-pointer"}>
                                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Descriptions */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                                Features / Descriptions
                                            </label>
                                            <button type="button"
                                                onClick={() => addDesc(i)}
                                                className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-lg transition-all">
                                                <FiPlus size={9} /> Add
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {pl.descriptions.map((d, j) => (
                                                <div key={j} className="flex items-center gap-2">
                                                    <span className="text-emerald-500 shrink-0"><FiCheck size={11} /></span>
                                                    <input
                                                        type="text"
                                                        value={d}
                                                        onChange={e => setDesc(i, j, e.target.value)}
                                                        placeholder={`Feature ${j + 1}…`}
                                                        className={inputCls + " flex-1"}
                                                    />
                                                    {pl.descriptions.length > 1 && (
                                                        <button type="button"
                                                            onClick={() => removeDesc(i, j)}
                                                            className="p-1 text-gray-300 hover:text-red-500 transition-all shrink-0">
                                                            <FiX size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all">
                            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={14} />}
                            {isNew ? "Create Project" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
