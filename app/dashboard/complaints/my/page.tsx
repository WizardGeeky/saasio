"use client";

import React, { useState, useEffect } from "react";
import { FiMessageSquare, FiPlus, FiClock, FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";

interface Complaint {
    _id: string;
    reason: string;
    description: string;
    status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
    adminNotes?: string;
    createdAt: string;
}

const statusColors = {
    PENDING: "bg-amber-100 text-amber-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
};

const statusIcons = {
    PENDING: <FiClock />,
    IN_PROGRESS: <FiLoader className="animate-spin" />,
    RESOLVED: <FiCheckCircle />,
    REJECTED: <FiXCircle />,
};

export default function MyComplaintsPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ reason: "", description: "" });
    const { success, error } = useToast();

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const token = getStoredToken();
            const res = await fetch("/api/v1/private/complaints/my", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setComplaints(data.data);
            } else {
                error(data.message || "Failed to fetch complaints");
            }
        } catch (err) {
            error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getStoredToken();
            const res = await fetch("/api/v1/private/complaints", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                success("Complaint submitted successfully");
                setShowForm(false);
                setFormData({ reason: "", description: "" });
                fetchComplaints();
            } else {
                error(data.message || "Failed to submit complaint");
            }
        } catch (err) {
            error("Something went wrong");
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FiMessageSquare className="text-indigo-600" />
                        My Complaints
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Raise and track your issues here.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
                >
                    <FiPlus /> {showForm ? "Cancel" : "Raise New Complaint"}
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-lg font-semibold mb-4">New Complaint</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Subject</label>
                            <input
                                type="text"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                                placeholder="E.g., Payment issue, Profile error..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full border p-2 rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                                placeholder="Describe the problem in detail..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                        >
                            Submit Complaint
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <FiLoader className="animate-spin text-3xl text-indigo-600" />
                </div>
            ) : complaints.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
                    <p className="text-gray-500">No complaints found. If you have an issue, raise a new one!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {complaints.map((c) => (
                        <div key={c._id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-lg">{c.reason}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${statusColors[c.status]}`}>
                                    {statusIcons[c.status]} {c.status}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap mb-4">{c.description}</p>
                            
                            {c.adminNotes && (
                                <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Admin Response:</p>
                                    <p className="text-sm text-indigo-900">{c.adminNotes}</p>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                                <span>Ref ID: {c._id}</span>
                                <span>Submitted on: {new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
