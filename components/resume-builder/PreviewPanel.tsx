"use client";

import React, { useRef, useState, useCallback } from "react";
import { FiDownload, FiGrid, FiEye, FiZoomIn, FiZoomOut } from "react-icons/fi";
import { exportResumePDF } from "./utils/pdfExport";
import ModernTemplate from "./templates/ModernTemplate";
import ClassicTemplate from "./templates/ClassicTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import type { ResumeData } from "./types";

interface Props {
  resume: ResumeData;
  highlightKeywords?: string[];
}

// ─── Alignment Grid Overlay ────────────────────────────────────────────────────

function AlignmentGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {/* Vertical guide lines */}
      {[25, 50, 75].map(pct => (
        <div
          key={`v${pct}`}
          className="absolute top-0 bottom-0 w-px opacity-20"
          style={{ left: `${pct}%`, backgroundColor: '#3b82f6' }}
        />
      ))}
      {/* Horizontal guide lines */}
      {[25, 50, 75].map(pct => (
        <div
          key={`h${pct}`}
          className="absolute left-0 right-0 h-px opacity-20"
          style={{ top: `${pct}%`, backgroundColor: '#3b82f6' }}
        />
      ))}
      {/* Center cross */}
      <div className="absolute top-0 bottom-0 w-px opacity-30" style={{ left: '50%', backgroundColor: '#ef4444' }} />
      <div className="absolute left-0 right-0 h-px opacity-30" style={{ top: '50%', backgroundColor: '#ef4444' }} />
      {/* Corner dots */}
      {[[0,0],[0,100],[100,0],[100,100]].map(([x, y], i) => (
        <div key={i} className="absolute w-2 h-2 rounded-full bg-blue-400 opacity-40"
          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }} />
      ))}
    </div>
  );
}

// ─── Preview Panel ─────────────────────────────────────────────────────────────

export default function PreviewPanel({ resume, highlightKeywords = [] }: Props) {
  const [showGrid, setShowGrid] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const Template = resume.format.template === 'modern'
    ? ModernTemplate
    : resume.format.template === 'classic'
    ? ClassicTemplate
    : MinimalTemplate;

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportResumePDF('resume-preview-content', resume);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExporting(false);
    }
  }, [resume]);

  const zoomIn  = () => setZoom(z => Math.min(z + 0.1, 2));
  const zoomOut = () => setZoom(z => Math.max(z - 0.1, 0.4));

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <FiEye size={14} className="text-gray-400" />
          <span className="text-sm font-bold text-gray-800">Live Preview</span>
          <span className="text-xs text-gray-400 ml-1">({resume.format.template})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={zoomOut} className="p-1.5 hover:bg-white rounded-md transition text-gray-500 hover:text-gray-700">
              <FiZoomOut size={13} />
            </button>
            <span className="text-xs text-gray-500 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} className="p-1.5 hover:bg-white rounded-md transition text-gray-500 hover:text-gray-700">
              <FiZoomIn size={13} />
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
              showGrid
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <FiGrid size={13} />
            Grid
          </button>

          {/* Download */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-xs font-semibold transition"
          >
            {exporting ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Exporting…</>
            ) : (
              <><FiDownload size={13} /> PDF</>
            )}
          </button>
        </div>
      </div>

      {/* A4 Preview Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto custom-scrollbar flex justify-center py-6 px-4"
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
          }}
        >
          {/* A4 Paper */}
          <div
            className="relative bg-white shadow-2xl"
            style={{
              width: '794px',      // A4 at 96dpi
              minHeight: '1123px', // A4 at 96dpi
            }}
          >
            {showGrid && <AlignmentGrid />}
            <Template resume={resume} highlightKeywords={highlightKeywords} />
          </div>
        </div>
      </div>
    </div>
  );
}
