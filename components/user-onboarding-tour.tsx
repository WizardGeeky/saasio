"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    FiPieChart, FiZap, FiFileText, FiDownload,
    FiBookmark, FiCreditCard, FiUser, FiMessageSquare,
    FiArrowRight, FiArrowLeft, FiX, FiCheckCircle,
    FiLayers,
} from "react-icons/fi";
import { useDashTheme } from "@/app/contexts/DashThemeContext";

const STORAGE_KEY = "saasio-onboarding-done";

type Step = {
    id: string;
    icon: React.ElementType;
    label: string;
    href: string;
    title: string;
    description: string;
    tip: string;
};

const STEPS: Step[] = [
    {
        id: "analytics",
        icon: FiPieChart,
        label: "My Analytics",
        href: "/dashboard/my-analytics",
        title: "Your Personal Dashboard",
        description:
            "This is your home base. See how many ATS scans you've run, your average score, active subscriptions, and complaints — all in one glance.",
        tip: "Use the time-range buttons (Today, 7 Days, 30 Days…) to filter the stats by period.",
    },
    {
        id: "ats",
        icon: FiZap,
        label: "AI ATS",
        href: "/dashboard/ai-ats",
        title: "Scan Your Resume with AI",
        description:
            "Paste a job description, upload your resume, and get an instant ATS compatibility score. The AI highlights gaps in skills, experience, and keywords.",
        tip: "Aim for a score above 75 to pass most automated HR filters.",
    },
    {
        id: "resumes",
        icon: FiFileText,
        label: "Resumes",
        href: "/dashboard/resume-config",
        title: "Browse Resume Templates",
        description:
            "Explore professionally designed resume templates. Pick a template, fill in your details, and our AI builds a polished resume tailored to the role.",
        tip: "You need an active subscription to generate and download resumes.",
    },
    {
        id: "my-resumes",
        icon: FiDownload,
        label: "My Resumes",
        href: "/dashboard/my-resumes",
        title: "Your Resume History",
        description:
            "Every resume you've ever generated lives here. Preview, re-download, or use a previous one as a starting point for your next application.",
        tip: "Resumes are sorted by newest first — you can always come back here.",
    },
    {
        id: "subscription",
        icon: FiBookmark,
        label: "My Subscription",
        href: "/dashboard/my-subscription",
        title: "Your Current Plan",
        description:
            "View your active subscription, what features are included, and when it renews. Upgrading gives you more ATS scans and resume downloads per month.",
        tip: "No subscription yet? Head to Resumes and choose a plan that fits your needs.",
    },
    {
        id: "transactions",
        icon: FiCreditCard,
        label: "My Transactions",
        href: "/dashboard/my-transactions",
        title: "Payment History",
        description:
            "A full record of every payment you've made — plan purchases, renewals, and one-time orders. Handy for expense tracking or if you ever need a receipt.",
        tip: "Transaction IDs are shown here if you ever need to contact support about a charge.",
    },
    {
        id: "profile",
        icon: FiUser,
        label: "Profile",
        href: "/dashboard/profile",
        title: "Update Your Profile",
        description:
            "Keep your name, email, mobile number, occupation, and location up to date. Accurate profile info helps us personalise your resume suggestions.",
        tip: "Your email here is what we use to send plan renewal and ATS report notifications.",
    },
    {
        id: "complaints",
        icon: FiMessageSquare,
        label: "My Complaints",
        href: "/dashboard/complaints/my",
        title: "Support & Complaints",
        description:
            "Run into a problem? Submit a support ticket and track its status right here. Our team reviews every complaint and responds as soon as possible.",
        tip: "Include your transaction ID when raising a billing issue — it speeds up resolution.",
    },
];

// ─── Progress dots ─────────────────────────────────────────────────────────────

function ProgressDots({ total, current, isDark }: { total: number; current: number; isDark: boolean }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
                <span
                    key={i}
                    className={`block rounded-full transition-all duration-300 ${
                        i === current
                            ? isDark
                                ? "w-5 h-2 bg-[#ffb78d]"
                                : "w-5 h-2 bg-[#d9481f]"
                            : i < current
                            ? isDark
                                ? "w-2 h-2 bg-[#ffb78d]/50"
                                : "w-2 h-2 bg-[#d9481f]/40"
                            : isDark
                            ? "w-2 h-2 bg-white/15"
                            : "w-2 h-2 bg-slate-300"
                    }`}
                />
            ))}
        </div>
    );
}

