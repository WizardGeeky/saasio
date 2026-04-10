"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
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
  FiShield,
  FiEdit3,
  FiAward,
  FiTrendingUp,
  FiFileText,
  FiUsers,
  FiClock,
  FiCpu,
  FiLayers,
  FiBriefcase,
  FiUser,
  FiMoon,
  FiSun,
} from "react-icons/fi";
import { BlurFade } from "@/components/magicui/blur-fade";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Marquee } from "@/components/magicui/marquee";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Meteors } from "@/components/magicui/meteors";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { WordFadeIn } from "@/components/magicui/word-fade-in";

/* ─── Data ────────────────────────────────────────────────────────────── */

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Product Manager",
    company: "Swiggy",
    initials: "PS",
    text: "Got 3 interview calls in one week! The ATS score jumped to 96/100. Absolutely worth every rupee.",
    rating: 5,
  },
  {
    name: "Rahul Verma",
    role: "Software Engineer",
    company: "Zepto",
    initials: "RV",
    text: "Crafted the perfect resume for my dream company in under 30 seconds. Landed the job in 2 weeks.",
    rating: 5,
  },
  {
    name: "Neha Patel",
    role: "Data Scientist",
    company: "PhonePe",
    initials: "NP",
    text: "The job-tailored matching is incredible. My resume finally spoke the recruiter's language!",
    rating: 5,
  },
  {
    name: "Arjun Singh",
    role: "UX Designer",
    company: "CRED",
    initials: "AS",
    text: "Never thought resume building could be this effortless. The templates are stunning too.",
    rating: 5,
  },
  {
    name: "Ananya Kapoor",
    role: "Marketing Manager",
    company: "Razorpay",
    initials: "AK",
    text: "94% job match score on my first try. Interview conversion rate doubled within days.",
    rating: 5,
  },
  {
    name: "Vikram Nair",
    role: "Backend Developer",
    company: "Groww",
    initials: "VN",
    text: "Version tracking for different job roles is a game-changer. Highly recommend the Pro plan.",
    rating: 5,
  },
  {
    name: "Sneha Reddy",
    role: "Business Analyst",
    company: "Flipkart",
    initials: "SR",
    text: "From job description to polished PDF in 30 seconds — this is the future of job applications.",
    rating: 5,
  },
  {
    name: "Karan Mehta",
    role: "DevOps Engineer",
    company: "Meesho",
    initials: "KM",
    text: "Finally cracked Meesho's hiring process. The ATS optimizer made my resume stand out.",
    rating: 5,
  },
];


const steps = [
  {
    number: "01",
    icon: FiBriefcase,
    title: "Paste Your Job Description",
    subtitle: "Any role. Any company. Any portal.",
    description:
      "Copy the job listing from LinkedIn, Naukri, or any careers page and paste it into SAASIO. Our AI reads every requirement, keyword, and skill the recruiter is looking for.",
    bullets: [
      "Works with any job portal or company listing",
      "Supports freshers and experienced professionals",
      "Any role: tech, management, design, finance",
    ],
    accent: "violet",
  },
  {
    number: "02",
    icon: FiCpu,
    title: "AI Crafts Your Resume",
    subtitle: "Under 30 seconds. Every single time.",
    description:
      "Our AI analyzes the job requirements, extracts the exact keywords ATS systems look for, and generates a tailored resume that speaks the recruiter's language — perfectly.",
    bullets: [
      "Real-time ATS scoring up to 98/100",
      "Job-specific keyword and phrase optimization",
      "Professional tone auto-enhanced by AI",
    ],
    accent: "emerald",
  },
  {
    number: "03",
    icon: FiDownload,
    title: "Download & Start Applying",
    subtitle: "PDF-ready in seconds.",
    description:
      "Your ATS-optimized resume is instantly available as a polished, professionally formatted PDF. Choose from 50+ templates and start applying to your dream role today.",
    bullets: [
      "PDF download ready for immediate applications",
      "50+ professional, ATS-friendly templates",
      "Track separate versions for different roles",
    ],
    accent: "violet",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "₹9",
    per: "1 resume",
    perUnit: "₹9/resume",
    description: "Perfect for a single job application",
    features: [
      "1 AI-generated resume",
      "ATS optimization score",
      "Job description matching",
      "PDF download",
      "50+ templates",
    ],
    missing: ["Smart editing suggestions", "Version tracking", "Priority support"],
    cta: "Get Started",
    popular: false,
    gradient: "from-slate-50 to-white",
    border: "border-slate-200",
  },
  {
    name: "Growth",
    price: "₹39",
    per: "5 resumes",
    perUnit: "₹7.8/resume",
    description: "Best value for active job seekers",
    features: [
      "5 AI-generated resumes",
      "ATS optimization score",
      "Job description matching",
      "PDF download",
      "50+ templates",
      "Smart editing suggestions",
      "Version tracking",
    ],
    missing: ["Priority support"],
    cta: "Get Started",
    popular: true,
    gradient: "from-white to-white",
    border: "border-transparent",
  },
  {
    name: "Pro",
    price: "₹69",
    per: "10 resumes",
    perUnit: "₹6.9/resume",
    description: "For serious career professionals",
    features: [
      "10 AI-generated resumes",
      "ATS optimization score",
      "Job description matching",
      "PDF download",
      "50+ templates",
      "Smart editing suggestions",
      "Version tracking",
      "Priority support",
    ],
    missing: [],
    cta: "Get Started",
    popular: false,
    gradient: "from-violet-50 to-white",
    border: "border-violet-200",
  },
];

