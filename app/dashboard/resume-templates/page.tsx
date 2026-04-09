"use client";

import React from "react";
import dynamic from "next/dynamic";
import { FiFileText } from "react-icons/fi";

// Lazy-load the heavy resume builder to avoid SSR issues with dnd-kit
const ResumeBuilder = dynamic(
  () => import("@/components/resume-builder/ResumeBuilder"),
  { ssr: false, loading: () => <BuilderSkeleton /> }
);

function BuilderSkeleton() {
  return (
    <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
          <FiFileText className="text-emerald-400" size={22} />
        </div>
        <p className="text-sm text-gray-400 font-medium">Loading Resume Builder…</p>
      </div>
    </div>
  );
}

export default function ResumeTemplatesPage() {
  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
            <FiFileText className="text-emerald-600" size={20} />
          </div>
          Resume Builder
        </h1>
        <p className="text-sm text-gray-500 mt-1 ml-12">
          Build, preview, and optimize your resume with real-time ATS scoring
        </p>
      </div>

      {/* Full-height Builder — negative margin to escape dashboard padding */}
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        style={{ height: 'calc(100vh - 180px)', minHeight: '600px' }}
      >
        <ResumeBuilder />
      </div>
    </div>
  );
}
