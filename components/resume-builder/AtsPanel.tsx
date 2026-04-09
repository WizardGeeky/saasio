"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiZap, FiUpload, FiCheck, FiX, FiChevronDown, FiChevronUp, FiAlertCircle } from "react-icons/fi";
import { calculateATSScore } from "./utils/atsScoring";
import type { ResumeData, ATSResult } from "./types";

interface Props {
  resume: ResumeData;
  onHighlightKeywords?: (keywords: string[]) => void;
}

// ─── Score Ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] text-gray-400 font-medium">/ 100</span>
      </div>
    </div>
  );
}

// ─── Bar ───────────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const color = value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">{weight}</span>
          <span className={`text-xs font-semibold ${value >= 75 ? 'text-emerald-600' : value >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{value}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export default function AtsPanel({ resume, onHighlightKeywords }: Props) {
  const [jd, setJd] = useState('');
  const [result, setResult] = useState<ATSResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showKeywords, setShowKeywords] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const analyze = async () => {
    if (!jd.trim()) return;
    setAnalyzing(true);
    // Simulate a brief async operation for better UX
    await new Promise(r => setTimeout(r, 600));
    const r = calculateATSScore(resume, jd);
    setResult(r);
    setAnalyzing(false);
    onHighlightKeywords?.(r.matchedKeywords);
  };

  const scoreLabel = (n: number) =>
    n >= 80 ? 'Excellent' : n >= 65 ? 'Good' : n >= 45 ? 'Fair' : 'Needs Work';

  const scoreColor = (n: number) =>
    n >= 80 ? 'text-emerald-600 bg-emerald-50' :
    n >= 65 ? 'text-sky-600 bg-sky-50' :
    n >= 45 ? 'text-amber-600 bg-amber-50' :
    'text-red-600 bg-red-50';

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <FiZap className="text-amber-500" size={16} />
          <h3 className="text-sm font-semibold text-gray-800">ATS Analyzer</h3>
        </div>
        <textarea
          value={jd}
          onChange={e => setJd(e.target.value)}
          rows={5}
          placeholder="Paste the job description here…

Example: We are looking for a Software Engineer with 3+ years of experience in React, Node.js, AWS..."
          className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 bg-white placeholder:text-gray-300 resize-none leading-relaxed"
        />
        <button
          onClick={analyze}
          disabled={!jd.trim() || analyzing}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-semibold transition"
        >
          {analyzing ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Analyzing…
            </>
          ) : (
            <><FiZap size={15} /> Analyze Resume</>
          )}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 space-y-4"
            >
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
                <ScoreRing score={result.overall} />
                <div>
                  <p className="text-xs text-gray-500 mb-1">ATS Score</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${scoreColor(result.overall)}`}>
                    {scoreLabel(result.overall)}
                  </span>
                  <p className="text-xs text-gray-400 mt-1 leading-tight">
                    {result.overall >= 75 ? 'Your resume is well-optimized!' :
                     result.overall >= 50 ? 'Some improvements can boost your score.' :
                     'Significant improvements recommended.'}
                  </p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Score Breakdown</p>
                <ScoreBar label="Keyword Match"          value={result.keywordMatch}          weight="40%" />
                <ScoreBar label="Experience Relevance"   value={result.experienceRelevance}   weight="25%" />
                <ScoreBar label="Skills Coverage"        value={result.skillsCoverage}        weight="20%" />
                <ScoreBar label="Formatting & Structure" value={result.formatting}            weight="15%" />
              </div>

              {/* Section Scores */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Section Match</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['Skills',      result.sectionScores.skills],
                    ['Experience',  result.sectionScores.experience],
                    ['Projects',    result.sectionScores.projects],
                  ] as const).map(([label, score]) => (
                    <div key={label} className="text-center bg-gray-50 rounded-xl py-2.5 px-1">
                      <div className={`text-lg font-bold ${score >= 70 ? 'text-emerald-600' : score >= 45 ? 'text-amber-500' : 'text-red-500'}`}>{score}%</div>
                      <div className="text-[10px] text-gray-400 font-medium">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowKeywords(v => !v)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Keyword Analysis</p>
                  {showKeywords ? <FiChevronUp size={14} className="text-gray-400" /> : <FiChevronDown size={14} className="text-gray-400" />}
                </button>
                <AnimatePresence>
                  {showKeywords && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {result.matchedKeywords.length > 0 && (
                          <div>
                            <p className="text-xs text-emerald-600 font-medium mb-1.5 flex items-center gap-1">
                              <FiCheck size={12} /> Matched ({result.matchedKeywords.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {result.matchedKeywords.map(kw => (
                                <span key={kw} className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[11px] font-medium">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.missingKeywords.length > 0 && (
                          <div>
                            <p className="text-xs text-red-500 font-medium mb-1.5 flex items-center gap-1">
                              <FiX size={12} /> Missing ({result.missingKeywords.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {result.missingKeywords.map(kw => (
                                <span key={kw} className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded-full text-[11px] font-medium">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setShowSuggestions(v => !v)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                  >
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggestions</p>
                    {showSuggestions ? <FiChevronUp size={14} className="text-gray-400" /> : <FiChevronDown size={14} className="text-gray-400" />}
                  </button>
                  <AnimatePresence>
                    {showSuggestions && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-2">
                          {result.suggestions.map((s, i) => (
                            <div key={i} className="flex gap-2.5 items-start bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                              <FiAlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                              <p className="text-xs text-amber-800 leading-relaxed">{s}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !analyzing && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-3">
              <FiZap size={24} className="text-amber-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Paste a Job Description</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Get keyword analysis, ATS score, and actionable suggestions to improve your match rate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
