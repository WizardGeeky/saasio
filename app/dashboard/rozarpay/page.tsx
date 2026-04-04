"use client";

import React, { useState, useEffect } from "react";
import { FiCreditCard, FiSave, FiTrash2, FiRefreshCw, FiExternalLink, FiLock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/app/utils/token";

interface RazorpayConfigData {
    _id?: string;
    keyId: string;
    keySecret: string;
    webhookSecret?: string;
    environment: "TEST" | "LIVE";
    isActive: boolean;
}

export default function RazorpayConfigPage() {
    const { success: toastSuccess, error: toastError } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState<RazorpayConfigData>({
        keyId: "",
        keySecret: "",
        webhookSecret: "",
        environment: "TEST",
        isActive: true,
    });

    const token = getStoredToken();

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/v1/private/rozarpay", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.success && data.data) {
                setConfig({
                    ...data.data,
                    keySecret: "", // Don't show the secret even if masked in API
                    webhookSecret: data.data.webhookSecret ? "" : "", 
                });
            }
        } catch (error) {
            console.error("Failed to fetch config:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const method = config._id ? "PUT" : "POST";
        const payload = config._id 
            ? { ...config, id: config._id } 
            : config;

        try {
            const res = await fetch("/api/v1/private/rozarpay", {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                toastSuccess(config._id ? "Configuration updated!" : "Configuration saved!");
                fetchConfig();
            } else {
                toastError(data.message || "Failed to save configuration");
            }
        } catch (error) {
            toastError("An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!config._id || !confirm("Are you sure you want to delete this configuration?")) return;

        try {
            const res = await fetch(`/api/v1/private/rozarpay?id=${config._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            if (data.success) {
                toastSuccess("Configuration deleted");
                setConfig({
                    keyId: "",
                    keySecret: "",
                    webhookSecret: "",
                    environment: "TEST",
                    isActive: true,
                });
            } else {
                toastError(data.message || "Failed to delete configuration");
            }
        } catch (error) {
            toastError("An unexpected error occurred");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-gray-500 animate-pulse">Loading secure configuration...</p>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl">
                            <FiCreditCard className="text-emerald-600" />
                        </div>
                        Razorpay Integration
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your payment gateway credentials and environment settings.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchConfig}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                        title="Refresh Data"
                    >
                        <FiRefreshCw className={`${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <a 
                        href="https://dashboard.razorpay.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-all duration-200"
                    >
                        Razorpay Dashboard <FiExternalLink className="text-xs" />
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Section */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSave} className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Environment Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        Active Environment
                                        <span className={`w-2 h-2 rounded-full ${config.environment === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}></span>
                                    </label>
                                    <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                                        {(["TEST", "LIVE"] as const).map((env) => (
                                            <button
                                                key={env}
                                                type="button"
                                                onClick={() => setConfig({ ...config, environment: env })}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                                                    config.environment === env
                                                        ? "bg-white text-emerald-600 shadow-sm border border-gray-200"
                                                        : "text-gray-500 hover:text-gray-700"
                                                }`}
                                            >
                                                {env === 'LIVE' && <FiAlertCircle className="text-xs" />}
                                                {env}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Toggle */}
                                <div className="space-y-2 flex flex-col justify-end">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-full ${config.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                                                <FiCheckCircle className="text-sm" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">Service Status</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={config.isActive}
                                                onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Key ID</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-emerald-500 text-gray-400">
                                            <FiLock className="text-sm transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={config.keyId}
                                            onChange={(e) => setConfig({ ...config, keyId: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-gray-800"
                                            placeholder="rzp_test_..."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Key Secret</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-emerald-500 text-gray-400">
                                            <FiLock className="text-sm transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            value={config.keySecret}
                                            onChange={(e) => setConfig({ ...config, keySecret: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-gray-800 placeholder:text-gray-300"
                                            placeholder={config._id ? "Leave empty to keep current secret" : "Your Razorpay secret"}
                                            required={!config._id}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                                        Webhook Secret
                                        <span className="text-[10px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase">Optional</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-emerald-500 text-gray-400">
                                            <FiLock className="text-sm transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            value={config.webhookSecret}
                                            onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-gray-800 placeholder:text-gray-300"
                                            placeholder="Optional webhook verification secret"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <div className="hidden md:block">
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                {config._id && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <FiTrash2 /> Delete
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FiSave className="group-hover:scale-110 transition-transform" />
                                            {config._id ? "Update Configuration" : "Save Configuration"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Sidebar Info Section */}
                <div className="space-y-6">
                    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FiCheckCircle className="text-emerald-500" />
                            Pre-requisites
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="mt-1 w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                                <p className="text-sm text-gray-600">Ensure you have generated the API Key in your Razorpay Dashboard.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="mt-1 w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                                <p className="text-sm text-gray-600">Identify if you're using <b>Test</b> or <b>Live</b> mode credentials.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="mt-1 w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                                <p className="text-sm text-gray-600">Copy the <b>Key ID</b> and <b>Key Secret</b> and paste them here.</p>
                            </li>
                        </ul>
                    </div>

                    <div className="p-6 bg-emerald-900 text-white rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <FiLock size={80} />
                        </div>
                        <h3 className="font-bold mb-2 relative z-10">Security Notice</h3>
                        <p className="text-sm text-emerald-100 relative z-10 leading-relaxed">
                            Your credentials are <b>ES256 encrypted</b> before being stored in our database. We never display your full Key Secret once saved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
