"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    FiCpu, FiPlus, FiEdit2, FiTrash2, FiRefreshCw,
    FiX, FiSave, FiCheck, FiZap, FiLock, FiToggleLeft,
    FiToggleRight,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";
import { usePrivilege } from "@/app/utils/usePrivilege";

// ─── Types ────────────────────────────────────────────────────────────────────

type AiProvider = "openai" | "anthropic" | "google" | "mistral" | "groq" | "custom";

interface AiModelData {
    _id: string;
    provider: AiProvider;
    modelName: string;
    displayName: string;
    apiKey: string;
    baseUrl?: string;
    isActive: boolean;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

type ModalType = "new" | "edit" | null;

const EMPTY_FORM = {
    provider: "openai" as AiProvider,
    modelName: "",
    displayName: "",
    apiKey: "",
    baseUrl: "",
    description: "",
    isActive: false,
};

// ─── Provider meta ────────────────────────────────────────────────────────────

const PROVIDER_META: Record<AiProvider, { label: string; color: string; bg: string; border: string; models: string[] }> = {
    openai:    { label: "OpenAI",    color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"] },
    anthropic: { label: "Anthropic", color: "text-orange-700",  bg: "bg-orange-50",   border: "border-orange-200",  models: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001", "claude-3-5-sonnet-20241022"] },
    google:    { label: "Google",    color: "text-blue-700",    bg: "bg-blue-50",     border: "border-blue-200",    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro"] },
    mistral:   { label: "Mistral",   color: "text-purple-700",  bg: "bg-purple-50",   border: "border-purple-200",  models: ["mistral-large-latest", "mistral-small-latest", "open-mixtral-8x22b"] },
    groq:      { label: "Groq",      color: "text-cyan-700",    bg: "bg-cyan-50",     border: "border-cyan-200",    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"] },
    custom:    { label: "Custom",    color: "text-gray-700",    bg: "bg-gray-100",    border: "border-gray-200",    models: [] },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiModelsPage() {
    const { can, isLoading: privLoading } = usePrivilege();
    const { success: toastSuccess, error: toastError } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [models, setModels] = useState<AiModelData[]>([]);
    const [modal, setModal] = useState<ModalType>(null);
    const [selected, setSelected] = useState<AiModelData | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const token = getStoredToken();
    const canCreate = !privLoading && can("POST", "/api/v1/private/ai-models");
    const canUpdate = !privLoading && can("PUT", "/api/v1/private/ai-models");
    const canDelete = !privLoading && can("DELETE", "/api/v1/private/ai-models");
    const canRead   = !privLoading && can("GET",  "/api/v1/private/ai-models");

    const fetchModels = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/v1/private/ai-models", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) setModels(data.models ?? []);
            else toastError(data.message ?? "Failed to load models");
        } catch { toastError("Failed to load data"); }
        finally { setIsLoading(false); }
    }, [token]);

    useEffect(() => { if (!privLoading) fetchModels(); }, [privLoading, fetchModels]);

    const openNew = () => { setSelected(null); setForm({ ...EMPTY_FORM }); setModal("new"); };
    const openEdit = (m: AiModelData) => {
        setSelected(m);
        setForm({ provider: m.provider, modelName: m.modelName, displayName: m.displayName, apiKey: m.apiKey, baseUrl: m.baseUrl ?? "", description: m.description ?? "", isActive: m.isActive });
        setModal("edit");
    };
    const closeModal = () => { setModal(null); setSelected(null); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const isEdit = modal === "edit";
        const payload = isEdit ? { id: selected!._id, ...form } : form;
        try {
            const res = await fetch("/api/v1/private/ai-models", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) { toastSuccess(isEdit ? "Model updated!" : "Model created!"); closeModal(); fetchModels(); }
            else toastError(data.message ?? "Failed to save");
        } catch { toastError("Unexpected error"); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/private/ai-models?id=${id}`, {
                method: "DELETE", headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) { toastSuccess("Model deleted!"); setDeleteConfirmId(null); fetchModels(); }
            else toastError(data.message ?? "Failed to delete");
        } catch { toastError("Unexpected error"); }
    };

    const handleToggleActive = async (m: AiModelData) => {
        try {
            const res = await fetch("/api/v1/private/ai-models", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id: m._id, isActive: !m.isActive }),
            });
            const data = await res.json();
            if (res.ok) { toastSuccess(m.isActive ? "Model deactivated" : "Model set as active"); fetchModels(); }
            else toastError(data.message ?? "Failed to update");
        } catch { toastError("Unexpected error"); }
    };

    if (!privLoading && !canRead) return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4 px-4 animate-in fade-in duration-500">
            <div className="p-5 bg-red-100 rounded-2xl"><FiLock size={36} className="text-red-500" /></div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-sm">You don&apos;t have permission to view AI model configurations.</p>
            </div>
        </div>
    );

    const activeModel = models.find((m) => m.isActive);

    return (
        <div className="w-full mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0"><FiCpu className="text-emerald-600" size={20} /></div>
                        AI Model Configurations
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm ml-[calc(2rem+12px)]">Configure and manage AI provider integrations.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-[calc(2rem+12px)] sm:ml-0">
                    <button onClick={fetchModels} disabled={isLoading} className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-40" title="Refresh">
                        <FiRefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    {canCreate && (
                        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-lg shadow-md shadow-emerald-600/25 transition-all">
                            <FiPlus size={15} /> Add Model
                        </button>
                    )}
                </div>
            </div>

            {/* ── Active banner ── */}
            {!isLoading && activeModel && (
                <div className="flex items-center gap-3 p-4 bg-emerald-900 text-white rounded-2xl">
                    <div className="p-2 bg-emerald-700 rounded-xl shrink-0"><FiZap size={16} /></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{activeModel.displayName} <span className="text-emerald-300 font-normal">is currently active</span></p>
                        <p className="text-xs text-emerald-400 font-mono truncate">{activeModel.modelName} · {PROVIDER_META[activeModel.provider].label}</p>
                    </div>
                </div>
            )}

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    { label: "Total Models", value: isLoading ? "—" : models.length, color: "text-emerald-500", icon: <FiCpu size={14} /> },
                    { label: "Active", value: isLoading ? "—" : models.filter(m => m.isActive).length, color: "text-blue-500", icon: <FiZap size={14} /> },
                    { label: "Providers", value: isLoading ? "—" : new Set(models.map(m => m.provider)).size, color: "text-purple-500", icon: <FiCpu size={14} />, colSpan: true },
                ].map((s) => (
                    <div key={s.label} className={`bg-white rounded-2xl border border-gray-200 p-4 shadow-sm ${(s as any).colSpan ? "col-span-2 sm:col-span-1" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={s.color}>{s.icon}</span>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Table card ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">All Models</h2>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                        {isLoading ? "…" : `${models.length} model${models.length !== 1 ? "s" : ""}`}
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-5 space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse flex gap-4 items-center p-4 rounded-xl border border-gray-100">
                                <div className="h-9 w-9 rounded-xl bg-gray-200 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                                    <div className="h-3 w-1/4 rounded bg-gray-200" />
                                </div>
                                <div className="h-6 w-16 rounded-full bg-gray-200" />
                                <div className="flex gap-1"><div className="h-8 w-8 rounded-lg bg-gray-200" /><div className="h-8 w-8 rounded-lg bg-gray-200" /></div>
                            </div>
                        ))}
                    </div>
                ) : models.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 gap-4">
                        <div className="p-5 bg-gray-100 rounded-2xl"><FiCpu size={32} className="text-gray-400" /></div>
                        <div className="text-center">
                            <p className="text-gray-700 font-semibold">No AI models configured</p>
                            <p className="text-gray-400 text-xs mt-1">Add your first AI model to get started.</p>
                        </div>
                        {canCreate && (
                            <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all">
                                <FiPlus size={14} /> Add Model
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y divide-gray-100">
                            {models.map((m) => {
                                const meta = PROVIDER_META[m.provider];
                                return (
                                    <div key={m._id} className="p-4 space-y-3 hover:bg-gray-50/60 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold ${meta.bg} ${meta.color} ${meta.border}`}>
                                                    {meta.label}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm text-gray-900 truncate">{m.displayName}</p>
                                                    <p className="text-[11px] font-mono text-gray-400 truncate">{m.modelName}</p>
                                                </div>
                                            </div>
                                            {m.isActive && (
                                                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full">
                                                    <FiZap size={9} /> Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-2.5 grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <p className="text-gray-400 font-medium mb-0.5 uppercase tracking-tighter">API Key</p>
                                                <p className="text-gray-700 font-mono truncate">{m.apiKey}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 font-medium mb-0.5 uppercase tracking-tighter">Description</p>
                                                <p className="text-gray-700 font-semibold truncate">{m.description || "—"}</p>
                                            </div>
                                        </div>
                                        {deleteConfirmId === m._id ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-red-600 font-medium flex-1">Delete this model?</span>
                                                <button onClick={() => handleDelete(m._id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"><FiCheck size={11} /> Yes</button>
                                                <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">No</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                {canUpdate && (
                                                    <button onClick={() => handleToggleActive(m)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${m.isActive ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                                                        {m.isActive ? <FiToggleRight size={13} /> : <FiToggleLeft size={13} />}
                                                        {m.isActive ? "Deactivate" : "Set Active"}
                                                    </button>
                                                )}
                                                {canUpdate && <button onClick={() => openEdit(m)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"><FiEdit2 size={13} /> Edit</button>}
                                                {canDelete && <button onClick={() => setDeleteConfirmId(m._id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"><FiTrash2 size={13} /> Delete</button>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {["Provider", "Model", "API Key", "Description", "Status", "Actions"].map((h) => (
                                            <th key={h} className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {models.map((m) => {
                                        const meta = PROVIDER_META[m.provider];
                                        return (
                                            <tr key={m._id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-lg border text-xs font-bold ${meta.bg} ${meta.color} ${meta.border}`}>{meta.label}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900 text-sm">{m.displayName}</p>
                                                    <p className="text-xs font-mono text-gray-400 mt-0.5">{m.modelName}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-mono text-slate-500 text-xs truncate max-w-[140px]" title={m.apiKey}>{m.apiKey}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400 truncate max-w-[150px]">{m.description || "—"}</td>
                                                <td className="px-6 py-4">
                                                    {canUpdate ? (
                                                        <button onClick={() => handleToggleActive(m)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${m.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                                                            {m.isActive ? "Active" : "Inactive"}
                                                        </button>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                                                            {m.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {deleteConfirmId === m._id ? (
                                                        <div className="flex items-center gap-1.5 justify-end">
                                                            <span className="text-xs text-red-600 font-medium hidden md:inline">Confirm?</span>
                                                            <button onClick={() => handleDelete(m._id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"><FiCheck size={11} /> Yes</button>
                                                            <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">No</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1">
                                                            {canUpdate && <button onClick={() => openEdit(m)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit"><FiEdit2 size={15} /></button>}
                                                            {canDelete && <button onClick={() => setDeleteConfirmId(m._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><FiTrash2 size={15} /></button>}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* ── Modal ── */}
            {modal && (
                <AiModelModal
                    type={modal}
                    form={form}
                    setForm={setForm}
                    onClose={closeModal}
                    onSubmit={handleSave}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function AiModelModal({ type, form, setForm, onClose, onSubmit, isSaving }: {
    type: "new" | "edit";
    form: typeof EMPTY_FORM;
    setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSaving: boolean;
}) {
    const isNew = type === "new";
    const meta = PROVIDER_META[form.provider];
    const suggestedModels = meta.models;

    const field = (label: string, required = false, children: React.ReactNode) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                {label}{required && <span className="text-red-400">*</span>}
            </label>
            {children}
        </div>
    );

    const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
        <input {...props} className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all placeholder:text-gray-400" />
    );

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2.5">
                        <div className="p-1.5 bg-emerald-100 rounded-lg"><FiCpu size={14} className="text-emerald-600" /></div>
                        {isNew ? "Add AI Model" : "Edit AI Model"}
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"><FiX size={17} /></button>
                </div>
                <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 custom-scrollbar">

                        {/* Provider */}
                        {field("Provider", true,
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(PROVIDER_META) as AiProvider[]).map((p) => {
                                    const m = PROVIDER_META[p];
                                    const active = form.provider === p;
                                    return (
                                        <button key={p} type="button" onClick={() => setForm(f => ({ ...f, provider: p, modelName: "" }))}
                                            className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${active ? `${m.bg} ${m.color} ${m.border} shadow-sm` : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`}>
                                            {m.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Display name + Model name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {field("Display Name", true, input({ placeholder: "e.g. My GPT-4", value: form.displayName, onChange: e => setForm(f => ({ ...f, displayName: e.target.value })), required: true }))}
                            {field("Model ID", true,
                                <div className="space-y-1.5">
                                    <input
                                        list="model-suggestions"
                                        value={form.modelName}
                                        onChange={e => setForm(f => ({ ...f, modelName: e.target.value }))}
                                        placeholder="e.g. gpt-4o"
                                        required
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all placeholder:text-gray-400"
                                    />
                                    {suggestedModels.length > 0 && (
                                        <datalist id="model-suggestions">
                                            {suggestedModels.map(m => <option key={m} value={m} />)}
                                        </datalist>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* API Key */}
                        {field("API Key", isNew,
                            <div className="relative group">
                                <FiLock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 pointer-events-none transition-colors" />
                                <input
                                    type="password"
                                    value={form.apiKey}
                                    onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                                    required={isNew}
                                    placeholder="sk-..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all placeholder:text-gray-400"
                                />
                            </div>
                        )}

                        {/* Base URL (custom only or optional) */}
                        {field("Base URL", false, input({ placeholder: "https://api.openai.com/v1 (optional)", value: form.baseUrl, onChange: e => setForm(f => ({ ...f, baseUrl: e.target.value })) }))}


                        {/* Description */}
                        {field("Description", false,
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes about this model..."
                                rows={2} className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 resize-none transition-all placeholder:text-gray-400" />
                        )}

                        {/* Set as active */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Set as Active Model</p>
                                <p className="text-xs text-gray-400">This will deactivate any currently active model</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                            </label>
                        </div>
                    </div>

                    <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
                        <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={14} />}
                            {isNew ? "Create Model" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