const faqs = [
  {
    q: "How does AI generate my resume?",
    a: "Our AI analyzes your job description to extract key requirements, skills, and language patterns. It then crafts a tailored resume that highlights your most relevant experience in the exact vocabulary that ATS systems and recruiters respond to.",
  },
  {
    q: "What is ATS optimization and why does it matter?",
    a: "Applicant Tracking Systems (ATS) are software tools used by 99% of large companies to filter resumes before a human ever sees them. Our ATS optimizer scores your resume against the job description and ensures it passes automated screening, maximizing your chances of reaching an interview.",
  },
  {
    q: "Is there a subscription or recurring charge?",
    a: "No! SAASIO is completely pay-as-you-go. Pay once for a bundle of resumes and use them whenever you need. No monthly fees, no recurring charges, no hidden costs — ever.",
  },
  {
    q: "Can I create resumes for different job roles?",
    a: "Absolutely. Each resume is independently tailored to a specific job description. The Growth and Pro plans let you build multiple versions of your resume for different roles, companies, or industries — all tracked separately.",
  },
  {
    q: "What format will I receive my resume in?",
    a: "Your AI-crafted resume is delivered as a professionally formatted PDF, ready to attach directly to any job application. Choose from 50+ industry-specific templates before downloading.",
  },
  {
    q: "Is my personal data safe and secure?",
    a: "Absolutely. All data is encrypted in transit (TLS) and at rest. We never share your personal information with third parties. Payments are processed through Razorpay, India's most trusted and PCI-DSS compliant payment gateway.",
  },
];

/* ─── shared container ─────────────────────────────────────────────────── */
const CONTAINER = "max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10";

/* ─── Landing theme context ─────────────────────────────────────────────── */
const ThemeCtx = React.createContext<{ isDark: boolean; toggle: () => void }>({
  isDark: false,
  toggle: () => {},
});
const useTheme = () => React.useContext(ThemeCtx);

/* ─── Navbar ────────────────────────────────────────────────────────────── */

