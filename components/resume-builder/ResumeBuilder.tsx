"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FiEdit3, FiEye, FiZap } from "react-icons/fi";
import BuilderPanel from "./BuilderPanel";
import PreviewPanel from "./PreviewPanel";
import AtsPanel from "./AtsPanel";
import type { ResumeData } from "./types";
import { DEFAULT_RESUME } from "./types";

// ─── Mobile Tab ────────────────────────────────────────────────────────────────

type MobileTab = 'builder' | 'preview' | 'ats';

const MOBILE_TABS: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
  { id: 'builder',  label: 'Builder',  icon: <FiEdit3 size={15} /> },
  { id: 'preview',  label: 'Preview',  icon: <FiEye size={15} /> },
  { id: 'ats',      label: 'ATS Score',icon: <FiZap size={15} /> },
];

// ─── Resume Builder ────────────────────────────────────────────────────────────

export default function ResumeBuilder() {
  const [resume, setResume] = useState<ResumeData>(DEFAULT_RESUME);
  const [highlightKeywords, setHighlightKeywords] = useState<string[]>([]);
  const [mobileTab, setMobileTab] = useState<MobileTab>('builder');

  const handleResumeChange = useCallback((r: ResumeData) => setResume(r), []);

  // ── Desktop 3-column layout ──────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col">
      {/* ── Mobile: Tab Bar ─────────────────────────────────────────────────── */}
      <div className="lg:hidden flex border-b border-gray-200 bg-white shrink-0">
        {MOBILE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition border-b-2 ${
              mobileTab === tab.id
                ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Mobile: Active Panel ─────────────────────────────────────────────── */}
      <div className="lg:hidden flex-1 overflow-hidden">
        {mobileTab === 'builder' && (
          <BuilderPanel resume={resume} onChange={handleResumeChange} />
        )}
        {mobileTab === 'preview' && (
          <PreviewPanel resume={resume} highlightKeywords={highlightKeywords} />
        )}
        {mobileTab === 'ats' && (
          <AtsPanel resume={resume} onHighlightKeywords={setHighlightKeywords} />
        )}
      </div>

      {/* ── Desktop: 3-column layout ─────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 overflow-hidden gap-0">
        {/* Left — Builder */}
        <div className="w-[340px] xl:w-[380px] shrink-0 border-r border-gray-200 flex flex-col overflow-hidden bg-gray-50">
          <BuilderPanel resume={resume} onChange={handleResumeChange} />
        </div>

        {/* Center — Preview */}
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          <PreviewPanel resume={resume} highlightKeywords={highlightKeywords} />
        </div>

        {/* Right — ATS */}
        <div className="w-[300px] xl:w-[320px] shrink-0 border-l border-gray-200 flex flex-col overflow-hidden bg-white">
          <AtsPanel resume={resume} onHighlightKeywords={setHighlightKeywords} />
        </div>
      </div>
    </div>
  );
}
