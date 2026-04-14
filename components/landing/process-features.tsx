import React from "react";
import {
  FiArrowRight,
  FiAward,
  FiCheck,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiLayers,
  FiTarget,
  FiTrendingUp,
  FiZap,
} from "react-icons/fi";

import { cn } from "@/lib/utils";

import { CONTAINER, getStepTheme, steps } from "./data";
import { CtaLink, SectionIntro } from "./shared";

function PasteMockup() {
  return (
    <div className="rounded-[1.5rem] border border-[#ffd7c9] bg-[#fffaf6] p-4 shadow-[0_25px_70px_-45px_rgba(255,107,74,0.7)] sm:rounded-[1.75rem] sm:p-5">
      <div className="mb-4 flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-full bg-[#ff6b4a]/75" />
        <div className="h-3 w-3 rounded-full bg-[#f59e0b]/75" />
        <div className="h-3 w-3 rounded-full bg-[#0f766e]/75" />
        <span className="ml-3 text-xs font-medium text-slate-400">
          Paste Job Description
        </span>
      </div>

      <div className="mb-4 rounded-[1.25rem] border border-[#ffd9ca] bg-[#fff1e8] p-4 font-mono text-xs leading-relaxed">
        <p className="mb-2 text-sm font-bold text-[#b45309]">
          Senior Product Manager - Swiggy
        </p>
        <p className="text-slate-600">
          We are looking for a data-driven PM with 3 plus years of experience in
          B2C product...
        </p>
        <p className="mt-2 text-slate-500">- Strong SQL and analytics experience</p>
        <p className="text-slate-500">- Cross-functional stakeholder management</p>
        <p className="text-slate-500">- Track record of 0 to 1 product launches</p>
        <span className="mt-2 block text-[11px] font-semibold text-[#d9481f]">
          Keywords captured successfully
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex h-10 flex-1 items-center rounded-xl border border-[#eadfce] bg-white px-3 text-xs text-slate-400">
          Paste your LinkedIn summary or work experience...
        </div>
        <button
          type="button"
          className="rounded-xl bg-[#102033] px-4 py-2 text-xs font-bold text-white shadow-[0_16px_35px_-22px_rgba(16,32,51,0.8)]"
        >
          Analyze JD
        </button>
      </div>
    </div>
  );
}

function GenerateMockup() {
  const tasks = [
    "Analyzing job requirements",
    "Extracting ATS keywords",
    "Rewriting experience bullets",
    "Formatting final resume",
  ];

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[#102033] p-5 text-white shadow-[0_28px_80px_-50px_rgba(15,23,42,0.9)] sm:rounded-[1.75rem] sm:p-6">
      <div className="mb-5 flex items-center gap-5">
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black text-[#7ee8dc]">100%</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-white">Crafting your resume...</p>
          <p className="mt-0.5 text-xs text-white/55">
            AI is tailoring content and structure
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const done = true;

          return (
            <div
              key={task}
              className={cn(
                "flex items-center gap-3 text-xs transition-colors duration-300",
                done ? "text-[#b6f6ee]" : "text-white/35",
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full shrink-0",
                  done ? "bg-[#0f766e] text-white" : "border border-white/15",
                )}
              >
                {done && <FiCheck className="h-2.5 w-2.5" />}
              </div>
              <span className="font-medium">{task}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
        <span className="text-white/45">AI-powered generation</span>
        <span className="font-semibold text-[#7ee8dc]">About 28 seconds</span>
      </div>
    </div>
  );
}

function DownloadMockup() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[#d0e6dd] bg-[#f7fbfa] p-4 shadow-[0_25px_70px_-45px_rgba(15,118,110,0.65)] sm:rounded-[1.75rem] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-[#d9ece6] pb-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#ff6b4a] to-[#0f766e] text-white sm:h-11 sm:w-11">
          <FiFileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#102033]">
              Resume_Priya_Sharma.pdf
            </p>
            <p className="text-xs text-slate-400">
              AI-generated / 2 pages / Ready
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit shrink-0 rounded-full border border-[#cfe7df] bg-white px-2.5 py-1 text-[11px] font-bold text-[#0f766e]">
          ATS 98/100
        </span>
      </div>
      <div className="mb-4 rounded-[1.25rem] border border-[#d9ece6] bg-white p-3">
        <div className="space-y-2">
          <div className="h-2.5 w-3/5 rounded-full bg-[#1f2937]" />
          <div className="h-2 w-2/5 rounded-full bg-[#d2ddd8]" />
          <div className="my-2 h-px bg-[#e1eeea]" />
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-[#ffd1c3]" />
            <div className="h-2 w-11/12 rounded-full bg-[#e2ece9]" />
            <div className="h-2 w-4/5 rounded-full bg-[#e2ece9]" />
          </div>
          <div className="my-2 h-px bg-[#e1eeea]" />
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-[#cdebe4]" />
            <div className="h-2 w-10/12 rounded-full bg-[#e2ece9]" />
            <div className="h-2 w-3/4 rounded-full bg-[#e2ece9]" />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#102033] py-3 text-sm font-bold text-white shadow-[0_18px_38px_-26px_rgba(16,32,51,0.85)]"
      >
        <FiDownload className="h-4 w-4" />
        Download PDF
      </button>

      <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Job match score</span>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#dceae5] sm:w-20 sm:flex-none">
            <div className="h-full w-[92%] rounded-full bg-linear-to-r from-[#ff6b4a] to-[#0f766e]" />
          </div>
          <span className="shrink-0 font-bold text-[#0f766e]">92%</span>
        </div>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  const mockups = [
    <PasteMockup key="paste" />,
    <GenerateMockup key="generate" />,
    <DownloadMockup key="download" />,
  ];

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
      style={{ background: "linear-gradient(180deg, #102033 0%, #14283f 100%)" }}
    >
      <div className={cn(CONTAINER, "relative")}>
        <SectionIntro
          badge="How It Works"
          title="Land your next role in"
          accent="3 clear steps"
          description="No long forms and no hours of manual editing. Paste the role, let the AI tailor the resume, and export a version that is ready to send."
          animation="fade-down"
          dark
        />

        <div className="mt-12 space-y-5 sm:mt-16 sm:space-y-6 lg:mt-20">
          {steps.map((step, index) => {
            const theme = getStepTheme(step.accent);
            const StepIcon = step.icon;
            const reversed = index % 2 === 1;

            return (
              <div
                key={step.number}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm sm:rounded-[2.25rem] sm:p-8"
                data-aos={
                  index === 0 ? "fade-right" : index === 1 ? "zoom-in-up" : "fade-left"
                }
                data-aos-delay={index * 90}
              >
                <div className="relative grid items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
                  <div className={cn(reversed && "lg:order-2")}>{mockups[index]}</div>
                  <div className={cn("relative", reversed && "lg:order-1")}>
                    <div className={cn("pointer-events-none absolute -top-8 hidden text-[5.5rem] font-black leading-none sm:block", reversed ? "right-0" : "left-0", theme.number)}>
                      {step.number}
                    </div>
                    <div className="relative pt-2 sm:pt-8">
                      <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]", theme.badge)}>
                        <StepIcon className="h-3.5 w-3.5" />
                        Step {step.number}
                      </span>
                      <h3 className="mt-4 font-heading text-2xl font-bold text-white sm:mt-5 sm:text-4xl">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-base font-semibold text-white/55 sm:text-lg">
                        {step.subtitle}
                      </p>
                      <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 sm:mt-5 sm:text-base">
                        {step.description}
                      </p>
                      <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                        {step.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-3 text-sm text-white/80">
                            <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", theme.bullet)}>
                              <FiCheck className="h-3 w-3" />
                            </span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center sm:mt-12" data-aos="zoom-in" data-aos-delay="120">
          <CtaLink href="/login" tone="coral" className="w-full px-8 py-4 text-base sm:w-auto">
            Try it on your next application
            <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </CtaLink>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(255,107,74,0.08), transparent 28%), linear-gradient(180deg, #fffaf4 0%, #f8f1e8 100%)",
        }}
      />

      <div className={cn(CONTAINER, "relative")}>
        <SectionIntro
          badge="Features"
          title="Everything you need to"
          accent="land the job"
          description="The landing page had the right content already. This redesign turns those same promises into a clearer and more compelling product story."
          animation="zoom-in-up"
        />

        <div className="mt-12 grid gap-4 sm:mt-16 lg:grid-cols-12">
          <div
            className="relative h-full overflow-hidden rounded-[1.75rem] bg-[#102033] p-5 text-white sm:rounded-[2rem] sm:p-8 lg:col-span-7"
            data-aos="fade-right"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,74,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.2),transparent_30%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  <FiTarget className="h-3.5 w-3.5 text-[#ffb489]" />
                  AI job matching
                </span>
                <h3 className="mt-4 font-heading text-2xl font-bold leading-tight sm:mt-5 sm:text-4xl">
                  Tailored to every job description, not just dressed up to look generic.
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65 sm:mt-4 sm:text-base">
                  The AI reads the role, pulls the right keywords, and rewrites
                  your experience into the language ATS systems and recruiters
                  actually reward.
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                    JD keywords
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["SQL", "Product Strategy", "A/B Testing", "Stakeholder Mgmt", "Agile", "P&L"].map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="hidden items-center justify-center md:flex">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10">
                    <FiArrowRight className="h-4 w-4 text-[#7ee8dc]" />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                    Resume output
                  </p>
                  <div className="space-y-3 text-sm text-white/78">
                    {[
                      "Led SQL-driven retention analysis and reduced churn by 22%.",
                      "Owned product strategy for an Rs. 15Cr portfolio with cross-functional alignment.",
                      "Ran 12 A/B tests that improved conversion by 18%.",
                    ].map((item) => (
                      <div key={item} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffb489]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:col-span-5">
            <div
              className="rounded-[1.75rem] border border-[#d8ece7] bg-[#eefaf7] p-5 sm:rounded-[2rem] sm:p-6"
              data-aos="flip-left"
              data-aos-delay="80"
            >
              <div className="flex items-center gap-5">
                <div className="relative h-20 w-20 shrink-0">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="31" fill="none" stroke="#cfe7df" strokeWidth="7" />
                    <circle cx="40" cy="40" r="31" fill="none" stroke="#0f766e" strokeWidth="7" strokeDasharray={`${2 * Math.PI * 31 * 0.98} ${2 * Math.PI * 31}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black text-[#0f766e]">98</span>
                  </div>
                </div>
                <div>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0f766e]">
                    <FiTrendingUp className="h-4 w-4" />
                  </div>
                  <h3 className="text-xl font-bold text-[#102033]">ATS optimizer</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Score your resume before you send it, not after you get ignored.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="rounded-[1.75rem] border border-[#f5dcc4] bg-[#fff3e4] p-5 sm:rounded-[2rem] sm:p-6"
              data-aos="flip-right"
              data-aos-delay="140"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#d97706]">
                <FiZap className="h-4 w-4" />
              </div>
              <h3 className="text-xl font-bold text-[#102033]">30-second build</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Fast enough for daily applications without turning quality into an afterthought.
              </p>
              <div className="mt-5 flex items-end gap-2">
                <div className="text-4xl font-black tracking-tight text-[#d97706] sm:text-5xl">28</div>
                <div className="pb-1 text-base font-bold text-[#f59e0b] sm:text-lg">sec</div>
              </div>
            </div>
          </div>

          <div
            className="rounded-[1.75rem] border border-[#d8e4f2] bg-[#f2f7fd] p-5 sm:rounded-[2rem] sm:p-6 lg:col-span-4"
            data-aos="fade-up"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#2563eb]">
              <FiLayers className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-bold text-[#102033]">50+ templates</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Clean, ATS-friendly layouts for engineering, product, design, and more.
            </p>
          </div>

          <div
            className="rounded-[1.75rem] border border-[#f1d9d0] bg-[#fff8f5] p-5 sm:rounded-[2rem] sm:p-6 lg:col-span-4"
            data-aos="fade-up"
            data-aos-delay="90"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#d9481f]">
              <FiEdit3 className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-bold text-[#102033]">Smart editing</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Weak bullets get rewritten into concise, outcome-focused lines.
            </p>
          </div>

          <div
            className="rounded-[1.75rem] border border-[#d5e7df] bg-[#f4fbf8] p-5 sm:rounded-[2rem] sm:p-6 lg:col-span-4"
            data-aos="fade-up"
            data-aos-delay="180"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0f766e]">
              <FiAward className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-bold text-[#102033]">Version tracking</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Keep a tailored resume for each role instead of overwriting the same file.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