function Navbar() {
  const { isDark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  const navScrolled = isDark
    ? "bg-[#08090f]/95 backdrop-blur-xl shadow-sm border-b border-violet-900/30"
    : "bg-white/90 backdrop-blur-xl shadow-sm border-b border-violet-100/60";

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? navScrolled : "bg-transparent"}`}>
      <div className={CONTAINER}>
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-2xl font-extrabold text-gradient-gl">SAASIO</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {links.map((l) => (
              <motion.a
                key={l.label}
                href={l.href}
                whileHover={{ y: -1 }}
                className={`text-sm font-semibold transition-colors ${isDark ? "text-slate-400 hover:text-violet-400" : "text-slate-600 hover:text-violet-600"}`}
              >
                {l.label}
              </motion.a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 ${
                isDark
                  ? "border-violet-500/50 bg-violet-950/60 text-violet-300 hover:border-violet-400 hover:bg-violet-900/60 shadow-sm shadow-violet-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 shadow-sm"
              }`}
            >
              {isDark ? <FiSun className="w-3.5 h-3.5" /> : <FiMoon className="w-3.5 h-3.5" />}
              {isDark ? "Light" : "Dark"}
            </button>
            <Link
              href="/login"
              className={`text-sm font-semibold transition-colors px-4 py-2 rounded-full ${isDark ? "text-slate-300 hover:text-violet-400 hover:bg-violet-950/40" : "text-slate-700 hover:text-violet-600 hover:bg-violet-50"}`}
            >
              Sign In
            </Link>
            <Link href="/login">
              <ShimmerButton
                background="linear-gradient(135deg,#10b981,#059669)"
                className="text-sm px-5 py-2.5 rounded-full shadow-md shadow-emerald-500/20"
              >
                Get Started
              </ShimmerButton>
            </Link>
          </div>

          {/* Mobile: theme toggle + menu */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className={`p-2 rounded-xl transition-colors ${isDark ? "text-slate-400 hover:bg-violet-950/40" : "text-slate-500 hover:bg-violet-50"}`}
            >
              {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
            </button>
            <button
              className={`p-2 rounded-xl transition-colors ${isDark ? "text-slate-400 hover:bg-violet-950/40" : "text-slate-600 hover:bg-violet-50"}`}
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={open ? "x" : "menu"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  {open ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`md:hidden border-t backdrop-blur-xl overflow-hidden ${isDark ? "border-violet-900/30 bg-[#0d0e1c]/98" : "border-violet-100 bg-white/98"}`}
          >
            <div className="px-4 py-4 space-y-1">
              {links.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${isDark ? "text-slate-300 hover:bg-violet-950/40 hover:text-violet-400" : "text-slate-700 hover:bg-violet-50 hover:text-violet-700"}`}
                >
                  {l.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="pt-3 pb-1 grid grid-cols-2 gap-2"
              >
                <Link
                  href="/login"
                  className={`text-center px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${isDark ? "border-violet-800 text-violet-400 hover:bg-violet-950/40" : "border-violet-200 text-violet-700 hover:bg-violet-50"}`}
                >
                  Sign In
                </Link>
                <Link href="/login">
                  <ShimmerButton
                    background="linear-gradient(135deg,#10b981,#059669)"
                    className="w-full text-sm py-3 rounded-xl justify-center"
                  >
                    Get Started
                  </ShimmerButton>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ─── Hero — AI Scanner Animation ──────────────────────────────────────── */

const RESUME_JOBS = [
  {
    title: "Senior Product Manager",
    company: "Swiggy",
    color: "from-violet-500 to-violet-700",
    score: 94,
    ats: 97,
    keywords: ["Product Strategy", "SQL", "A/B Testing", "Agile"],
  },
  {
    title: "Software Engineer II",
    company: "Google",
    color: "from-emerald-500 to-teal-600",
    score: 91,
    ats: 98,
    keywords: ["React", "TypeScript", "System Design", "REST APIs"],
  },
  {
    title: "Data Scientist",
    company: "PhonePe",
    color: "from-blue-500 to-indigo-600",
    score: 96,
    ats: 95,
    keywords: ["Python", "ML", "TensorFlow", "Statistics"],
  },
];

function AIScannerAnimation() {
  const [activeJob, setActiveJob] = useState(0);
  const [scanPhase, setScanPhase] = useState<"scanning" | "scoring" | "done">("scanning");
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    let frame: ReturnType<typeof setTimeout>;
    const cycle = () => {
      // scanning phase
      setScanPhase("scanning");
      setScanY(0);
      let y = 0;
      const scanInterval = setInterval(() => {
        y += 2.5;
        setScanY(y);
        if (y >= 100) {
          clearInterval(scanInterval);
          setScanPhase("scoring");
          frame = setTimeout(() => {
            setScanPhase("done");
            frame = setTimeout(() => {
              setActiveJob((j) => (j + 1) % RESUME_JOBS.length);
              cycle();
            }, 1800);
          }, 900);
        }
      }, 30);
    };
    cycle();
    return () => clearTimeout(frame);
  }, []);

  const job = RESUME_JOBS[activeJob];

  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none">
      {/* Ambient glow behind card */}
      <div className="absolute inset-0 bg-violet-300/20 rounded-3xl blur-3xl scale-110 pointer-events-none" />

      {/* Main card */}
      <div className="relative bg-white rounded-2xl shadow-2xl shadow-violet-500/15 border border-violet-100 overflow-hidden">
        <BorderBeam colorFrom="#10b981" colorTo="#8b5cf6" duration={4} />

        {/* Header bar */}
        <div className={`bg-linear-to-r ${job.color} px-5 py-3.5 flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <motion.div
              key={activeJob + "icon"}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"
            >
              <FiCpu className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <motion.p
                key={activeJob + "title"}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-white text-xs font-bold leading-tight"
              >
                {job.title}
              </motion.p>
              <p className="text-white/70 text-[10px] font-medium">{job.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/40" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
            <span className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>

        {/* Resume preview with scan line */}
        <div className="relative px-5 pt-4 pb-3 overflow-hidden" style={{ height: 160 }}>
          {/* Resume skeleton */}
          <div className="space-y-2.5">
            <div className="h-3 w-2/5 bg-slate-700 rounded-full" />
            <div className="h-2 w-1/3 bg-slate-300 rounded-full" />
            <div className="h-px bg-slate-200 my-1" />
            {[
              { w: "100%", c: "bg-violet-200" },
              { w: "88%",  c: "bg-slate-200" },
              { w: "75%",  c: "bg-slate-200" },
              { w: "95%",  c: "bg-emerald-200" },
              { w: "60%",  c: "bg-slate-200" },
              { w: "80%",  c: "bg-slate-200" },
            ].map((l, i) => (
              <div key={i} className={`h-2 rounded-full ${l.c}`} style={{ width: l.w }} />
            ))}
          </div>

          {/* Animated scan line */}
          {scanPhase === "scanning" && (
            <motion.div
              className="absolute left-0 right-0 h-[2px] pointer-events-none"
              style={{ top: `${scanY}%` }}
            >
              <div className="h-full bg-linear-to-r from-transparent via-emerald-400 to-transparent opacity-90" />
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-emerald-300/40 to-transparent blur-sm" />
            </motion.div>
          )}

          {/* Scan overlay tint */}
          {scanPhase === "scanning" && (
            <div
              className="absolute left-0 right-0 top-0 bg-emerald-400/5 pointer-events-none transition-all"
              style={{ height: `${scanY}%` }}
            />
          )}
        </div>

        {/* Keyword chips */}
        <div className="px-5 pb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Matched Keywords
          </p>
          <div className="flex flex-wrap gap-1.5">
            {job.keywords.map((kw, i) => (
              <motion.span
                key={kw}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={scanPhase !== "scanning" ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 0.9 }}
                transition={{ delay: i * 0.08 }}
                className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-50 text-violet-700 border border-violet-100"
              >
                ✓ {kw}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Score row */}
        <div className="px-5 pb-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {/* ATS score ring */}
            <div className="relative shrink-0 w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#f0fdf4" strokeWidth="5" />
                <motion.circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke="#10b981" strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                  animate={scanPhase !== "scanning"
                    ? { strokeDashoffset: 2 * Math.PI * 22 * (1 - job.ats / 100) }
                    : { strokeDashoffset: 2 * Math.PI * 22 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <motion.span
                  key={activeJob + "ats"}
                  initial={{ opacity: 0 }}
                  animate={scanPhase !== "scanning" ? { opacity: 1 } : { opacity: 0 }}
                  className="text-sm font-black text-emerald-700 leading-none"
                >
                  {job.ats}
                </motion.span>
                <span className="text-[8px] text-slate-400 font-bold">ATS</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-medium">Job Match Score</span>
                <motion.span
                  key={activeJob + "score"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={scanPhase !== "scanning" ? { opacity: 1, scale: 1 } : { opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-base font-black text-emerald-600"
                >
                  {job.score}%
                </motion.span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={scanPhase !== "scanning" ? { width: `${job.score}%` } : { width: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={scanPhase === "done" ? { opacity: 1 } : { opacity: 0 }}
                className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1"
              >
                <FiCheck className="w-3 h-3" /> Resume ready to download
              </motion.p>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-slate-50 border-t border-slate-100 px-5 py-2 flex items-center gap-2">
          <motion.div
            animate={scanPhase === "scanning"
              ? { backgroundColor: ["#fbbf24", "#10b981", "#fbbf24"] }
              : { backgroundColor: "#10b981" }}
            transition={{ repeat: scanPhase === "scanning" ? Infinity : 0, duration: 1 }}
            className="w-2 h-2 rounded-full"
          />
          <motion.span
            key={scanPhase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-semibold text-slate-500"
          >
            {scanPhase === "scanning"
              ? "AI scanning resume…"
              : scanPhase === "scoring"
                ? "Computing scores…"
                : "Analysis complete ✓"}
          </motion.span>
          <div className="flex-1" />
          <span className="text-[10px] text-slate-400">
            {activeJob + 1}/{RESUME_JOBS.length} jobs
          </span>
        </div>
      </div>

      {/* Floating chips */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        className="absolute -top-4 -right-2 sm:-right-6 bg-white rounded-xl shadow-lg border border-violet-100 px-3 py-2 flex items-center gap-2"
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-2 h-2 bg-emerald-400 rounded-full"
        />
        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Live AI Analysis</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.8 }}
        className="absolute -bottom-4 -left-2 sm:-left-6 bg-white rounded-xl shadow-lg border border-violet-100 px-3 py-2 flex items-center gap-2"
      >
        <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">10,000+ Users</span>
      </motion.div>
    </div>
  );
}

function HeroSection() {
  const { isDark } = useTheme();
  return (
    <section className={`relative min-h-screen flex items-center pt-16 overflow-hidden ${isDark ? "bg-hero-radial-dark" : "bg-hero-radial"}`}>
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Meteors number={18} />
        <div className="absolute top-1/3 -left-20 w-[500px] h-[500px] bg-violet-300/10 rounded-full blur-[120px] animate-glow-pulse" />
        <div
          className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-emerald-300/10 rounded-full blur-[100px] animate-glow-pulse"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className={`relative ${CONTAINER} w-full`}>
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center py-16 sm:py-20 lg:py-24">
          {/* ── Left ── */}
          <div className="text-center lg:text-left">
            <BlurFade delay={0}>
              <div className="inline-block mb-5">
                <AnimatedGradientText>
                  <FiZap className="w-4 h-4 text-emerald-500" />
                  <span className="text-gradient-gl font-bold">AI-Powered Resume Builder</span>
                  <span className="text-violet-400">✦</span>
                </AnimatedGradientText>
              </div>
            </BlurFade>

            <WordFadeIn
              words="Build Resumes That Land Your Dream Job"
              className="font-heading text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-5"
            />

            <BlurFade delay={0.5}>
              <p className="text-base sm:text-lg xl:text-xl text-slate-600 leading-relaxed mb-7 max-w-lg mx-auto lg:mx-0">
                AI crafts{" "}
                <span className="font-bold text-emerald-600">ATS-optimized resumes</span>{" "}
                tailored to your job description in under{" "}
                <span className="font-bold text-violet-600">30 seconds</span>. No
                subscriptions — starting at just{" "}
                <span className="font-bold text-emerald-600">₹9</span>.
              </p>
            </BlurFade>

            <BlurFade delay={0.65}>
              {/* Buttons — always side by side */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                <Link href="/login" className="w-full sm:w-auto">
                  <ShimmerButton
                    background="linear-gradient(135deg,#10b981,#059669)"
                    className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-4 border-3 rounded-full shadow-xl shadow-emerald-500/30 justify-center"
                  >
                    Start Building
                    <FiArrowRight className="w-4 h-4" />
                  </ShimmerButton>
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-5  px-6 sm:px-8 sm:py-4 rounded-full border-3 border-violet-200 text-violet-700 font-semibold text-sm sm:text-base hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                >
                  See How It Works
                </a>
              </div>
            </BlurFade>

            <BlurFade delay={0.8}>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-5 text-xs sm:text-sm text-slate-500">
                {[
                  { icon: FiCheck, text: "No subscription" },
                  { icon: FiShield, text: "Secure payment" },
                  { icon: FiDownload, text: "Instant PDF" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </BlurFade>
          </div>

          {/* ── Right — AI Scanner ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.65, ease: "easeOut" }}
            className="w-full flex justify-center lg:justify-end px-4 sm:px-8 lg:px-0"
          >
            <AIScannerAnimation />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ─────────────────────────────────────────────────────────────── */

function StatsSection() {
  const stats = [
    { value: 10000, suffix: "+", label: "Resumes Created", icon: FiFileText, color: "text-emerald-500" },
    { value: 92, suffix: "%", label: "Interview Success Rate", icon: FiTrendingUp, color: "text-violet-500" },
    { value: 30, suffix: "s", label: "Average Build Time", icon: FiClock, color: "text-emerald-500" },
    { value: 50, suffix: "+", label: "Pro Templates", icon: FiLayers, color: "text-violet-500" },
  ];

  const { isDark } = useTheme();
  return (
    <section className={`py-16 border-y ${isDark ? "section-lavender-dark border-violet-900/20" : "section-lavender border-violet-100/60"}`}>
      <div className={CONTAINER}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {stats.map((s, i) => (
            <BlurFade key={s.label} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-center p-4 sm:p-6 rounded-2xl bg-white border border-violet-100/80 shadow-sm hover:shadow-md hover:border-violet-200 transition-shadow duration-200"
              >
                <s.icon className={`w-6 h-6 mx-auto mb-3 ${s.color}`} />
                <div className="text-2xl sm:text-4xl font-extrabold text-slate-900 tabular-nums">
                  <NumberTicker value={s.value} suffix={s.suffix} delay={i * 0.15} />
                </div>
                <p className="text-sm font-medium text-slate-500 mt-1">{s.label}</p>
              </motion.div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ──────────────────────────────────────────────────────── */

function PasteMockup() {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-violet-100 p-5 w-full">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-400/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
        <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-xs text-slate-400 font-medium">Paste Job Description</span>
      </div>
      {/* JD content */}
      <div className="bg-violet-50/60 rounded-xl p-4 border border-violet-100 mb-4 font-mono text-xs leading-relaxed">
        <p className="font-bold text-violet-800 text-sm mb-2">Senior Product Manager — Swiggy</p>
        <p className="text-slate-600 mb-1">We are looking for a data-driven PM with 3+ years of experience in B2C product...</p>
        <p className="text-slate-500 mt-2">• Strong SQL &amp; analytics tool experience</p>
        <p className="text-slate-500">• Cross-functional stakeholder management</p>
        <p className="text-slate-500">• Proven track record of 0-to-1 products</p>
        <span className="inline-block w-0.5 h-4 bg-violet-500 mt-1 animate-blink" />
      </div>
      {/* Input + button row */}
      <div className="flex gap-2">
        <div className="flex-1 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center px-3">
          <span className="text-xs text-slate-400">Your work experience or LinkedIn URL...</span>
        </div>
        <button className="px-4 py-2 bg-linear-to-r from-violet-500 to-violet-600 text-white text-xs font-bold rounded-lg shadow-md shadow-violet-500/30 whitespace-nowrap">
          Analyze →
        </button>
      </div>
    </div>
  );
}

function GenerateMockup() {
  const ref = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isInView = useInView(ref as any, { once: true, margin: "-100px" as any });
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (!isInView) return;
    let p = 0;
    const id = setInterval(() => {
      p += 1.4;
      setProgress(Math.min(Math.round(p), 100));
      if (p >= 100) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [isInView]);

  const tasks = [
    "Analyzing job requirements",
    "Extracting ATS keywords",
    "Tailoring experience bullets",
    "Formatting & optimizing",
  ];

  return (
    <div ref={ref} className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6 w-full">
      {/* Progress ring */}
      <div className="flex items-center gap-5 mb-5">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#d1fae5" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke="#10b981" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-100"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black text-emerald-600">{progress}%</span>
          </div>
        </div>
        <div>
          <p className="font-bold text-slate-900 text-sm">Crafting your resume…</p>
          <p className="text-xs text-slate-400 mt-0.5">AI at work — almost done</p>
        </div>
      </div>
      {/* Task checklist */}
      <div className="space-y-2.5">
        {tasks.map((task, i) => {
          const done = progress >= (i + 1) * 25;
          return (
            <div key={task} className={`flex items-center gap-2.5 text-xs transition-colors duration-300 ${done ? "text-emerald-700" : "text-slate-300"}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${done ? "bg-emerald-100 text-emerald-600" : "border border-slate-200"}`}>
                {done && <FiCheck className="w-2.5 h-2.5" />}
              </div>
              <span className="font-medium">{task}</span>
            </div>
          );
        })}
      </div>
      {/* ETA */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>⚡ AI-powered generation</span>
        <span className="font-semibold text-emerald-600">~28 seconds</span>
      </div>
    </div>
  );
}

function DownloadMockup() {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-violet-100 p-5 w-full">
      {/* File header */}
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-emerald-500 flex items-center justify-center shrink-0">
          <FiFileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">Resume_Priya_Sharma.pdf</p>
          <p className="text-xs text-slate-400">AI-Generated · 2 pages · Ready</p>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full whitespace-nowrap">
          ATS 98/100
        </span>
      </div>
      {/* Mini resume skeleton */}
      <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100 space-y-2">
        <div className="h-2.5 w-3/5 bg-slate-700 rounded-full" />
        <div className="h-2 w-2/5 bg-slate-300 rounded-full" />
        <div className="h-px bg-slate-200 my-2" />
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-violet-200 rounded-full" />
          <div className="h-2 w-11/12 bg-slate-200 rounded-full" />
          <div className="h-2 w-4/5 bg-slate-200 rounded-full" />
        </div>
        <div className="h-px bg-slate-200 my-2" />
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-emerald-200 rounded-full" />
          <div className="h-2 w-10/12 bg-slate-200 rounded-full" />
          <div className="h-2 w-3/4 bg-slate-200 rounded-full" />
        </div>
      </div>
      {/* Download button */}
      <button className="w-full py-3 bg-linear-to-r from-violet-500 to-emerald-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-violet-500/20 hover:opacity-90 transition-opacity">
        <FiDownload className="w-4 h-4" />
        Download PDF
      </button>
      {/* Match score */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>Job Match Score</span>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-[92%] bg-linear-to-r from-emerald-400 to-emerald-500 rounded-full" />
          </div>
          <span className="font-bold text-emerald-600">92%</span>
        </div>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  const { isDark } = useTheme();
  const mockups = [<PasteMockup key="paste" />, <GenerateMockup key="gen" />, <DownloadMockup key="dl" />];

  return (
    <section id="how-it-works" className={`py-24 relative overflow-hidden ${isDark ? "bg-[#08090f]" : "bg-white"}`}>
      {/* Subtle background orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-50 rounded-full blur-[100px] pointer-events-none" />

      <div className={`relative ${CONTAINER}`}>
        {/* Header */}
        <div className="text-center mb-20">
          <BlurFade>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-4">
              How It Works
            </span>
          </BlurFade>
          <BlurFade delay={0.1}>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Land Your Dream Job in{" "}
              <span className="text-gradient-gl">3 Simple Steps</span>
            </h2>
          </BlurFade>
          <BlurFade delay={0.2}>
            <p className="mt-4 text-xl text-slate-500 max-w-xl mx-auto">
              No complicated forms. No hours of editing. Just paste, generate, and download.
            </p>
          </BlurFade>
        </div>

        {/* Steps — alternating layout */}
        <div className="space-y-24">
          {steps.map((step, i) => {
            const reversed = i % 2 === 1;
            const accentColor = step.accent === "emerald"
              ? { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", bullet: "bg-emerald-500", num: "text-emerald-100" }
              : { badge: "bg-violet-100 text-violet-700 border-violet-200", bullet: "bg-violet-500", num: "text-violet-100" };

            return (
              <BlurFade key={step.number} delay={0.1}>
                <div className={`flex flex-col ${reversed ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 lg:gap-16 items-center`}>
                  {/* Mockup */}
                  <div className="w-full lg:w-[48%]">
                    <motion.div
                      initial={{ opacity: 0, x: reversed ? 40 : -40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                    >
                      {mockups[i]}
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="w-full lg:w-[52%] relative">
                    {/* Decorative big number */}
                    <div className={`hidden sm:block absolute -top-8 ${reversed ? "right-0" : "left-0"} text-[6rem] sm:text-[9rem] font-black leading-none select-none pointer-events-none ${accentColor.num} opacity-60`}>
                      {step.number}
                    </div>

                    <div className="relative">
                      <BlurFade delay={0.15}>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold mb-4 ${accentColor.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${accentColor.bullet}`} />
                          Step {step.number}
                        </span>
                      </BlurFade>

                      <BlurFade delay={0.2}>
                        <h3 className="font-heading text-2xl lg:text-3xl font-extrabold text-slate-900 leading-snug mb-1">
                          {step.title}
                        </h3>
                        <p className="text-base font-semibold text-slate-400 mb-4">{step.subtitle}</p>
                      </BlurFade>

                      <BlurFade delay={0.25}>
                        <p className="text-slate-600 text-base leading-relaxed mb-6">
                          {step.description}
                        </p>
                      </BlurFade>

                      <BlurFade delay={0.3}>
                        <ul className="space-y-3">
                          {step.bullets.map((b) => (
                            <li key={b} className="flex items-start gap-3 text-sm text-slate-700">
                              <div className={`mt-0.5 w-5 h-5 rounded-full ${accentColor.bullet} flex items-center justify-center shrink-0`}>
                                <FiCheck className="w-3 h-3 text-white" />
                              </div>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </BlurFade>
                    </div>
                  </div>
                </div>
              </BlurFade>
            );
          })}
        </div>

        {/* CTA */}
        <BlurFade delay={0.2}>
          <div className="mt-20 text-center">
            <Link href="/login">
              <ShimmerButton
                background="linear-gradient(135deg,#8b5cf6,#7c3aed)"
                className="text-base px-8 py-4 rounded-full shadow-xl shadow-violet-500/30"
              >
                Try It Now — Free to Start
                <FiArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </Link>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

/* ─── Features ──────────────────────────────────────────────────────────── */

function FeaturesSection() {
  const { isDark } = useTheme();
  return (
    <section id="features" className={`py-24 relative overflow-hidden ${isDark ? "bg-[#08090f]" : "bg-white"}`}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-violet-50/80 rounded-full blur-[100px] pointer-events-none" />

      <div className={`relative ${CONTAINER}`}>
        <div className="text-center mb-16">
          <BlurFade>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-widest mb-4">
              Features
            </span>
          </BlurFade>
          <BlurFade delay={0.1}>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Everything You Need to{" "}
              <span className="text-gradient-gl">Land the Job</span>
            </h2>
          </BlurFade>
          <BlurFade delay={0.2}>
            <p className="mt-4 text-xl text-slate-500 max-w-xl mx-auto">
              Powered by state-of-the-art AI. Built for the Indian job market.
            </p>
          </BlurFade>
        </div>

        {/* ── Top row ── */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4 items-stretch">
          {/* Large card — AI Matching */}
          <BlurFade className="lg:flex-2">
            <div className="h-full min-h-[340px] rounded-3xl bg-linear-to-br from-violet-600 via-violet-700 to-indigo-900 p-7 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
              <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-white/5 rounded-full" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-white text-xs font-bold mb-5 border border-white/10">
                  <FiTarget className="w-3.5 h-3.5 text-emerald-300" /> AI Job Matching
                </span>
                <h3 className="text-2xl font-extrabold text-white leading-snug mb-2">
                  Tailored to Every Job Description
                </h3>
                <p className="text-violet-200 text-sm leading-relaxed max-w-md">
                  Our AI reads the job description and rewrites your experience in the exact language ATS systems and recruiters look for — every single time.
                </p>
              </div>
              <div className="relative flex flex-col sm:flex-row gap-3 items-stretch mt-6">
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <p className="text-violet-300 text-xs font-bold uppercase tracking-wider mb-3">JD Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["SQL", "Product Strategy", "A/B Testing", "Stakeholder Mgmt", "Agile", "P&L"].map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-violet-400/30 text-violet-100 text-xs rounded-full border border-violet-300/20">{kw}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center shrink-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-400/20 border border-emerald-300/20 flex items-center justify-center">
                    <FiArrowRight className="w-4 h-4 text-emerald-300" />
                  </div>
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <p className="text-violet-300 text-xs font-bold uppercase tracking-wider mb-3">Your Resume</p>
                  <div className="space-y-2">
                    {[
                      "Led SQL-driven analysis, cut churn by 22%",
                      "Owned P&L for ₹15Cr product portfolio",
                      "Ran 12 A/B tests, improved CVR 18%",
                    ].map((b) => (
                      <div key={b} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-white/80 text-xs leading-relaxed">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
                <span className="text-xs text-violet-200 font-medium">Match Score</span>
                <div className="flex-1 h-1.5 bg-violet-800/60 rounded-full overflow-hidden">
                  <div className="h-full w-[94%] bg-linear-to-r from-emerald-400 to-emerald-300 rounded-full" />
                </div>
                <span className="text-sm font-black text-emerald-300">94%</span>
              </div>
            </div>
          </BlurFade>

          {/* Right column — ATS + Speed */}
          <div className="lg:flex-1 flex flex-col sm:flex-row lg:flex-col gap-4">
            {/* ATS */}
            <BlurFade delay={0.1} className="flex-1">
              <div className="h-full min-h-[156px] rounded-3xl bg-linear-to-br from-emerald-50 to-white border border-emerald-100 p-5 flex items-center gap-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.07),transparent_70%)]" />
                <div className="relative shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="31" fill="none" stroke="#d1fae5" strokeWidth="7" />
                    <circle cx="40" cy="40" r="31" fill="none" stroke="#10b981" strokeWidth="7"
                      strokeDasharray={`${2 * Math.PI * 31 * 0.98} ${2 * Math.PI * 31}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-black text-emerald-700">98</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
                    <FiTrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">ATS Optimizer</h3>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-[140px]">Score 90+ on every application automatically</p>
                </div>
              </div>
            </BlurFade>

            {/* Speed */}
            <BlurFade delay={0.15} className="flex-1">
              <div className="h-full min-h-[156px] rounded-3xl bg-linear-to-br from-amber-50 to-white border border-amber-100 p-5 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-[100px] font-black text-amber-100/80 leading-none select-none pointer-events-none">⚡</div>
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                    <FiZap className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">30-Second Build</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Average AI generation time</p>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-4xl font-black text-amber-500 tabular-nums">28</span>
                    <span className="text-lg font-bold text-amber-400">s</span>
                  </div>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Templates */}
          <BlurFade delay={0.2}>
            <div className="rounded-3xl bg-linear-to-br from-blue-50 to-white border border-blue-100 p-5 relative overflow-hidden min-h-[200px] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                  <FiLayers className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">50+ Templates</h3>
                <p className="text-xs text-slate-500">ATS-friendly for every industry</p>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-4">
                {[
                  "bg-violet-200","bg-emerald-200","bg-blue-200","bg-amber-200",
                  "bg-pink-200","bg-indigo-200","bg-teal-200","bg-rose-200",
                ].map((c, i) => (
                  <div key={i} className={`h-9 rounded-lg ${c}`} />
                ))}
              </div>
            </div>
          </BlurFade>

          {/* Smart Editing */}
          <BlurFade delay={0.25}>
            <div className="rounded-3xl bg-linear-to-br from-pink-50 to-white border border-pink-100 p-5 relative overflow-hidden min-h-[200px] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center mb-3">
                  <FiEdit3 className="w-4 h-4 text-pink-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Smart Editing</h3>
                <p className="text-xs text-slate-500">AI rewrites every bullet for impact</p>
              </div>
              <div className="mt-4 bg-white rounded-2xl p-3 border border-pink-100 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <FiX className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="line-through">Worked on product features</span>
                </div>
                <div className="flex items-start gap-2 text-slate-800">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center shrink-0">
                    <FiZap className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="font-semibold leading-snug">Led 8 product launches increasing DAU by 34%</span>
                </div>
              </div>
            </div>
          </BlurFade>

          {/* Version Tracking */}
          <BlurFade delay={0.3}>
            <div className="rounded-3xl bg-linear-to-br from-indigo-50 to-white border border-indigo-100 p-5 relative overflow-hidden min-h-[200px] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
                  <FiAward className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Version Tracking</h3>
                <p className="text-xs text-slate-500">One tailored resume per role</p>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { label: "PM Resume", company: "Swiggy", pill: "bg-violet-100 text-violet-700 border-violet-200" },
                  { label: "Senior PM", company: "Amazon", pill: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                  { label: "Lead PM",   company: "Google", pill: "bg-blue-100 text-blue-700 border-blue-200" },
                ].map((v) => (
                  <div key={v.company} className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-medium ${v.pill}`}>
                    <span>{v.label}</span>
                    <span className="font-bold">{v.company}</span>
                  </div>
                ))}
              </div>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ───────────────────────────────────────────────────────────── */

function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-28 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg,#0f172a 0%,#1e1b4b 35%,#0f172a 65%,#052e16 100%)",
      }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(139,92,246,0.25),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_100%,rgba(16,185,129,0.15),transparent)]" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Meteors number={8} />
      </div>

      <div className={`relative ${CONTAINER}`}>
        {/* Header */}
        <div className="text-center mb-16">
          <BlurFade>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-widest mb-4">
              Pricing
            </span>
          </BlurFade>
          <BlurFade delay={0.1}>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Pay Once.{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-300 to-violet-300">
                Land Your Job.
              </span>
            </h2>
          </BlurFade>
          <BlurFade delay={0.2}>
            <p className="mt-4 text-xl text-white/55 max-w-xl mx-auto">
              No subscriptions. No recurring fees. Pick a pack — pay once, use whenever.
            </p>
          </BlurFade>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-4 lg:gap-5 items-center">
          {pricingPlans.map((plan, i) =>
            plan.popular ? (
              /* ── Popular: elevated white card ── */
              <BlurFade key={plan.name} delay={i * 0.1}>
                <div className="relative sm:-translate-y-4 sm:scale-[1.03]">
                  {/* Outer glow ring */}
                  <div className="absolute -inset-[3px] rounded-3xl bg-linear-to-r from-emerald-400 via-violet-400 to-emerald-400 blur-md opacity-60" />
                  {/* Card */}
                  <div className="relative bg-white rounded-3xl p-7 shadow-2xl flex flex-col">
                    {/* Top badge */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="px-4 py-1 bg-linear-to-r from-emerald-500 to-violet-500 text-white text-xs font-black rounded-full shadow-lg">
                        ⭐ MOST POPULAR
                      </span>
                    </div>

                    <div className="mb-5 pt-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-1 block">
                        {plan.name}
                      </span>
                      <div className="flex items-end gap-1.5">
                        <span className="text-5xl font-extrabold text-slate-900">{plan.price}</span>
                        <span className="text-slate-400 mb-2 text-sm font-medium">/ {plan.per}</span>
                      </div>
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">{plan.perUnit} · Best value</p>
                    </div>
                    <p className="text-slate-500 text-sm mb-6">{plan.description}</p>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <FiCheck className="w-2.5 h-2.5 text-emerald-600" />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/login" className="block">
                      <ShimmerButton
                        background="linear-gradient(135deg,#10b981,#059669)"
                        className="w-full py-3.5 rounded-xl text-base font-bold justify-center shadow-lg shadow-emerald-500/30"
                      >
                        {plan.cta} <FiArrowRight className="w-4 h-4" />
                      </ShimmerButton>
                    </Link>
                  </div>
                </div>
              </BlurFade>
            ) : (
              /* ── Regular: dark glassy card ── */
              <BlurFade key={plan.name} delay={i * 0.1}>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-7 flex flex-col h-full hover:bg-white/8transition-all duration-200 group">
                  <div className="mb-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1 block">
                      {plan.name}
                    </span>
                    <div className="flex items-end gap-1.5">
                      <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-white/40 mb-2 text-sm font-medium">/ {plan.per}</span>
                    </div>
                    <p className="text-xs font-semibold text-white/30 mt-0.5">{plan.perUnit}</p>
                  </div>
                  <p className="text-white/50 text-sm mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                        <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                          <FiCheck className="w-2.5 h-2.5 text-emerald-400" />
                        </div>
                        {f}
                      </li>
                    ))}
                    {plan.missing.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-white/20">
                        <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                          <FiX className="w-2.5 h-2.5 text-white/20" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className="block text-center py-3.5 rounded-xl border border-white/20 text-white/70 font-bold text-sm hover:border-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    {plan.cta}
                  </Link>
                </div>
              </BlurFade>
            ),
          )}
        </div>

        {/* Trust bar */}
        <BlurFade delay={0.4}>
          <div className="mt-12 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/40">
            {[
              { icon: FiShield, text: "PCI-DSS secured via Razorpay" },
              { icon: FiCheck, text: "Zero hidden fees — ever" },
              { icon: FiDownload, text: "PDF instant on payment" },
              { icon: FiUsers, text: "10,000+ happy users" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-emerald-400/80" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}


/* ─── Testimonials ──────────────────────────────────────────────────────── */

function TestimonialsSection() {
  const half = Math.ceil(testimonials.length / 2);
  const row1 = testimonials.slice(0, half);
  const row2 = testimonials.slice(half);

  const { isDark } = useTheme();
  return (
    <section className={`py-24 overflow-hidden ${isDark ? "section-lavender-dark" : "section-lavender"}`}>
      <div className={CONTAINER}>
        <div className="text-center mb-16">
          <BlurFade>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-widest mb-4">
              Testimonials
            </span>
          </BlurFade>
          <BlurFade delay={0.1}>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Loved by{" "}
              <span className="text-gradient-gl">10,000+ Professionals</span>
            </h2>
          </BlurFade>
        </div>
      </div>

      {/* Marquee rows */}
      <div className="space-y-4">
        <Marquee speed={40} pauseOnHover>
          {[...row1, ...row1].map((t, i) => (
            <TestimonialCard key={`r1-${i}`} t={t} />
          ))}
        </Marquee>
        <Marquee speed={32} reverse pauseOnHover>
          {[...row2, ...row2].map((t, i) => (
            <TestimonialCard key={`r2-${i}`} t={t} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}

function TestimonialCard({ t }: { t: (typeof testimonials)[0] }) {
  return (
    <div className="w-72 shrink-0 bg-white rounded-2xl border border-violet-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-1 mb-3">
        {[...Array(t.rating)].map((_, i) => (
          <FiStar key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">&ldquo;{t.text}&rdquo;</p>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
          {t.initials}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">{t.name}</p>
          <p className="text-xs text-slate-400">
            {t.role} · {t.company}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ ───────────────────────────────────────────────────────────────── */

function FAQSection() {
  const { isDark } = useTheme();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className={`py-24 ${isDark ? "bg-[#08090f]" : "bg-white"}`}>
      <div className={CONTAINER}>
        <div className="text-center mb-16">
          <BlurFade>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-4">
              FAQ
            </span>
          </BlurFade>
          <BlurFade delay={0.1}>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Questions?{" "}
              <span className="text-gradient-gl">We&apos;ve got answers.</span>
            </h2>
          </BlurFade>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <BlurFade key={i} delay={i * 0.07}>
              <div
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  openIdx === i
                    ? "border-violet-300 bg-violet-50/60"
                    : "border-slate-200 bg-white hover:border-violet-200"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span
                    className={`font-semibold text-sm md:text-base ${
                      openIdx === i ? "text-violet-800" : "text-slate-900"
                    }`}
                  >
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openIdx === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <FiChevronDown
                      className={`w-5 h-5 ${openIdx === i ? "text-violet-600" : "text-slate-400"}`}
                    />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openIdx === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ───────────────────────────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 animate-gradient-flow"
        style={{
          background:
            "linear-gradient(135deg, #4c1d95, #1e1b4b, #065f46, #1e1b4b, #4c1d95)",
          backgroundSize: "300% 300%",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.4),transparent)]" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Meteors number={12} />
      </div>

      <div className={`relative ${CONTAINER} text-center`}>
        <BlurFade>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest mb-6">
            <FiAward className="w-3.5 h-3.5" /> Start Today
          </span>
        </BlurFade>

        <BlurFade delay={0.1}>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Your Dream Job Is{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-300 via-violet-300 to-emerald-300">
              One Resume Away
            </span>
          </h2>
        </BlurFade>

        <BlurFade delay={0.2}>
          <p className="text-xl text-white/70 mb-10 max-w-xl mx-auto">
            Join 10,000+ professionals who landed their dream jobs with
            AI-powered, ATS-optimized resumes. Starting at just ₹9.
          </p>
        </BlurFade>

        <BlurFade delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <ShimmerButton
                background="linear-gradient(135deg,#10b981,#059669)"
                className="text-lg px-10 py-5 rounded-full shadow-2xl shadow-emerald-500/40 font-bold"
              >
                Build My Resume Now
                <FiArrowRight className="w-5 h-5" />
              </ShimmerButton>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/60">
            {[
              { icon: FiCheck, text: "No subscription required" },
              { icon: FiShield, text: "Secure Razorpay payment" },
              { icon: FiDownload, text: "Instant PDF download" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-emerald-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────────────────── */

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className={`${CONTAINER} py-16`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              
              <span className="text-xl font-extrabold text-white">SAASIO</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              AI-powered resume builder for Indian job seekers. Get ATS-optimized resumes
              in under 30 seconds.
            </p>
            <div className="flex items-center gap-2">
              <FiShield className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-slate-500">Secured by Razorpay · Made in India 🇮🇳</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">
              Product
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Features", href: "#features" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "Pricing", href: "#pricing" },
                { label: "Templates", href: "/login" },
                { label: "ATS Checker", href: "/login" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">
              Company
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "About Us", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Contact", href: "#" },
                { label: "Support", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Terms & Conditions", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Refund Policy", href: "/terms#refund" },
                { label: "Shipping Policy", href: "/terms#shipping" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm hover:text-violet-400 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {currentYear} SAASIO. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">
              Terms
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <span>support@saasio.in</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);
  const toggle = React.useCallback(() => setIsDark((d) => !d), []);

  return (
    <ThemeCtx.Provider value={{ isDark, toggle }}>
      <main className={`min-h-screen transition-colors duration-300 ${isDark ? "lp-dark" : ""}`}>
        <Navbar />
        <HeroSection />
        <StatsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
        <Footer />
      </main>
    </ThemeCtx.Provider>
  );
}
