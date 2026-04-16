import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BiLogoLinkedin } from "react-icons/bi";
import {
  FiArrowRight,
  FiAward,
  FiBriefcase,
  FiCheck,
  FiCpu,
  FiStar,
} from "react-icons/fi";
import { SiIndeed } from "react-icons/si";

import { cn } from "@/lib/utils";

import { CONTAINER, RESUME_JOBS, STATS } from "./data";
import { CtaLink } from "./shared";

function NaukriMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="#2563eb" />
      <path
        d="M8 16V8h1.9l4.5 4.6V8H16v8h-1.8l-4.6-4.6V16H8Z"
        fill="#fff"
      />
      <circle cx="17.8" cy="6.2" r="1.6" fill="#fb923c" />
    </svg>
  );
}

const WORKS_WITH_ITEMS = [
  {
    label: "LinkedIn",
    icon: BiLogoLinkedin,
    iconClassName: "text-[#0a66c2]",
  },
  {
    label: "Naukri",
    icon: NaukriMark,
  },
  {
    label: "Indeed",
    icon: SiIndeed,
    iconClassName: "text-[#2557a7]",
  },
  {
    label: "Company career pages",
    icon: FiBriefcase,
    iconClassName: "text-[#b45309]",
  },
];

export function AIScannerAnimation() {
  const [activeJob, setActiveJob] = useState(0);
  const [scanPhase, setScanPhase] = useState<"scanning" | "scoring" | "done">(
    "scanning",
  );
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeouts: Array<ReturnType<typeof setTimeout>> = [];

    const clearTimers = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      timeouts.forEach(clearTimeout);
    };

    const cycle = () => {
      if (!isMounted) {
        return;
      }

      setScanPhase("scanning");
      setScanY(0);
      let y = 0;

      intervalId = setInterval(() => {
        y += 2.5;
        setScanY(y);

        if (y >= 100) {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }

          setScanPhase("scoring");

          timeouts.push(
            setTimeout(() => {
              setScanPhase("done");

              timeouts.push(
                setTimeout(() => {
                  setActiveJob((current) => (current + 1) % RESUME_JOBS.length);
                  cycle();
                }, 1700),
              );
            }, 850),
          );
        }
      }, 30);
    };

    cycle();

    return () => {
      isMounted = false;
      clearTimers();
    };
  }, []);

  const job = RESUME_JOBS[activeJob];

  return (
    <div className="relative mx-auto w-full max-w-[440px] select-none">
      <div className="absolute inset-0 scale-105 rounded-[2rem] bg-[#ffb99e]/35 blur-3xl" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-[#eadfce] bg-[#fffdf9] shadow-[0_38px_90px_-38px_rgba(15,23,42,0.5)] sm:rounded-[2rem]">
        <div className="bg-linear-to-r from-[#0f766e] via-[#14b8a6] to-[#0f766e] px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <motion.div
                key={`${activeJob}-icon`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white sm:h-10 sm:w-10"
              >
                <FiCpu className="h-4 w-4" />
              </motion.div>
              <div className="min-w-0">
                <motion.p
                  key={`${activeJob}-title`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="truncate text-sm font-bold text-white"
                >
                  {job.title}
                </motion.p>
                <p className="truncate text-xs font-medium text-white/75">
                  {job.company}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            </div>
          </div>
        </div>

        <div className="relative h-40 px-4 pt-4 sm:h-[172px] sm:px-5 sm:pt-5">
          <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#f7efe5] p-4">
            <div className="space-y-2.5">
              <div className="h-3 w-2/5 rounded-full bg-[#1f2937]" />
              <div className="h-2.5 w-1/3 rounded-full bg-[#d8cfc4]" />
              <div className="my-1.5 h-px bg-[#e6d8c7]" />
              {[
                { width: "100%", color: "bg-[#ffd1c3]" },
                { width: "88%", color: "bg-[#e4ddd4]" },
                { width: "76%", color: "bg-[#e4ddd4]" },
                { width: "94%", color: "bg-[#cdebe4]" },
                { width: "62%", color: "bg-[#e4ddd4]" },
                { width: "80%", color: "bg-[#e4ddd4]" },
              ].map((line, index) => (
                <div
                  key={index}
                  className={cn("h-2 rounded-full", line.color)}
                  style={{ width: line.width }}
                />
              ))}
            </div>
          </div>

          {scanPhase === "scanning" && (
            <>
              <motion.div
                className="pointer-events-none absolute left-4 right-4 h-[2px] sm:left-5 sm:right-5"
                style={{ top: `${scanY}%` }}
              >
                <div className="h-full bg-linear-to-r from-transparent via-[#0f766e] to-transparent opacity-90" />
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#14b8a6]/45 to-transparent blur-sm" />
              </motion.div>
              <div
                className="pointer-events-none absolute left-4 right-4 top-4 rounded-[1.5rem] bg-[#0f766e]/5 transition-all sm:left-5 sm:right-5 sm:top-5"
                style={{ height: `max(calc(${scanY}% - 16px), 0px)` }}
              />
            </>
          )}
        </div>

        <div className="px-4 pb-4 pt-3 sm:px-5 sm:pt-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8c6d54]">
            Matched keywords
          </p>
          <div className="flex flex-wrap gap-2">
            {job.keywords.map((keyword, index) => (
              <motion.span
                key={keyword}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={
                  scanPhase !== "scanning"
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0.35, scale: 0.92 }
                }
                transition={{ delay: index * 0.08 }}
                className="inline-flex items-center gap-1 rounded-full border border-[#ffd9ca] bg-[#fff4ec] px-2 py-1 text-[10px] font-semibold text-[#b45309] sm:px-2.5 sm:text-[11px]"
              >
                <FiCheck className="h-3 w-3" />
                {keyword}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="border-t border-[#eadfce] px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#d5efe9" strokeWidth="5" />
                <motion.circle
                  cx="28"
                  cy="28"
                  r="22"
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                  animate={
                    scanPhase !== "scanning"
                      ? { strokeDashoffset: 2 * Math.PI * 22 * (1 - job.ats / 100) }
                      : { strokeDashoffset: 2 * Math.PI * 22 }
                  }
                  transition={{ duration: 0.75, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={`${activeJob}-ats`}
                  initial={{ opacity: 0 }}
                  animate={scanPhase !== "scanning" ? { opacity: 1 } : { opacity: 0 }}
                  className="text-sm font-black text-[#0f766e]"
                >
                  {job.ats}
                </motion.span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8c6d54]">
                  ATS
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-600 sm:text-sm">
                  Job match score
                </span>
                <motion.span
                  key={`${activeJob}-score`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={
                    scanPhase !== "scanning"
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0 }
                  }
                  className="text-lg font-black text-[#d9481f]"
                >
                  {job.score}%
                </motion.span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#e8e0d7]">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-[#ff6b4a] to-[#0f766e]"
                  initial={{ width: 0 }}
                  animate={
                    scanPhase !== "scanning"
                      ? { width: `${job.score}%` }
                      : { width: 0 }
                  }
                  transition={{ duration: 0.85, ease: "easeOut" }}
                />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={scanPhase === "done" ? { opacity: 1 } : { opacity: 0 }}
                className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#0f766e]"
              >
                <FiCheck className="h-3 w-3" />
                Resume ready to export
              </motion.p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-[#eadfce] bg-[#faf4ec] px-4 py-2.5 sm:px-5">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              scanPhase === "done" ? "bg-[#0f766e]" : "bg-[#f59e0b]",
            )}
          />
          <motion.span
            key={scanPhase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] font-semibold text-slate-500"
          >
            {scanPhase === "scanning"
              ? "AI scanning resume..."
              : scanPhase === "scoring"
                ? "Computing scores..."
                : "Analysis complete"}
          </motion.span>
          <div className="flex-1" />
          <span className="text-[11px] text-slate-400">
            {activeJob + 1}/{RESUME_JOBS.length}
          </span>
        </div>
      </div>

      <div className="absolute -right-2 top-8 hidden rounded-2xl border border-[#eadfce] bg-white/90 px-3 py-2 shadow-[0_18px_35px_-24px_rgba(15,23,42,0.45)] sm:flex sm:items-center sm:gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" />
        <span className="text-xs font-semibold text-[#102033]">Live AI analysis</span>
      </div>

      <div className="absolute -bottom-3 left-0 hidden items-center gap-2 rounded-2xl border border-[#eadfce] bg-white/90 px-3 py-2 shadow-[0_18px_35px_-24px_rgba(15,23,42,0.45)] sm:flex">
        <FiStar className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
        <span className="text-xs font-semibold text-[#102033]">10,000+ users</span>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-14 pt-24 sm:pb-24 sm:pt-32 lg:pb-28">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,107,74,0.22), transparent 34%), radial-gradient(circle at 82% 18%, rgba(15,118,110,0.18), transparent 28%), linear-gradient(180deg, #fffaf4 0%, #f2eadf 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="absolute left-1/2 top-16 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-white/55 blur-3xl sm:h-[32rem] sm:w-[32rem]" />

      <div className={cn(CONTAINER, "relative")}>
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-14">
          <div className="mx-auto max-w-[23rem] text-center sm:mx-0 sm:max-w-2xl sm:text-left" data-aos="fade-right">
            <span className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full border border-[#e6d8c7] bg-white/80 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8c6d54] shadow-[0_15px_30px_-20px_rgba(15,23,42,0.3)] sm:mx-0 sm:justify-start sm:gap-2 sm:px-4 sm:text-[11px] sm:tracking-[0.22em]">
              <FiAward className="h-3.5 w-3.5 text-[#d9481f]" />
              <span className="sm:hidden">Built for Indian job seekers</span>
              <span className="hidden sm:inline">
                Resume studio for Indian job seekers
              </span>
            </span>

            <h1 className="mt-4 font-heading text-[2.14rem] font-bold leading-[0.94] tracking-[-0.05em] text-[#102033] [text-wrap:balance] sm:mt-6 sm:text-6xl sm:leading-[0.97] sm:tracking-normal lg:text-7xl">
              Create a resume from any job description
              <span className="mt-1.5 block text-[#d9481f] sm:mt-0">
                recruiters want to open.
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-[19.5rem] text-[14px] leading-7 text-slate-600 sm:mx-0 sm:mt-6 sm:max-w-xl sm:text-xl sm:leading-8">
              SAASIO crafts ATS-optimized resumes in under 30 seconds, rewrites
              your story for the exact role, and lets you pay once instead of
              subscribing forever.
            </p>

            <div className="mt-6 grid gap-2.5 sm:mt-8 sm:flex sm:gap-3">
              <motion.div
                animate={{
                  y: [0, -2, 0],
                  boxShadow: [
                    "0 18px 38px -22px rgba(255,107,74,0.35)",
                    "0 24px 48px -22px rgba(255,107,74,0.5)",
                    "0 18px 38px -22px rgba(255,107,74,0.35)",
                  ],
                }}
                transition={{
                  duration: 2.6,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                className="rounded-full"
              >
              <CtaLink href="/login" className="w-full justify-center px-6 py-3.5 text-[15px] sm:w-auto sm:justify-start sm:px-7 sm:py-4 sm:text-base">
                Start Building
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
                  className="inline-flex"
                >
                  <FiArrowRight className="h-4 w-4" />
                </motion.span>
              </CtaLink>
              </motion.div>
              <a
                href="#how-it-works"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d8c9b6] bg-white/80 px-6 py-3.5 text-[15px] font-semibold text-[#102033] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white sm:w-auto sm:px-7 sm:py-4 sm:text-base"
              >
                See how it works
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 sm:mt-8 sm:justify-start sm:text-sm">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c6d54] sm:mr-2 sm:text-xs">
                Works with
              </span>
              {WORKS_WITH_ITEMS.map(({ label, icon: Icon, iconClassName }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e6d8c7] bg-white/75 px-3 py-1.5 font-medium"
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClassName)} />
                  <span>{label}</span>
                </span>
              ))}
            </div>
          </div>

          <div
            className="relative mx-auto w-full max-w-[560px]"
            data-aos="zoom-in-left"
            data-aos-delay="120"
          >
            <div className="absolute inset-x-10 -top-10 h-28 rounded-full bg-[#ffcfbe]/55 blur-3xl" />
            <div className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-[#5fd3c6]/20 blur-3xl" />

            <div className="relative rounded-[2rem] border border-white/70 bg-white/45 p-3 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:rounded-[2.5rem] sm:p-5">
              <div className="mb-4 flex flex-col items-start gap-3 rounded-[1.35rem] border border-[#eadfce] bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-[1.5rem]">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c6d54]">
                    Resume command center
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#102033] sm:text-[15px]">
                    Watch the resume adapt to the role in real time
                  </p>
                </div>
                <span className="rounded-full bg-[#102033] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white sm:text-[11px]">
                  Live
                </span>
              </div>
              <AIScannerAnimation />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StatsSection() {
  return (
    <section className="relative -mt-4 pb-20 sm:-mt-6 sm:pb-24">
      <div className={CONTAINER}>
        <div
          className="rounded-[2rem] border border-[#e7dbc9] bg-white/80 p-3 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:rounded-[2.25rem] sm:p-6"
          data-aos="fade-up"
        >
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {STATS.map((stat, index) => (
              <div
                key={stat.label}
                className="rounded-[1.35rem] border border-[#eee3d5] bg-[#fffdf9] p-4 sm:rounded-[1.75rem] sm:p-5"
                data-aos="flip-up"
                data-aos-delay={index * 70}
              >
                <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-2xl sm:h-11 sm:w-11", stat.accent)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-3xl font-black tracking-tight text-[#102033] sm:mt-5 sm:text-4xl">
                  {stat.value}
                  {stat.suffix}
                </div>
                <p className="mt-2 text-xs font-medium text-slate-600 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