// ─── Sidebar mini-map ──────────────────────────────────────────────────────────

function SidebarMap({ activeId, isDark }: { activeId: string; isDark: boolean }) {
    return (
        <div
            className={`flex flex-col gap-1 rounded-xl border p-3 ${
                isDark ? "border-white/10 bg-white/4" : "border-slate-200 bg-slate-50"
            }`}
        >
            <p className={`mb-1.5 text-[10px] font-semibold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Navigation
            </p>
            {STEPS.map((s) => {
                const Icon = s.icon;
                const isActive = s.id === activeId;
                return (
                    <div
                        key={s.id}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200 ${
                            isActive
                                ? isDark
                                    ? "bg-[linear-gradient(135deg,rgba(255,166,130,0.2),rgba(45,212,191,0.1))] text-white font-semibold"
                                    : "bg-[linear-gradient(135deg,#fff4ec,#fffaf6)] text-[#102033] font-semibold border border-[#ffd7c9]"
                                : isDark
                                ? "text-slate-500"
                                : "text-slate-400"
                        }`}
                    >
                        <Icon size={12} className={isActive ? (isDark ? "text-[#ffb78d]" : "text-[#d9481f]") : ""} />
                        <span>{s.label}</span>
                        {isActive && (
                            <span
                                className={`ml-auto h-1.5 w-1.5 rounded-full ${
                                    isDark ? "bg-[#ffb78d]" : "bg-[#d9481f]"
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function UserOnboardingTour({ userRole }: { userRole: string }) {
    const { isDark } = useDashTheme();
    const router = useRouter();
    const [step, setStep] = useState(0); // 0 = welcome, 1..N = steps, N+1 = done
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);

    const totalSteps = STEPS.length;
    const isWelcome = step === 0;
    const isDone = step === totalSteps + 1;
    const currentStep = STEPS[step - 1] ?? null;

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (userRole.toUpperCase() !== "USER") return;

        // Auto-show for first-time users
        const done = localStorage.getItem(STORAGE_KEY);
        if (!done) {
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, [userRole]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (userRole.toUpperCase() !== "USER") return;

        // Allow existing users to re-launch the tour via custom event
        const handler = () => {
            localStorage.removeItem(STORAGE_KEY);
            setStep(0);
            setExiting(false);
            setVisible(true);
        };
        window.addEventListener("saasio:show-tour", handler);
        return () => window.removeEventListener("saasio:show-tour", handler);
    }, [userRole]);

    function dismiss(markDone = true) {
        setExiting(true);
        setTimeout(() => {
            setVisible(false);
            setExiting(false);
            if (markDone) {
                localStorage.setItem(STORAGE_KEY, "1");
            }
        }, 280);
    }

    function handleNext() {
        if (step === totalSteps) {
            setStep(totalSteps + 1); // show done screen
        } else {
            setStep((s) => s + 1);
        }
    }

    function handleBack() {
        setStep((s) => Math.max(0, s - 1));
    }

    function handleFinish() {
        dismiss(true);
        router.push("/dashboard/my-analytics");
    }

    function handleGoTo(href: string) {
        dismiss(true);
        router.push(href);
    }

    if (!visible) return null;

    const StepIcon = currentStep?.icon;

    // Shared card wrapper
    const cardBase = `relative w-full max-w-2xl rounded-2xl shadow-2xl transition-all duration-300 ${
        exiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
    } ${
        isDark
            ? "bg-[#0f1623] border border-white/10 text-white"
            : "bg-white border border-slate-200 text-[#102033]"
    }`;

    return (
        // Backdrop
        <div
            className={`fixed inset-0 z-200 flex items-center justify-center p-4 transition-opacity duration-300 ${
                exiting ? "opacity-0" : "opacity-100"
            } ${isDark ? "bg-black/70" : "bg-[#102033]/40"} backdrop-blur-sm`}
        >
            {/* ── Welcome screen ─────────────────────────────────────────────── */}
            {isWelcome && (
                <div className={cardBase}>
                    {/* Close */}
                    <button
                        onClick={() => dismiss(true)}
                        className={`absolute right-4 top-4 rounded-lg p-1.5 transition-colors ${
                            isDark ? "text-slate-500 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        }`}
                        aria-label="Skip tour"
                    >
                        <FiX size={16} />
                    </button>

                    <div className="flex flex-col items-center px-8 pb-8 pt-10 text-center">
                        {/* Logo mark */}
                        <div
                            className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
                                isDark
                                    ? "bg-[linear-gradient(135deg,rgba(255,166,130,0.2),rgba(45,212,191,0.1))] border border-[#ffb78d]/20"
                                    : "bg-[linear-gradient(135deg,#fff4ec,#ffe8d6)] border border-[#ffd7c9]"
                            }`}
                        >
                            <FiLayers size={28} className={isDark ? "text-[#ffb78d]" : "text-[#d9481f]"} />
                        </div>

                        <h1 className="mb-2 text-2xl font-bold">Welcome to SAASIO!</h1>
                        <p className={`mb-6 max-w-md text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            Let's take a 2-minute tour so you know exactly where everything is and how to get the most out of your account.
                        </p>

                        {/* Feature preview pills */}
                        <div className="mb-8 flex flex-wrap justify-center gap-2">
                            {[
                                { icon: FiZap, text: "AI Resume Scanning" },
                                { icon: FiFileText, text: "Resume Templates" },
                                { icon: FiBookmark, text: "Subscriptions" },
                                { icon: FiMessageSquare, text: "24/7 Support" },
                            ].map(({ icon: Icon, text }) => (
                                <span
                                    key={text}
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                                        isDark ? "bg-white/[0.07] text-slate-300" : "bg-slate-100 text-slate-600"
                                    }`}
                                >
                                    <Icon size={11} />
                                    {text}
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => dismiss(true)}
                                className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
                                    isDark ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                }`}
                            >
                                Skip tour
                            </button>
                            <button
                                onClick={() => setStep(1)}
                                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                                    isDark
                                        ? "bg-[linear-gradient(135deg,#ff8c5a,#2dd4bf)] text-white hover:opacity-90 shadow-[0_8px_24px_-8px_rgba(255,140,90,0.5)]"
                                        : "bg-[linear-gradient(135deg,#d9481f,#0f766e)] text-white hover:opacity-90 shadow-[0_8px_24px_-8px_rgba(217,72,31,0.4)]"
                                }`}
                            >
                                Start Tour <FiArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Done screen ────────────────────────────────────────────────── */}
            {isDone && (
                <div className={cardBase}>
                    <div className="flex flex-col items-center px-8 pb-8 pt-10 text-center">
                        <div
                            className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
                                isDark
                                    ? "bg-[linear-gradient(135deg,rgba(45,212,191,0.2),rgba(99,102,241,0.15))] border border-[#2dd4bf]/20"
                                    : "bg-[linear-gradient(135deg,#f0fdf4,#dcfce7)] border border-green-200"
                            }`}
                        >
                            <FiCheckCircle size={28} className={isDark ? "text-[#2dd4bf]" : "text-green-600"} />
                        </div>

                        <h1 className="mb-2 text-2xl font-bold">You're all set!</h1>
                        <p className={`mb-8 max-w-md text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            You now know your way around. Jump into My Analytics to see your stats, or head to Resumes to start building.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleGoTo("/dashboard/resume-config")}
                                className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
                                    isDark ? "text-slate-400 hover:text-white hover:bg-white/10 border border-white/10" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200"
                                }`}
                            >
                                Browse Resumes
                            </button>
                            <button
                                onClick={handleFinish}
                                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                                    isDark
                                        ? "bg-[linear-gradient(135deg,#ff8c5a,#2dd4bf)] text-white hover:opacity-90 shadow-[0_8px_24px_-8px_rgba(255,140,90,0.5)]"
                                        : "bg-[linear-gradient(135deg,#d9481f,#0f766e)] text-white hover:opacity-90 shadow-[0_8px_24px_-8px_rgba(217,72,31,0.4)]"
                                }`}
                            >
                                Go to My Analytics <FiArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step screen ────────────────────────────────────────────────── */}
            {!isWelcome && !isDone && currentStep && (
                <div className={`${cardBase} overflow-hidden`}>
                    {/* Close */}
                    <button
                        onClick={() => dismiss(true)}
                        className={`absolute right-4 top-4 z-10 rounded-lg p-1.5 transition-colors ${
                            isDark ? "text-slate-500 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        }`}
                        aria-label="Skip tour"
                    >
                        <FiX size={16} />
                    </button>

                    <div className="flex flex-col sm:flex-row">
                        {/* Left: sidebar mini-map */}
                        <div
                            className={`hidden sm:flex flex-col justify-center px-5 py-6 sm:w-44 shrink-0 ${
                                isDark ? "border-r border-white/7 bg-white/2" : "border-r border-slate-100 bg-slate-50/80"
                            }`}
                        >
                            <SidebarMap activeId={currentStep.id} isDark={isDark} />
                        </div>

                        {/* Right: step content */}
                        <div className="flex flex-1 flex-col px-6 py-6">
                            {/* Step counter */}
                            <div className="mb-4 flex items-center justify-between">
                                <span className={`text-xs font-semibold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                    Step {step} of {totalSteps}
                                </span>
                                <ProgressDots total={totalSteps} current={step - 1} isDark={isDark} />
                            </div>

                            {/* Icon + title */}
                            <div className="mb-4 flex items-start gap-3">
                                <div
                                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                        isDark
                                            ? "bg-[linear-gradient(135deg,rgba(255,166,130,0.18),rgba(45,212,191,0.1))] border border-[#ffb78d]/20"
                                            : "bg-[linear-gradient(135deg,#fff4ec,#ffe8d6)] border border-[#ffd7c9]"
                                    }`}
                                >
                                    {StepIcon && <StepIcon size={18} className={isDark ? "text-[#ffb78d]" : "text-[#d9481f]"} />}
                                </div>
                                <div>
                                    <p className={`text-[11px] font-medium uppercase tracking-wider mb-0.5 ${isDark ? "text-[#ffb78d]/70" : "text-[#d9481f]/70"}`}>
                                        {currentStep.label}
                                    </p>
                                    <h2 className="text-lg font-bold leading-tight">{currentStep.title}</h2>
                                </div>
                            </div>

                            {/* Description */}
                            <p className={`mb-4 text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                {currentStep.description}
                            </p>

                            {/* Tip */}
                            <div
                                className={`mb-6 flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs leading-relaxed ${
                                    isDark
                                        ? "bg-[#ffb78d]/8 border border-[#ffb78d]/15 text-[#ffb78d]/80"
                                        : "bg-[#fff4ec] border border-[#ffd7c9] text-[#8a3a10]"
                                }`}
                            >
                                <span className="mt-0.5 shrink-0 font-bold">💡</span>
                                <span>{currentStep.tip}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 mt-auto">
                                <button
                                    onClick={handleBack}
                                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                                        isDark ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    <FiArrowLeft size={14} /> Back
                                </button>

                                <button
                                    onClick={() => handleGoTo(currentStep.href)}
                                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                                        isDark
                                            ? "border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                                            : "border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                                    }`}
                                >
                                    Open {currentStep.label}
                                </button>

                                <button
                                    onClick={handleNext}
                                    className={`ml-auto flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                                        isDark
                                            ? "bg-[linear-gradient(135deg,#ff8c5a,#2dd4bf)] text-white hover:opacity-90 shadow-[0_6px_18px_-6px_rgba(255,140,90,0.5)]"
                                            : "bg-[linear-gradient(135deg,#d9481f,#0f766e)] text-white hover:opacity-90 shadow-[0_6px_18px_-6px_rgba(217,72,31,0.4)]"
                                    }`}
                                >
                                    {step === totalSteps ? "Finish" : "Next"} <FiArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
