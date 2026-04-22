"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  FiGrid,
  FiZap,
  FiCpu,
  FiFileText,
  FiUploadCloud,
  FiX,
  FiRefreshCw,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEye,
  FiCheck,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";
import { CV_TEMPLATES, type CvTemplateId } from "@/app/dashboard/resume-config/cv-pdf-templates";

// ─── Lazy BlobProvider (SSR disabled) ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BlobProvider = dynamic(
  () => import("@react-pdf/renderer").then((m) => ({ default: m.BlobProvider as any })),
  { ssr: false }
) as any;

// ─── Types ─────────────────────────────────────────────────────────────────────

type AiModelOption = {
  _id: string;
  displayName: string;
  modelName: string;
  provider: string;
};

interface MyCv {
  _id: string;
  resumeName: string;
  resumeTitle: string;
  fileName: string;
  templateId: string;
  templateName: string;
  hasPayload: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

const AI_MODEL_PROVIDER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  openai:    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  anthropic: { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  google:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  mistral:   { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  groq:      { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200" },
  custom:    { bg: "bg-gray-100",   text: "text-gray-600",    border: "border-gray-200" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Generate CV Modal (simplified: AI model + PDF only) ──────────────────────

function GenerateModal({
  aiModel, setAiModel, resumeFile, setResumeFile,
  models, modelsLoading, modelsError,
  isGenerating, onClose, onSubmit,
}: {
  aiModel: string;
  setAiModel: (v: string) => void;
  resumeFile: File | null;
  setResumeFile: (f: File | null) => void;
  models: AiModelOption[];
  modelsLoading: boolean;
  modelsError: string | null;
  isGenerating: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const selectedModel = models.find((m) => m._id === aiModel) ?? null;
  const providerStyles = selectedModel
    ? (AI_MODEL_PROVIDER_STYLES[selectedModel.provider] ?? AI_MODEL_PROVIDER_STYLES.custom)
    : null;

  const canSubmit = aiModel.trim().length > 0 && resumeFile !== null && !isGenerating;

  const handleFile = (file: File) => {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
      setResumeFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90dvh] sm:max-h-[80vh]">

        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2.5">
              <div className="p-1.5 bg-violet-100 rounded-lg">
                <FiZap size={14} className="text-violet-600" />
              </div>
              Generate CV with AI
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Upload your resume PDF. AI generates a polished, professional CV.
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <FiX size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">

          {/* AI Model */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <FiCpu size={12} className="text-orange-500" /> AI Model <span className="text-red-400">*</span>
            </label>
            <select value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              disabled={modelsLoading}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none text-sm text-gray-800 transition-all">
              <option value="">
                {modelsLoading ? "Loading models…" : models.length === 0 ? "No AI models configured" : "Select a stored AI model"}
              </option>
              {models.map((m) => (
                <option key={m._id} value={m._id}>{m.displayName} | {m.provider} | {m.modelName}</option>
              ))}
            </select>
            {selectedModel && providerStyles && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${providerStyles.bg} ${providerStyles.text} ${providerStyles.border}`}>
                  {selectedModel.provider}
                </span>
                <span className="text-sm font-semibold text-gray-800">{selectedModel.displayName}</span>
                <span className="text-xs font-mono text-gray-400">{selectedModel.modelName}</span>
              </div>
            )}
            {!modelsLoading && models.length === 0 && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <span>No AI models found.</span>
                <a href="/dashboard/ai-models" className="font-semibold text-amber-800 hover:underline whitespace-nowrap">Open AI Models →</a>
              </div>
            )}
            {modelsError && <p className="text-xs text-red-500">{modelsError}</p>}
          </div>

          {/* Resume Upload */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <FiFileText size={12} className="text-emerald-500" /> Resume PDF <span className="text-red-400">*</span>
            </label>
            {resumeFile ? (
              <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="p-2 bg-emerald-100 rounded-lg shrink-0"><FiFileText size={16} className="text-emerald-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-800 truncate">{resumeFile.name}</p>
                  <p className="text-xs text-emerald-500 mt-0.5">{(resumeFile.size / 1024).toFixed(1)} KB · PDF</p>
                </div>
                <button type="button" onClick={() => setResumeFile(null)}
                  className="p-1.5 text-emerald-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"><FiX size={14} /></button>
              </div>
            ) : (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                className={`flex flex-col items-center justify-center gap-3 px-6 py-10 border-2 border-dashed rounded-xl cursor-pointer transition-all ${dragOver ? "border-violet-400 bg-violet-50" : "border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/50"}`}>
                <input type="file" accept="application/pdf" className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <div className={`p-3 rounded-xl transition-colors ${dragOver ? "bg-violet-100" : "bg-white border border-gray-200"}`}>
                  <FiUploadCloud size={22} className={dragOver ? "text-violet-600" : "text-gray-400"} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">
                    Drop your resume PDF, or <span className="text-violet-600 underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF only · Max 10 MB</p>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0 bg-white rounded-b-2xl">
          <button type="button" onClick={onClose} disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onSubmit} disabled={!canSubmit}
            className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-lg shadow-violet-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {isGenerating ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating…</>
            ) : (
              <><FiZap size={14} /> Generate CV</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CV Preview & Download Modal ───────────────────────────────────────────────

function PreviewModal({
  resumeJson, cvName, onClose,
}: {
  resumeJson: unknown;
  cvName: string;
  onClose: () => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplateId>("london" as CvTemplateId);
  const template = CV_TEMPLATES.find((t) => t.id === selectedTemplate) ?? CV_TEMPLATES[0];
  const TemplateDoc = template.component;

  const triggerDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cvName || "cv"}_${selectedTemplate}.pdf`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/80 backdrop-blur-sm">

      {/* ── Top bar ── */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-0 flex items-stretch min-h-[52px]">

        {/* Left — CV name */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0 py-3">
          <div className="p-1.5 bg-violet-100 rounded-lg shrink-0">
            <FiEye size={13} className="text-violet-600" />
          </div>
          <p className="font-semibold text-gray-800 text-sm truncate">{cvName}</p>
        </div>

        {/* Centre — template switcher (desktop) */}
        <div className="hidden sm:flex items-center gap-1 px-4 border-l border-r border-gray-100">
          <span className="text-xs text-gray-400 font-medium mr-2">Template</span>
          {CV_TEMPLATES.map((t) => (
            <button key={t.id} type="button"
              onClick={() => setSelectedTemplate(t.id as CvTemplateId)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                selectedTemplate === t.id
                  ? "border-violet-500 bg-violet-600 text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:text-violet-600"
              }`}>
              {selectedTemplate === t.id && <FiCheck size={10} />}
              {t.name}
            </button>
          ))}
        </div>

        {/* Right — download + close */}
        <div className="flex items-center gap-2 pl-4">
          <BlobProvider document={<TemplateDoc data={resumeJson} />}>
            {({ url, loading }: { url: string | null; loading: boolean }) => (
              <button type="button"
                disabled={loading || !url}
                onClick={() => url && triggerDownload(url)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow shadow-violet-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span className="hidden sm:inline">Preparing…</span></>
                  : <><FiDownload size={14} /><span className="hidden sm:inline">Download PDF</span></>}
              </button>
            )}
          </BlobProvider>
          <button type="button" onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* ── Mobile template switcher ── */}
      <div className="sm:hidden shrink-0 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium shrink-0">Template:</span>
        {CV_TEMPLATES.map((t) => (
          <button key={t.id} type="button"
            onClick={() => setSelectedTemplate(t.id as CvTemplateId)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              selectedTemplate === t.id
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-gray-200 bg-white text-gray-600"
            }`}>
            {selectedTemplate === t.id && <FiCheck size={10} />}
            {t.name}
          </button>
        ))}
      </div>

      {/* ── PDF viewer — takes all remaining space ── */}
      <div className="flex-1 min-h-0 bg-gray-200 flex items-stretch justify-center p-3 sm:p-6">
        <BlobProvider document={<TemplateDoc data={resumeJson} />}>
          {({ url, loading, error }: { url: string | null; loading: boolean; error: Error | null }) => {
            if (loading) {
              return (
                <div className="w-full flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400 font-medium">Rendering your CV…</p>
                </div>
              );
            }
            if (error || !url) {
              return (
                <div className="w-full flex flex-col items-center justify-center gap-3">
                  <p className="text-sm text-red-500 font-medium">Failed to render PDF.</p>
                  <p className="text-xs text-gray-400">Try selecting a different template.</p>
                </div>
              );
            }
            return (
              <iframe
                key={url}
                src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-gray-300"
                style={{ height: "100%" }}
                title="CV Preview"
              />
            );
          }}
        </BlobProvider>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  cvName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  cvName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
        <div className="sm:hidden flex justify-center mb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 rounded-xl shrink-0">
            <FiAlertTriangle size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Delete CV?</h3>
            <p className="text-xs text-gray-500 mt-0.5">This cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 truncate">
          <span className="font-semibold text-gray-800">{cvName || "Untitled CV"}</span>
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50">
            {isDeleting
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting…</>
              : <><FiTrash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MyCvsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const token = getStoredToken();

  const [cvs, setCvs] = useState<MyCv[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Generate modal state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [aiModels, setAiModels] = useState<AiModelOption[]>([]);
  const [aiModelsLoading, setAiModelsLoading] = useState(false);
  const [aiModelsError, setAiModelsError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ resumeJson: unknown; cvName: string } | null>(null);
  const [loadingCvId, setLoadingCvId] = useState<string | null>(null);

  // Delete state
  const [deleteCv, setDeleteCv] = useState<MyCv | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCvs = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/private/my-cvs?page=${targetPage}&limit=12`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load CVs.");
      setCvs(data.cvs ?? []);
      setPagination(data.pagination);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to load CVs.");
    } finally {
      setLoading(false);
    }
  }, [token, toastError]);

  useEffect(() => { fetchCvs(page); }, [fetchCvs, page]);

  // Load AI models when generate modal opens
  useEffect(() => {
    if (!generateOpen) return;
    setAiModelsLoading(true);
    setAiModelsError(null);
    fetch("/api/v1/private/ai-models", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const list: AiModelOption[] = (data.models ?? data.data ?? []).map((m: AiModelOption) => ({
          _id: m._id, displayName: m.displayName, modelName: m.modelName, provider: m.provider,
        }));
        setAiModels(list);
        setSelectedModel(list[0]?._id || "");
      })
      .catch(() => setAiModelsError("Failed to load AI models"))
      .finally(() => setAiModelsLoading(false));
  }, [generateOpen, token]);

  const openGenerate = () => {
    setSelectedModel("");
    setResumeFile(null);
    setGenerateOpen(true);
  };

  const handleGenerate = useCallback(async () => {
    if (!resumeFile) { toastError("Please upload a resume PDF."); return; }
    setIsGenerating(true);
    try {
      // 1. Generate via AI (CV-specific route — no targetRole/JD, purely from resume)
      const formData = new FormData();
      formData.append("modelId",    selectedModel);
      formData.append("resumeFile", resumeFile);

      const aiRes = await fetch("/api/v1/private/cv-ai", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.message || "AI generation failed.");

      // 2. Save to My CVs
      const saveRes = await fetch("/api/v1/private/my-cvs", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ resumeJson: aiData.resumeJson }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.message || "Failed to save CV.");

      setGenerateOpen(false);
      toastSuccess("CV generated! Opening preview…");

      // 3. Open preview immediately with the generated JSON
      const name = aiData.resumeJson?.header?.name || "CV";
      setPreviewData({ resumeJson: aiData.resumeJson, cvName: name });
      setPreviewOpen(true);

      // 4. Refresh list in background
      fetchCvs(1);
      setPage(1);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to generate CV.");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedModel, resumeFile, token, toastSuccess, toastError, fetchCvs]);

  const openPreview = useCallback(async (cv: MyCv) => {
    if (!cv.hasPayload) { toastError("No saved CV data available for this entry."); return; }
    setLoadingCvId(cv._id);
    try {
      const res = await fetch(`/api/v1/private/my-cvs/${cv._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load CV.");
      setPreviewData({
        resumeJson: data.cv.resumePayload,
        cvName: cv.resumeName || "CV",
      });
      setPreviewOpen(true);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to load CV.");
    } finally {
      setLoadingCvId(null);
    }
  }, [token, toastError]);

  const handleDelete = useCallback(async () => {
    if (!deleteCv) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/private/my-cvs/${deleteCv._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete CV.");
      toastSuccess("CV deleted successfully.");
      setDeleteCv(null);
      fetchCvs(page);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete CV.");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteCv, token, toastSuccess, toastError, fetchCvs, page]);

  return (
    <div className="mx-auto w-full space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <FiGrid size={20} />
            </span>
            My CVs
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:pl-14">
            AI-generated CVs. Preview and download directly in any template.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <button type="button" onClick={() => fetchCvs(page)} disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 disabled:opacity-60">
            <FiRefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button type="button" onClick={openGenerate}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700">
            <FiZap size={15} /> Generate CV
          </button>
        </div>
      </div>

      {/* ── CV List ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
              <div className="mt-4 h-8 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : cvs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-20 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-500">
            <FiGrid size={28} />
          </span>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">No CVs yet</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Click <strong>Generate CV</strong> and upload your existing resume. AI will create a polished, professional CV.
          </p>
          <button type="button" onClick={openGenerate}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700">
            <FiZap size={15} /> Generate CV
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cvs.map((cv) => (
              <div key={cv._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{cv.resumeName || "Untitled CV"}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">{cv.resumeTitle || "—"}</p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                    <FiZap size={10} /> AI
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <FiCalendar size={11} className="shrink-0" />
                  {formatDate(cv.createdAt)}
                </div>

                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100">
                  <button type="button"
                    onClick={() => openPreview(cv)}
                    disabled={!cv.hasPayload || loadingCvId === cv._id}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
                    {loadingCvId === cv._id ? (
                      <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Loading…</>
                    ) : (
                      <><FiEye size={13} /> View & Download</>
                    )}
                  </button>
                  <button type="button" onClick={openGenerate}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100">
                    <FiZap size={12} /> New
                  </button>
                  <button type="button" onClick={() => setDeleteCv(cv)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2 text-red-500 transition hover:bg-red-100 hover:border-red-300">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-slate-500">
                {pagination.total} CV{pagination.total === 1 ? "" : "s"} · page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((c) => Math.max(1, c - 1))}
                  disabled={pagination.page <= 1 || loading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50">
                  <FiChevronLeft size={15} /> Prev
                </button>
                <button type="button" onClick={() => setPage((c) => Math.min(pagination.pages, c + 1))}
                  disabled={pagination.page >= pagination.pages || loading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50">
                  Next <FiChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Generate Modal ─────────────────────────────────────────────── */}
      {generateOpen && (
        <GenerateModal
          aiModel={selectedModel} setAiModel={setSelectedModel}
          resumeFile={resumeFile} setResumeFile={setResumeFile}
          models={aiModels} modelsLoading={aiModelsLoading} modelsError={aiModelsError}
          isGenerating={isGenerating}
          onClose={() => !isGenerating && setGenerateOpen(false)}
          onSubmit={handleGenerate}
        />
      )}

      {/* ── Preview Modal ──────────────────────────────────────────────── */}
      {previewOpen && previewData && (
        <PreviewModal
          resumeJson={previewData.resumeJson}
          cvName={previewData.cvName}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────── */}
      {deleteCv && (
        <DeleteConfirmModal
          cvName={deleteCv.resumeName}
          onConfirm={handleDelete}
          onCancel={() => !isDeleting && setDeleteCv(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
