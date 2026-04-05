"use client";

import React, { useState, useEffect } from "react";
import {
    FiCreditCard, FiPlus, FiEye, FiEdit2, FiTrash2,
    FiRefreshCw, FiExternalLink, FiLock, FiCheckCircle,
    FiAlertCircle, FiX, FiSave, FiCheck, FiZap,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";

interface RazorpayConfigData {
    _id?: string;
    keyId: string;
    keySecret: string;
    webhookSecret?: string;
    environment: "TEST" | "LIVE";
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

type ModalType = "view" | "edit" | "new" | null;

const emptyForm: RazorpayConfigData = {
    keyId: "",
    keySecret: "",
    webhookSecret: "",
    environment: "TEST",
    isActive: true,
};

export default function RazorpayConfigPage() {
    const { success: toastSuccess, error: toastError } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState<RazorpayConfigData | null>(null);
    const [modal, setModal] = useState<ModalType>(null);
    const [formData, setFormData] = useState<RazorpayConfigData>(emptyForm);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const token = getStoredToken();

    useEffect(() => { fetchConfig(); }, []);

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/v1/private/rozarpay", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setConfig(data.success && data.data ? data.data : null);
        } catch {
            setConfig(null);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (type: ModalType, data?: RazorpayConfigData) => {
        if (type === "new") setFormData(emptyForm);
        else if (data) setFormData({ ...data, keySecret: "", webhookSecret: "" });
        setDeleteConfirm(false);
        setModal(type);
    };

    const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const isEdit = modal === "edit" && !!formData._id;
        const payload = isEdit ? { ...formData, id: formData._id } : formData;
        try {
            const res = await fetch("/api/v1/private/rozarpay", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                toastSuccess(isEdit ? "Configuration updated!" : "Configuration created!");
                setModal(null);
                fetchConfig();
            } else {
                toastError(data.message || "Failed to save configuration");
            }
        } catch {
            toastError("An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!config?._id) return;
        try {
            const res = await fetch(`/api/v1/private/rozarpay?id=${config._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                toastSuccess("Configuration deleted successfully");
                setConfig(null);
                setDeleteConfirm(false);
            } else {
                toastError(data.message || "Failed to delete configuration");
            }
        } catch {
            toastError("An unexpected error occurred");
        }
    };

    return (
        <div className="w-full mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                            <FiCreditCard className="text-emerald-600" size={20} />
                        </div>
                        Razorpay Integration
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm ml-[calc(2rem+12px)]">
                        Manage your payment gateway credentials and environment settings.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-[calc(2rem+12px)] sm:ml-0">
                    <button
                        onClick={fetchConfig}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-40"
                        title="Refresh"
                    >
                        <FiRefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <a
                        href="https://dashboard.razorpay.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-all"
                    >
                        <span className="hidden sm:inline">Razorpay Dashboard</span>
                        <FiExternalLink size={14} />
                    </a>
                    <button
                        onClick={() => openModal("new")}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-lg shadow-md shadow-emerald-600/25 transition-all"
                    >
                        <FiPlus size={15} />
                        <span>New Config</span>
                    </button>
                </div>
            </div>

            {/* ── Table card ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Gateway Configurations</h2>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                        {isLoading ? "…" : config ? "1 config" : "0 configs"}
                    </span>
                </div>

                {/* Loading skeleton */}
                {isLoading ? (
                    <div className="p-5 space-y-3">
                        {[...Array(1)].map((_, i) => (
                            <div key={i} className="animate-pulse flex gap-4 items-center p-4 rounded-xl border border-gray-100">
                                <div className="h-8 w-8 rounded-lg bg-gray-200 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-2/5 rounded bg-gray-200" />
                                    <div className="h-3 w-1/4 rounded bg-gray-200" />
                                </div>
                                <div className="h-6 w-16 rounded-full bg-gray-200" />
                                <div className="h-6 w-20 rounded-full bg-gray-200" />
                                <div className="flex gap-1">
                                    <div className="h-8 w-8 rounded-lg bg-gray-200" />
                                    <div className="h-8 w-8 rounded-lg bg-gray-200" />
                                    <div className="h-8 w-8 rounded-lg bg-gray-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !config ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-20 px-4 gap-4">
                        <div className="p-5 bg-gray-100 rounded-2xl">
                            <FiCreditCard size={32} className="text-gray-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-gray-700 font-semibold">No configuration found</p>
                            <p className="text-gray-400 text-xs mt-1">
                                Connect your Razorpay account to enable payment processing.
                            </p>
                        </div>
                        <button
                            onClick={() => openModal("new")}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                        >
                            <FiPlus size={14} /> Add Configuration
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ── Mobile card (< sm) ── */}
                        <div className="sm:hidden divide-y divide-gray-100">
                            <div className="p-4 space-y-3">
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="shrink-0 p-2 bg-emerald-100 rounded-lg">
                                            <FiCreditCard size={14} className="text-emerald-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 font-medium mb-0.5">Key ID</p>
                                            <p className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded-lg truncate max-w-[180px]">
                                                {config.keyId}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            config.environment === "LIVE"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-amber-100 text-amber-700"
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                config.environment === "LIVE" ? "bg-red-500 animate-pulse" : "bg-amber-500"
                                            }`} />
                                            {config.environment}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            config.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${config.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                                            {config.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>

                                {/* Detail row */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-gray-50 rounded-xl p-2.5">
                                        <p className="text-gray-400 font-medium mb-0.5">Webhook</p>
                                        <p className={config.webhookSecret ? "text-emerald-600 font-semibold" : "text-gray-400"}>
                                            {config.webhookSecret ? "Configured" : "Not set"}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-2.5">
                                        <p className="text-gray-400 font-medium mb-0.5">Updated</p>
                                        <p className="text-gray-700 font-medium">
                                            {config.updatedAt
                                                ? new Date(config.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                                : "—"}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions row */}
                                {deleteConfirm ? (
                                    <div className="flex items-center gap-2 pt-1">
                                        <span className="text-xs text-red-600 font-medium flex-1">Permanently delete this config?</span>
                                        <button
                                            onClick={handleDelete}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"
                                        >
                                            <FiCheck size={11} /> Yes, delete
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(false)}
                                            className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <button
                                            onClick={() => openModal("view", config)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                                        >
                                            <FiEye size={13} /> View
                                        </button>
                                        <button
                                            onClick={() => openModal("edit", config)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
                                        >
                                            <FiEdit2 size={13} /> Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(true)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                                        >
                                            <FiTrash2 size={13} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Desktop table (≥ sm) ── */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Key ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Environment</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Webhook</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Updated</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    <tr className="hover:bg-gray-50/70 transition-colors group">
                                        {/* Key ID */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="shrink-0 p-1.5 bg-emerald-100 rounded-lg">
                                                    <FiCreditCard size={12} className="text-emerald-600" />
                                                </div>
                                                <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg max-w-[200px] truncate block">
                                                    {config.keyId}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Environment */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                config.environment === "LIVE"
                                                    ? "bg-red-100 text-red-700 border border-red-200"
                                                    : "bg-amber-100 text-amber-700 border border-amber-200"
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    config.environment === "LIVE" ? "bg-red-500 animate-pulse" : "bg-amber-500"
                                                }`} />
                                                {config.environment}
                                            </span>
                                        </td>
                                        {/* Webhook */}
                                        <td className="px-6 py-4">
                                            {config.webhookSecret ? (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                                                    <FiCheck size={12} className="text-emerald-500" />
                                                    Configured
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Not configured</span>
                                            )}
                                        </td>
                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                config.isActive
                                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                                    : "bg-gray-100 text-gray-500 border border-gray-200"
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    config.isActive ? "bg-emerald-500" : "bg-gray-400"
                                                }`} />
                                                {config.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        {/* Updated */}
                                        <td className="hidden lg:table-cell px-6 py-4 text-gray-500 text-xs">
                                            {config.updatedAt
                                                ? new Date(config.updatedAt).toLocaleDateString("en-IN", {
                                                    day: "2-digit", month: "short", year: "numeric",
                                                })
                                                : "—"}
                                        </td>
                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            {deleteConfirm ? (
                                                <div className="flex items-center gap-1.5 justify-end flex-wrap">
                                                    <span className="text-xs text-red-600 font-medium hidden md:inline whitespace-nowrap">
                                                        Confirm delete?
                                                    </span>
                                                    <button
                                                        onClick={handleDelete}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"
                                                    >
                                                        <FiCheck size={11} /> Yes
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(false)}
                                                        className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openModal("view", config)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="View details"
                                                    >
                                                        <FiEye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => openModal("edit", config)}
                                                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title="Edit configuration"
                                                    >
                                                        <FiEdit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(true)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete configuration"
                                                    >
                                                        <FiTrash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* ── Security notice ── */}
            <div className="p-5 bg-emerald-900 text-white rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <FiLock size={70} />
                </div>
                <p className="text-sm text-emerald-100 relative z-10 leading-relaxed max-w-2xl">
                    <span className="font-bold text-white">Security Notice:</span>{" "}
                    Your credentials are <strong>AES-256-GCM encrypted</strong> before being stored in our
                    database. We never display your full Key Secret once saved.
                </p>
            </div>

            {/* ── Modal ── */}
            {modal && (
                <ConfigModal
                    type={modal}
                    formData={formData}
                    setFormData={setFormData}
                    onClose={() => setModal(null)}
                    onSubmit={handleSave}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ConfigModalProps {
    type: ModalType;
    formData: RazorpayConfigData;
    setFormData: (d: RazorpayConfigData) => void;
    onClose: () => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    isSaving: boolean;
}

function ConfigModal({ type, formData, setFormData, onClose, onSubmit, isSaving }: ConfigModalProps) {
    const isView = type === "view";
    const isNew = type === "new";
    const titleMap = { view: "View Configuration", edit: "Edit Configuration", new: "New Configuration" };
    const title = titleMap[type as "view" | "edit" | "new"];

    const readonlyField = (label: string, value: React.ReactNode) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
            <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
                {value}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col max-h-[90dvh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-base">
                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <FiCreditCard size={14} className="text-emerald-600" />
                        </div>
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <FiX size={17} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 custom-scrollbar">

                        {/* Environment */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Environment</label>
                            {isView ? (
                                <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        formData.environment === "LIVE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${formData.environment === "LIVE" ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />
                                        {formData.environment}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                                    {(["TEST", "LIVE"] as const).map((env) => (
                                        <button
                                            key={env}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, environment: env })}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                                formData.environment === env
                                                    ? "bg-white text-emerald-600 shadow-sm border border-gray-200"
                                                    : "text-gray-500 hover:text-gray-700"
                                            }`}
                                        >
                                            {env === "LIVE" && <FiAlertCircle size={11} />}
                                            {env === "TEST" && <FiZap size={11} />}
                                            {env}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Key ID */}
                        {isView ? (
                            readonlyField("Key ID", <span className="font-mono text-xs">{formData.keyId}</span>)
                        ) : (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key ID</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                        <FiLock size={13} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.keyId}
                                        onChange={(e) => setFormData({ ...formData, keyId: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all"
                                        placeholder="rzp_test_..."
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Key Secret */}
                        {isView ? (
                            readonlyField("Key Secret", <span className="font-mono tracking-widest text-gray-500">••••••••</span>)
                        ) : (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Secret</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                        <FiLock size={13} />
                                    </div>
                                    <input
                                        type="password"
                                        value={formData.keySecret}
                                        onChange={(e) => setFormData({ ...formData, keySecret: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all"
                                        placeholder={formData._id ? "Leave empty to keep current" : "Your Razorpay secret"}
                                        required={isNew}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Webhook Secret */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                Webhook Secret
                                <span className="text-[10px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full normal-case">Optional</span>
                            </label>
                            {isView ? (
                                <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                                    {formData.webhookSecret
                                        ? <span className="font-mono tracking-widest text-gray-500">••••••••</span>
                                        : <span className="text-gray-400">Not configured</span>}
                                </div>
                            ) : (
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                        <FiLock size={13} />
                                    </div>
                                    <input
                                        type="password"
                                        value={formData.webhookSecret || ""}
                                        onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm text-gray-800 transition-all"
                                        placeholder="Optional webhook verification secret"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Status toggle — edit only */}
                        {!isView && !isNew && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-1.5 rounded-full ${formData.isActive ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-500"}`}>
                                        <FiCheckCircle size={13} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Service Status</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                                </label>
                            </div>
                        )}

                        {/* View metadata */}
                        {isView && formData.updatedAt && (
                            readonlyField("Last Updated",
                                new Date(formData.updatedAt).toLocaleString("en-IN", {
                                    day: "2-digit", month: "short", year: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                })
                            )
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            {isView ? "Close" : "Cancel"}
                        </button>
                        {!isView && (
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
                                {isNew ? "Create Config" : "Save Changes"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
