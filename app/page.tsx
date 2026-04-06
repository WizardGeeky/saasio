"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FiZap,
  FiTarget,
  FiCheck,
  FiArrowRight,
  FiStar,
  FiChevronDown,
  FiMenu,
  FiX,
  FiDownload,
  FiCpu,
  FiShield,
  FiLayers,
  FiBriefcase,
  FiEdit3,
  FiAward,
  FiTrendingUp,
  FiCheckCircle,
  FiFileText,
} from "react-icons/fi";

// ─── useInView ────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Reveal ───────────────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  dir = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  dir?: "up" | "left" | "right" | "scale";
  className?: string;
}) {
  const { ref, inView } = useInView();
  const anim = {
    up: "animate-fade-up",
    left: "animate-slide-right",
    right: "animate-slide-left",
    scale: "animate-scale-in",
  }[dir];
  return (
    <div
      ref={ref}
      className={`${className} ${inView ? anim : "opacity-0"}`}
      style={
        inView
          ? { animationDelay: `${delay}ms`, animationFillMode: "both" }
          : undefined
      }
    >
      {children}
    </div>
  );
}

// ─── SectionBadge ─────────────────────────────────────────────────────────────

function SectionBadge({ label }: { label: string }) {
  return (
    <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest rounded-full mb-4 border border-emerald-200">
      {label}
    </span>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navLinks = [
    { label: "Features", id: "#features" },
    { label: "How It Works", id: "#how" },
    { label: "Pricing", id: "#pricing" },
    { label: "FAQ", id: "#faq" },
  ];

  const go = (id: string) => {
    setOpen(false);
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200/80"
          : "bg-white/80 backdrop-blur-md"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
            <FiLayers size={18} />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            SAAS<span className="text-emerald-600">IO</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map((l) => (
            <li key={l.label}>
              <button
                onClick={() => go(l.id)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors px-2"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
          >
            Get Started <FiArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pb-5 pt-2 space-y-1 animate-fade-up shadow-lg">
          {navLinks.map((l) => (
            <button
              key={l.label}
              onClick={() => go(l.id)}
              className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
            >
              {l.label}
            </button>
          ))}
          <div className="pt-3 grid grid-cols-2 gap-2 border-t border-slate-100 mt-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-center py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-center py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white">
      {/* Light green gradient wash */}
      <div className="absolute inset-0 bg-linear-to-br from-emerald-50 via-white to-teal-50/60 pointer-events-none" />

      {/* Decorative circles */}
      <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-24 w-[360px] h-[360px] bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Dot grid top-right */}
      <div
        className="absolute top-0 right-0 w-64 h-64 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #059669 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ── Left copy ── */}
          <div>
            {/* Live badge */}
            <div
              className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full mb-6"
              style={{ animationFillMode: "both" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span className="text-xs font-bold text-emerald-700 tracking-wide">
                AI-Powered Resume Builder
              </span>
            </div>

            {/* Headline */}
            <h1
              className="animate-fade-up text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-5"
              style={{ animationDelay: "80ms", animationFillMode: "both" }}
            >
              Build Resumes That
              <br />
              <span className="text-gradient">Land Your Dream Job</span>
            </h1>

            {/* Description */}
            <p
              className="animate-fade-up text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-lg"
              style={{ animationDelay: "160ms", animationFillMode: "both" }}
            >
              Our AI agents analyze any job description and craft a perfectly
              tailored, ATS-optimized resume in seconds. Your next interview is
              one click away — starting at just{" "}
              <span className="text-emerald-600 font-bold">₹9</span>.
            </p>

            {/* CTA buttons */}
            <div
              className="animate-fade-up flex flex-col sm:flex-row gap-3 mb-10"
              style={{ animationDelay: "240ms", animationFillMode: "both" }}
            >
              <Link
                href="/login"
                className="group flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-xl shadow-emerald-600/25 transition-all active:scale-[0.98]"
              >
                Start Building Free
                <FiArrowRight
                  size={17}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
              <button
                onClick={() =>
                  document
                    .querySelector("#how")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-slate-700 border-2 border-slate-200 rounded-2xl hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
              >
                See How It Works
              </button>
            </div>

            {/* Social proof */}
            <div
              className="animate-fade-up flex items-center gap-4"
              style={{ animationDelay: "320ms", animationFillMode: "both" }}
            >
              <div className="flex -space-x-2.5">
                {[
                  "from-emerald-400 to-emerald-600",
                  "from-teal-400 to-teal-600",
                  "from-emerald-500 to-emerald-700",
                  "from-slate-400 to-slate-600",
                  "from-emerald-300 to-emerald-500",
                ].map((g, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full bg-linear-to-br ${g} border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}
                  >
                    {["A", "R", "S", "P", "N"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      size={11}
                      className="text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Trusted by{" "}
                  <span className="text-slate-900 font-semibold">10,000+</span>{" "}
                  job seekers
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: floating resume mockup ── */}
          <div
            className="relative flex justify-center lg:justify-end animate-fade-in"
            style={{ animationDelay: "280ms", animationFillMode: "both" }}
          >
            {/* Soft shadow glow behind card */}
            <div className="absolute inset-6 bg-emerald-200/40 rounded-3xl blur-2xl" />

            {/* Main resume card */}
            <div className="relative animate-float w-full max-w-[340px] bg-white rounded-3xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden">
              {/* AI badge */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full shadow-md">
                <FiCpu size={10} /> AI Generated
              </div>

              {/* Resume header — green instead of dark */}
              <div className="bg-linear-to-br from-emerald-600 to-emerald-800 px-5 pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white font-extrabold text-base shadow-lg shrink-0 backdrop-blur-sm">
                    AK
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">
                      Arjun Kumar
                    </h3>
                    <p className="text-emerald-200 text-xs font-semibold mt-0.5">
                      Senior Software Engineer
                    </p>
                    <p className="text-emerald-300/80 text-[10px] mt-1">
                      📍 Hyderabad · arjun@email.com
                    </p>
                  </div>
                </div>
              </div>

              {/* Resume body */}
              <div className="px-5 py-4 space-y-3.5 bg-white">
                {/* Match score */}
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FiTarget size={11} className="text-emerald-700" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700">
                      Job Match Score
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-20 bg-emerald-100 rounded-full overflow-hidden">
                      <div className="h-full w-[92%] bg-linear-to-r from-emerald-500 to-emerald-600 rounded-full" />
                    </div>
                    <span className="text-xs font-bold text-emerald-700">
                      92%
                    </span>
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Experience
                  </p>
                  {[
                    { role: "Sr. Engineer", co: "Google", yr: "2022–Now" },
                    { role: "Engineer II", co: "Flipkart", yr: "2019–2022" },
                  ].map((e) => (
                    <div
                      key={e.co}
                      className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {e.role}
                        </p>
                        <p className="text-[10px] text-slate-400">{e.co}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {e.yr}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {["React", "Node.js", "TypeScript", "AWS", "Python"].map(
                      (s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-100"
                        >
                          {s}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                {/* Download button */}
                <button className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors">
                  <FiDownload size={11} /> Download PDF
                </button>
              </div>
            </div>

            {/* Floating chips */}
            <div
              className="absolute -left-4 top-[28%] animate-float-slow hidden sm:block"
              style={{ animationDelay: "1.2s" }}
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl shadow-lg border border-slate-100">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <FiZap size={13} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 leading-none mb-0.5">
                    Generated in
                  </p>
                  <p className="text-xs font-bold text-slate-800">8 seconds</p>
                </div>
              </div>
            </div>
            <div
              className="absolute -right-4 bottom-[22%] animate-float-slow hidden sm:block"
              style={{ animationDelay: "2.4s" }}
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl shadow-lg border border-slate-100">
                <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <FiCheckCircle size={13} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 leading-none mb-0.5">
                    ATS Score
                  </p>
                  <p className="text-xs font-bold text-emerald-700">98 / 100</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce">
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
          Scroll
        </p>
        <FiChevronDown size={15} className="text-slate-400" />
      </div>
    </section>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function Stats() {
  const items = [
    {
      value: "10,000+",
      label: "Resumes Created",
      icon: <FiFileText size={18} />,
    },
    { value: "92%", label: "Interview Rate", icon: <FiTrendingUp size={18} /> },
    { value: "30s", label: "Avg. Build Time", icon: <FiZap size={18} /> },
    { value: "50+", label: "Pro Templates", icon: <FiAward size={18} /> },
  ];

  return (
    <section className="bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {items.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 80}
              className={`flex flex-col sm:flex-row items-center sm:items-start gap-3 py-8 px-6 ${
                i < 3
                  ? "border-b md:border-b-0 md:border-r border-slate-100"
                  : "border-b-0"
              } ${i % 2 === 0 && i < 2 ? "border-r md:border-r-0" : ""} md:border-r md:last:border-r-0`}
            >
              <div className="shrink-0 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                {s.icon}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-3xl font-extrabold text-slate-900 leading-tight">
                  {s.value}
                </p>
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  {s.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: <FiBriefcase size={22} />,
      title: "Describe Your Target Role",
      desc: "Paste a job description or tell us the role, company, and skills required. Our AI understands exactly what recruiters are looking for.",
    },
    {
      n: "02",
      icon: <FiCpu size={22} />,
      title: "AI Crafts Your Resume",
      desc: "Our AI agents analyze the job, match it with your experience, and generate a tailored, keyword-rich, ATS-friendly resume in seconds.",
    },
    {
      n: "03",
      icon: <FiDownload size={22} />,
      title: "Download & Apply",
      desc: "Get a polished PDF resume. Edit, refine, or generate variations for multiple roles. Start applying with confidence.",
    },
  ];

  return (
    <section
      id="how"
      className="bg-emerald-50/50 py-24 border-y border-emerald-100/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-16">
          <SectionBadge label="How It Works" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            From Job Description to Resume in 3 Steps
          </h2>
          <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            No templates to fill. No hours of writing. Just tell our AI your
            goal and watch it work.
          </p>
        </Reveal>

        <div className="relative grid md:grid-cols-3 gap-6">
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-[calc(33.33%+16px)] right-[calc(33.33%+16px)] h-px border-t-2 border-dashed border-emerald-200" />

          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
                    {s.icon}
                  </div>
                  <span className="text-5xl font-black text-emerald-100 leading-none select-none">
                    {s.n}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const features = [
    {
      icon: <FiTarget size={19} />,
      title: "Job-Tailored Matching",
      desc: "AI reads the job description and rewrites your resume to precisely match each role's requirements and keywords.",
    },
    {
      icon: <FiZap size={19} />,
      title: "30-Second Generation",
      desc: "Stop spending hours writing. Get a complete, polished resume draft in under 30 seconds — every time.",
    },
    {
      icon: <FiShield size={19} />,
      title: "ATS Optimization",
      desc: "Beat applicant tracking systems with keyword-optimized content that passes automated screening filters.",
    },
    {
      icon: <FiEdit3 size={19} />,
      title: "Smart Editing",
      desc: "Real-time AI suggestions as you edit. Improve impact scores, fix weak language, and sharpen bullet points.",
    },
    {
      icon: <FiAward size={19} />,
      title: "50+ Templates",
      desc: "Choose from modern, creative, or classic designs. Each template is crafted for maximum recruiter appeal.",
    },
    {
      icon: <FiTrendingUp size={19} />,
      title: "Version Tracking",
      desc: "Maintain multiple versions for different roles. Track which resume got you callbacks and interviews.",
    },
  ];

  return (
    <section id="features" className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-14">
          <SectionBadge label="Features" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything You Need to Get Hired Faster
          </h2>
          <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Powered by advanced AI agents trained on millions of successful
            resumes and recruiter preferences.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 60} dir="scale">
              <div className="group p-6 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-600/5 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  const ALL_FEATURES = [
    "AI-generated resume",
    "Job description matching",
    "ATS optimization",
    "PDF download",
    "All 50+ templates",
    "Smart editing suggestions",
    "Version tracking",
    "Cover letter generation",
    "Priority support",
  ];

  const plans = [
    {
      name: "Starter",
      price: 9,
      resumes: 1,
      popular: false,
      included: [0, 1, 2, 3],
      perResume: "₹9 per resume",
    },
    {
      name: "Growth",
      price: 39,
      resumes: 5,
      popular: true,
      included: [0, 1, 2, 3, 4, 5, 6],
      perResume: "₹7.8 per resume",
    },
    {
      name: "Pro",
      price: 69,
      resumes: 10,
      popular: false,
      included: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      perResume: "₹6.9 per resume",
    },
  ];

  return (
    <section
      id="pricing"
      className="bg-emerald-50/50 py-24 border-y border-emerald-100/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-14">
          <SectionBadge label="Pricing" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            One-time payment. No subscriptions, no hidden fees. Pay only for the
            resumes you need.
          </p>
        </Reveal>

        {/* Equal-height grid: stretch + flex-col cards */}
        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 100} dir="scale" className="flex">
              <div
                className={`relative flex flex-col w-full bg-white rounded-2xl border-2 p-7 transition-all duration-300 ${
                  p.popular
                    ? "border-emerald-500 shadow-xl shadow-emerald-600/15"
                    : "border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1"
                }`}
              >
                {/* Popular badge */}
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full whitespace-nowrap shadow-md">
                    Most Popular
                  </div>
                )}

                {/* Header */}
                <div className="mb-5 pb-5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {p.name}
                    </h3>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        p.popular
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.resumes} Resume{p.resumes > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-slate-900">
                      ₹{p.price}
                    </span>
                    <span className="text-slate-400 text-sm pb-1.5">
                      one-time
                    </span>
                  </div>
                  <p
                    className={`text-xs font-semibold mt-1.5 ${p.popular ? "text-emerald-600" : "text-slate-400"}`}
                  >
                    {p.perResume}
                  </p>
                </div>

                {/* Features — flex-1 pushes button to bottom */}
                <ul className="space-y-3 flex-1 mb-6">
                  {ALL_FEATURES.map((f, fi) => {
                    const included = p.included.includes(fi);
                    return (
                      <li
                        key={f}
                        className={`flex items-center gap-2.5 text-sm ${included ? "text-slate-700" : "text-slate-300"}`}
                      >
                        <FiCheckCircle
                          size={15}
                          className={`shrink-0 ${included ? "text-emerald-500" : "text-slate-200"}`}
                        />
                        {f}
                      </li>
                    );
                  })}
                </ul>

                {/* CTA — always at bottom */}
                <Link
                  href="/login"
                  className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                    p.popular
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25"
                      : "bg-slate-900 hover:bg-slate-700 text-white"
                  }`}
                >
                  Get Started →
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="text-center mt-8">
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <FiShield size={14} className="text-emerald-600" />
            Secure payment via Razorpay · No subscription, no renewal
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const reviews = [
    {
      name: "Priya Sharma",
      role: "Product Manager · Swiggy",
      avatar: "PS",
      stars: 5,
      quote:
        "I got 3 interview calls within a week. The AI understood the job description better than I did and crafted bullets that perfectly matched what the recruiter wanted.",
    },
    {
      name: "Rahul Verma",
      role: "Software Engineer · Zepto",
      avatar: "RV",
      stars: 5,
      quote:
        "Generated 5 tailored resumes for 5 different roles in under an hour. Got my dream job at a startup in Bangalore. Worth every rupee at ₹39.",
    },
    {
      name: "Neha Patel",
      role: "Data Scientist · PhonePe",
      avatar: "NP",
      stars: 5,
      quote:
        "The ATS optimization is real. My previous resume had 0 callbacks. With the AI-optimized version, I got shortlisted at 4 out of 6 companies I applied to.",
    },
  ];

  return (
    <section className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-14">
          <SectionBadge label="Testimonials" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Loved by Job Seekers Across India
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 100} dir="scale">
              <div className="flex flex-col bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all duration-300 h-full">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(r.stars)].map((_, j) => (
                    <FiStar
                      key={j}
                      size={13}
                      className="text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-slate-700 leading-relaxed flex-1 mb-5">
                  &ldquo;{r.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {r.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      {r.name}
                    </p>
                    <p className="text-xs text-slate-500">{r.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const items = [
    {
      q: "How does the AI generate my resume?",
      a: "You provide the job description and your work history. Our AI agents analyze the job requirements, extract key skills and keywords, then write tailored resume bullets that demonstrate how your experience matches the role. It takes under 30 seconds.",
    },
    {
      q: "What is ATS optimization and why does it matter?",
      a: "ATS (Applicant Tracking Systems) are used by companies to filter resumes before a human sees them. Studies show 75% of resumes are rejected by ATS. Our AI ensures your resume has the right keywords, formatting, and structure to pass these filters.",
    },
    {
      q: "Do I need a subscription?",
      a: "No. We use a pay-per-resume model: ₹9 for 1 resume, ₹39 for 5 resumes, or ₹69 for 10 resumes. It's a one-time payment with absolutely no recurring charges.",
    },
    {
      q: "Can I generate resumes for different jobs?",
      a: "Absolutely. Each resume is tailored specifically to the job description you provide — different keywords, different emphasis, same experience presented differently for each target role.",
    },
    {
      q: "What format do I get the resume in?",
      a: "You receive a professionally designed PDF ready for immediate download. All templates are clean, modern, and optimized for both ATS systems and human recruiters.",
    },
  ];

  return (
    <section
      id="faq"
      className="bg-emerald-50/50 py-24 border-y border-emerald-100/60"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-12">
          <SectionBadge label="FAQ" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
        </Reveal>

        <div className="space-y-3">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 50}>
              <div
                className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                  openIdx === i
                    ? "border-emerald-300 shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                >
                  <span className="font-semibold text-slate-900 text-sm leading-snug">
                    {item.q}
                  </span>
                  <FiChevronDown
                    size={17}
                    className={`shrink-0 transition-transform duration-300 ${
                      openIdx === i
                        ? "rotate-180 text-emerald-600"
                        : "text-slate-400"
                    }`}
                  />
                </button>
                {openIdx === i && (
                  <div className="px-5 pb-5 animate-fade-up">
                    <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="cta-gradient py-24 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-400/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full mb-6">
            <FiAward size={13} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">
              Start Your Career Growth Today
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
            Your Dream Job Is One
            <br />
            <span className="text-gradient">Resume Away</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-lg mx-auto leading-relaxed">
            Join thousands of professionals who landed better jobs with
            AI-crafted resumes. Start for just ₹9 — no risk, no subscription.
          </p>

          <Link
            href="/login"
            className="group inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-600/30 transition-all active:scale-[0.98]"
          >
            Build My Resume Now
            <FiArrowRight
              size={17}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>

          <div className="mt-7 flex items-center justify-center flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            {["No subscription", "Secure payment", "Instant download"].map(
              (t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <FiCheck size={13} className="text-emerald-500" />
                  {t}
                </span>
              ),
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const cols = {
    Product: ["Features", "Pricing", "Templates", "How It Works"],
    Company: ["About", "Blog", "Careers", "Press"],
    Support: [
      "Help Center",
      "Contact Us",
      "Privacy Policy",
      "Terms of Service",
    ],
  };

  return (
    <footer className="bg-slate-950 border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
                <FiLayers size={18} />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                SAAS<span className="text-emerald-400">IO</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              AI-powered resume builder helping Indian professionals land their
              dream jobs. Fast, affordable, effective.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(cols).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      href="/login"
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} SAASIO. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <FiShield size={11} className="text-emerald-600" />
            <p className="text-xs text-slate-500">
              Secured payments via Razorpay · Made in India 🇮🇳
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
