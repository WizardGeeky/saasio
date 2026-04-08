"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const DURATION = 4000;

const toastStyles: Record<ToastType, { bar: string; icon: React.ReactNode; bg: string; border: string; text: string }> = {
  success: {
    bar: "bg-emerald-500",
    bg: "bg-white",
    border: "border-emerald-100",
    text: "text-slate-800",
    icon: <FiCheckCircle className="text-emerald-500 shrink-0" size={18} />,
  },
  error: {
    bar: "bg-red-500",
    bg: "bg-white",
    border: "border-red-100",
    text: "text-slate-800",
    icon: <FiAlertCircle className="text-red-500 shrink-0" size={18} />,
  },
  info: {
    bar: "bg-blue-500",
    bg: "bg-white",
    border: "border-blue-100",
    text: "text-slate-800",
    icon: <FiInfo className="text-blue-500 shrink-0" size={18} />,
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss
    timerRef.current = setTimeout(dismiss, DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [dismiss]);

  const style = toastStyles[toast.type];

  return (
    <div
      className={`
        relative flex items-start gap-3 w-full rounded-xl border shadow-lg overflow-hidden
        px-4 py-3.5 transition-all duration-300 ease-out
        ${style.bg} ${style.border}
        ${visible && !leaving ? "opacity-100 translate-y-0 translate-x-0" : "opacity-0 -translate-y-2 translate-x-0 sm:translate-y-0 sm:translate-x-8"}
      `}
    >
      {/* Left accent bar */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar} rounded-l-xl`} />

      {/* Icon */}
      <div className="mt-0.5 ml-1">{style.icon}</div>

      {/* Message */}
      <p className={`flex-1 text-sm font-medium leading-snug ${style.text}`}>{toast.message}</p>

      {/* Close button */}
      <button
        onClick={dismiss}
        className="shrink-0 mt-0.5 p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Dismiss"
      >
        <FiX size={15} />
      </button>

      {/* Progress bar */}
      <span
        className={`absolute bottom-0 left-0 h-0.5 ${style.bar} opacity-30`}
        style={{ animation: `toast-progress ${DURATION}ms linear forwards` }}
      />
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const value: ToastContextValue = React.useMemo(() => ({
    toast: add,
    success: (msg) => add(msg, "success"),
    error: (msg) => add(msg, "error"),
    info: (msg) => add(msg, "info"),
  }), [add]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="assertive"
        className="fixed top-0 inset-x-0 z-9999 flex flex-col gap-2 items-stretch pointer-events-none px-4 pt-4 sm:top-5 sm:right-5 sm:left-auto sm:inset-x-auto sm:w-88 sm:items-end sm:px-0 sm:pt-0"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
