"use client";

import React, { useState, useEffect } from "react";
import { FiMessageSquare, FiFilter, FiSearch, FiEdit2, FiCheckCircle, FiXCircle, FiClock, FiLoader, FiChevronLeft, FiChevronRight, FiMoreVertical } from "react-icons/fi";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";

interface Complaint {
    _id: string;
    userId: string;
    userName: string;
    userEmail: string;
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

export default function ComplaintsAdminPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState({ status: "", adminNotes: "" });
    const { success, error } = useToast();

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const token = getStoredToken();
            const res = await fetch(`/api/v1/private/complaints?status=${statusFilter}&search=${searchTerm}`, {
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
        const delayDebounceFn = setTimeout(() => {
            fetchComplaints();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [statusFilter, searchTerm]);

    const handleEditClick = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setEditData({ status: complaint.status, adminNotes: complaint.adminNotes || "" });
        setIsModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getStoredToken();
            const res = await fetch(`/api/v1/private/complaints/${selectedComplaint?._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editData),
            });
            const data = await res.json();
            if (data.success) {
                success("Complaint updated successfully");
                setIsModalOpen(false);
                fetchComplaints();
            } else {
                error(data.message || "Failed to update complaint");
            }
        } catch (err) {
            error("Something went wrong");
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FiMessageSquare className="text-indigo-600" />
                        Complaints Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Review and resolve user complaints.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name, email, issue..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-semibold text-xs border-b">
                        <tr>
                            <th className="px-6 py-4 uppercase">User</th>
                            <th className="px-6 py-4 uppercase">Complaint</th>
                            <th className="px-6 py-4 uppercase">Status</th>
                            <th className="px-6 py-4 uppercase">Date</th>
                            <th className="px-6 py-4 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-20 text-gray-400">
                                    <FiLoader className="animate-spin mx-auto text-3xl mb-2 text-indigo-600" />
                                    Loading complaints...
                                </td>
                            </tr>
                        ) : complaints.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-20 text-gray-400">
                                    No complaints found matching filters.
                                </td>
                            </tr>
                        ) : (
                            complaints.map((c) => (
                                <tr key={c._id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">{c.userName}</p>
                                        <p className="text-gray-500 text-xs">{c.userEmail}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-indigo-800 mb-1">{c.reason}</p>
                                        <p className="text-gray-500 text-xs line-clamp-1">{c.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[c.status]}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEditClick(c)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                        >
                                            <FiEdit2 />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && selectedComplaint && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Update Complaint</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <FiXCircle size={24} />
                            </button>
                        </div>

                        <div className="mb-6 space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">User Detail</p>
                                <p className="text-sm font-semibold">{selectedComplaint.userName} ({selectedComplaint.userEmail})</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Complaint Detail</p>
                                <p className="text-sm font-bold text-indigo-600">{selectedComplaint.reason}</p>
                                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto">{selectedComplaint.description}</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                                <select
                                    value={editData.status}
                                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                    className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Admin Resolution / Notes</label>
                                <textarea
                                    value={editData.adminNotes}
                                    onChange={(e) => setEditData({ ...editData, adminNotes: e.target.value })}
                                    className="w-full border rounded-xl p-3 h-24 outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Add notes for the user..."
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold transition hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold transition hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
