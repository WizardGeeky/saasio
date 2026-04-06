"use client";

import React from "react";
import { FiFileText } from "react-icons/fi";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResumeTemplatesPage() {
  return (
    <div className="w-full mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
            <FiFileText className="text-emerald-600" size={20} />
          </div>
          Resume Templates
        </h1>
      </div>
    </div>
  );
}
