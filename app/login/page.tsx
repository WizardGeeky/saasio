"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FiMail,
  FiArrowRight,
  FiCheckCircle,
  FiChevronLeft,
  FiShield,
  FiUser,
  FiPhone,
  FiBriefcase,
  FiMapPin,
  FiGlobe,
  FiInfo,
  FiZap,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { useAuthGuard } from "@/app/utils/useAuthGuard";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "login" | "signup";
type AuthStep = "form" | "otp" | "success";

// ── Animated ATS score card (left panel decoration) ─────────────────────────
function MiniScoreCard({
  company,
  role,
  score,
  delay,
}: {
  company: string;
  role: string;
  score: number;
  delay: number;
}) {
  const color = score >= 90 ? "#10b981" : score >= 80 ? "#a78bfa" : "#f59e0b";
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0"
        style={{ background: `${color}22`, color }}
      >
        {score}
      </div>
      <div className="min-w-0">
        <p className="text-white/90 font-semibold text-sm leading-tight truncate">{role}</p>
        <p className="text-white/50 text-xs">{company}</p>
      </div>
      <div
        className="ml-auto w-2 h-2 rounded-full shrink-0 animate-pulse"
        style={{ background: color }}
      />
    </motion.div>
  );
}

// ── Left branding panel ──────────────────────────────────────────────────────
function BrandPanel() {
  const cards = [
    { company: "Google", role: "Senior SWE", score: 96, delay: 0.6 },
    { company: "Swiggy", role: "Product Manager", score: 91, delay: 0.8 },
    { company: "PhonePe", role: "Data Scientist", score: 88, delay: 1.0 },
  ];

  return (
    <div className="hidden lg:flex flex-col justify-between w-[460px] shrink-0 relative overflow-hidden p-12"
      style={{ background: "linear-gradient(145deg, #1a1040 0%, #1e1553 55%, #0f0a2e 100%)" }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Radial glows */}
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-16 right-0 w-56 h-56 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-40 right-8 w-32 h-32 bg-violet-400/10 rounded-full blur-xl pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex items-center gap-3"
      >
        {/* <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-emerald-400 to-violet-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <FiZap className="w-5 h-5 text-white" />
        </div> */}
        <span className="text-2xl font-extrabold text-white tracking-tight font-heading">SAASIO</span>
      </motion.div>

      {/* Main copy */}
      <div className="relative space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="space-y-4"
        >
          <h2 className="text-4xl font-extrabold text-white leading-[1.1] tracking-tight font-heading">
            Build Resumes That{" "}
            <span
              className="block"
              style={{
                background: "linear-gradient(135deg, #34d399 0%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Actually Get Hired
            </span>
          </h2>
          <p className="text-white/60 text-base leading-relaxed">
            AI-powered, ATS-optimized resumes matched to any job description — in under 30 seconds.
          </p>
        </motion.div>

        {/* Live ATS score cards */}
        <div className="space-y-2.5">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs font-bold uppercase tracking-widest text-white/40"
          >
            Live ATS Scores
          </motion.p>
          {cards.map((c) => (
            <MiniScoreCard key={c.company} {...c} />
          ))}
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="grid grid-cols-3 gap-3 pt-2"
        >
          {[
            { n: "10K+", label: "Hired" },
            { n: "₹9", label: "Starting" },
            { n: "30s", label: "Generation" },
          ].map(({ n, label }) => (
            <div key={label} className="text-center bg-white/5 rounded-2xl py-3 border border-white/10">
              <p className="text-xl font-extrabold text-white font-heading">{n}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Back to home */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-emerald-400 transition-colors group"
        >
          <FiChevronLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>
      </motion.div>
    </div>
  );
}

// ── Input field wrapper ──────────────────────────────────────────────────────
function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 focus:bg-white transition-all";

// ── Main login content ───────────────────────────────────────────────────────
function LoginContent() {
  useAuthGuard("requireGuest");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();

  const [isDark, setIsDark] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<AuthStep>("form");
  const [isLoading, setIsLoading] = useState(false);

  const hasShownActivationToast = React.useRef(false);

  useEffect(() => {
    if (searchParams.get("activated") === "true" && !hasShownActivationToast.current) {
      toastSuccess("Account activated successfully! You can now sign in.");
      hasShownActivationToast.current = true;
    }
  }, [searchParams, toastSuccess]);

  // Form states
  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");
  const [mobile, setMobile] = useState("");
  const [occupation, setOccupation] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [source, setSource] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { toastError("Please enter a valid email address."); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/public/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { toastError(data.message || "Something went wrong."); return; }
      toastSuccess("OTP sent! Check your inbox.");
      setStep("otp");
    } catch {
      toastError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/public/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullname, mobile, occupation, state, country, source }),
      });
      const data = await res.json();
      if (!res.ok) { toastError(data.message || "Signup failed."); return; }
      toastSuccess("Account created! Please check your email for activation link.");
      setStep("success");
    } catch {
      toastError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toastError("Please enter the complete 6-digit code."); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/public/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) { toastError(data.message || "Invalid or expired OTP."); return; }
      localStorage.setItem("token", data.token);
      toastSuccess("Logged in successfully!");
      router.push("/dashboard");
    } catch {
      toastError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    document.getElementById(`otp-${Math.min(pasted.length - 1, 5)}`)?.focus();
  };

  const handleBack = () => { setStep("form"); setOtp(["", "", "", "", "", ""]); };
  const toggleMode = () => { setMode(mode === "login" ? "signup" : "login"); setStep("form"); };

  // ── Step heading copy ────────────────────────────────────────────────────────
  const heading =
    step === "otp" ? "Verify your email" :
    mode === "login" ? "Welcome back" :
    "Create your account";

  const subheading =
    step === "otp" ? (
      <>Code sent to <span className="font-semibold text-slate-800">{email}</span></>
    ) : mode === "login" ? (
      "Enter your email — we'll send a one-time code."
    ) : (
      "Start building ATS-optimized resumes today."
    );

  return (
    <div className={`min-h-screen w-full flex bg-white font-sans transition-colors duration-300 ${isDark ? "lp-dark" : ""}`}>
      <BrandPanel />

      {/* ── Right panel ─────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col items-center justify-center relative p-6 sm:p-12 overflow-y-auto transition-colors duration-300 ${isDark ? "bg-hero-radial-dark" : "bg-hero-radial"}`}>
        {/* Theme toggle */}
        <button
          onClick={() => setIsDark((d) => !d)}
          className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all backdrop-blur-sm shadow-sm ${
            isDark
              ? "border-slate-600 bg-slate-800/80 text-slate-300 hover:border-violet-400 hover:text-violet-300"
              : "border-slate-200 bg-white/80 text-slate-500 hover:border-violet-300 hover:text-violet-600"
          }`}
        >
          {isDark ? <FiSun size={13} /> : <FiMoon size={13} />}
          {isDark ? "Light" : "Dark"}
        </button>

        {/* Subtle blurs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-violet-100/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-50/60 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md my-8">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-10">
            
            <span className="text-3xl font-extrabold tracking-tight font-heading">
              <span className="text-gradient">SAASIO</span>
            </span>
          </div>

          {/* Back button (OTP) */}
          {step === "otp" && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-600 transition-colors mb-6 group"
            >
              <FiChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to email
            </button>
          )}

          {/* ── Success state ──────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {step === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                className="text-center space-y-5 py-6"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-emerald-400 to-violet-500 flex items-center justify-center shadow-xl shadow-violet-500/25">
                    <FiCheckCircle className="w-9 h-9 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Check your inbox</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    We&apos;ve sent an activation link to{" "}
                    <span className="font-semibold text-slate-800">{email}</span>.{" "}
                    Click the link to activate your account.
                  </p>
                </div>
                <button
                  onClick={() => { setMode("login"); setStep("form"); }}
                  className="text-violet-600 font-bold hover:text-violet-500 transition-colors text-sm"
                >
                  Go to Login →
                </button>
              </motion.div>

            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                {/* Heading */}
                <div className="mb-7">
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center font-heading">
                    {heading}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1.5 text-center">{subheading}</p>
                </div>

                {/* Mode toggle tabs (only on form step) */}
                {step === "form" && (
                  <div className="flex mb-7 bg-slate-100 rounded-2xl p-1 gap-1">
                    {(["login", "signup"] as AuthMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => { setMode(m); setStep("form"); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                          mode === m
                            ? "bg-white text-violet-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {m === "login" ? "Sign In" : "Sign Up"}
                      </button>
                    ))}
                  </div>
                )}

                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/60 p-7">
                  <form
                    onSubmit={step === "otp" ? handleVerifyOtp : mode === "login" ? handleLogin : handleSignup}
                    className="space-y-4"
                  >
                    <AnimatePresence mode="wait">
                      {step === "otp" ? (
                        /* ── OTP step ── */
                        <motion.div
                          key="otp"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4"
                        >
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                            6-Digit Code
                          </p>
                          <div className="flex justify-center gap-2.5">
                            {otp.map((digit, index) => (
                              <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                inputMode="numeric"
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                onPaste={handleOtpPaste}
                                maxLength={1}
                                className="w-11 h-13 text-center bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15 focus:bg-white transition-all"
                                placeholder="·"
                              />
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 text-center">
                            Code expires in 3 minutes
                          </p>
                        </motion.div>

                      ) : mode === "login" ? (
                        /* ── Login step ── */
                        <motion.div
                          key="login"
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.25 }}
                        >
                          <Field label="Email Address" icon={<FiMail size={16} />}>
                            <input
                              type="email"
                              placeholder="name@company.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className={inputCls}
                            />
                          </Field>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-3">
                            <FiShield size={11} className="text-emerald-500" />
                            We&apos;ll send a one-time code — no password needed
                          </p>
                        </motion.div>

                      ) : (
                        /* ── Signup step ── */
                        <motion.div
                          key="signup"
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-3.5"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Full Name" icon={<FiUser size={16} />}>
                              <input
                                type="text"
                                placeholder="John Doe"
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                                required
                                className={inputCls}
                              />
                            </Field>
                            <Field label="Mobile" icon={<FiPhone size={16} />}>
                              <input
                                type="tel"
                                placeholder="+91 XXXXX"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                required
                                className={inputCls}
                              />
                            </Field>
                          </div>

                          <Field label="Email Address" icon={<FiMail size={16} />}>
                            <input
                              type="email"
                              placeholder="name@company.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className={inputCls}
                            />
                          </Field>

                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Occupation" icon={<FiBriefcase size={16} />}>
                              <input
                                type="text"
                                placeholder="Engineer"
                                value={occupation}
                                onChange={(e) => setOccupation(e.target.value)}
                                required
                                className={inputCls}
                              />
                            </Field>
                            <Field label="State" icon={<FiMapPin size={16} />}>
                              <input
                                type="text"
                                placeholder="Karnataka"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                required
                                className={inputCls}
                              />
                            </Field>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Country" icon={<FiGlobe size={16} />}>
                              <input
                                type="text"
                                placeholder="India"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                required
                                className={inputCls}
                              />
                            </Field>
                            <Field label="How did you hear?" icon={<FiInfo size={16} />}>
                              <CustomSelect
                                value={source}
                                onChange={setSource}
                                options={[
                                  { value: "GOOGLE", label: "Google" },
                                  { value: "LINKEDIN", label: "LinkedIn" },
                                  { value: "TWITTER", label: "Twitter (X)" },
                                  { value: "YOUTUBE", label: "YouTube" },
                                  { value: "FRIEND", label: "Friend" },
                                  { value: "OTHER", label: "Other" },
                                ]}
                                placeholder="Select…"
                              />
                            </Field>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="relative w-full overflow-hidden rounded-xl py-3.5 font-bold text-white focus:outline-none focus:ring-4 focus:ring-violet-500/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                      style={{
                        background: isLoading
                          ? "#8b5cf6"
                          : "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)",
                        boxShadow: "0 8px 24px rgba(139,92,246,0.25)",
                      }}
                    >
                      {/* shimmer overlay */}
                      {!isLoading && (
                        <span
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background:
                              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                            animation: "shimmer-traverse 2.5s ease-in-out infinite",
                          }}
                        />
                      )}
                      <span className="relative flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                          </>
                        ) : step === "otp" ? (
                          <>Verify &amp; Sign In <FiCheckCircle size={16} /></>
                        ) : mode === "login" ? (
                          <>Continue <FiArrowRight size={16} /></>
                        ) : (
                          <>Create Account <FiArrowRight size={16} /></>
                        )}
                      </span>
                    </button>
                  </form>
                </div>

                {/* Footer links */}
                <div className="mt-5 text-center space-y-3">
                  <p className="text-sm text-slate-500">
                    {mode === "login" ? "New to SAASIO?" : "Already have an account?"}{" "}
                    <button
                      onClick={toggleMode}
                      className="text-violet-600 font-bold hover:text-violet-500 transition-colors"
                    >
                      {mode === "login" ? "Create account" : "Sign in"}
                    </button>
                  </p>
                  <Link
                    href="/"
                    className="block text-xs text-slate-400 hover:text-violet-500 transition-colors"
                  >
                    ← Back to home
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-slate-400 mt-8">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="hover:text-violet-500 transition-colors underline underline-offset-2">Terms</Link>
            {" "}&amp;{" "}
            <Link href="/privacy" className="hover:text-violet-500 transition-colors underline underline-offset-2">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

// ── CustomSelect ─────────────────────────────────────────────────────────────
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}

function CustomSelect({ value, onChange, options, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 border ${
          isOpen ? "border-violet-500 ring-4 ring-violet-500/10" : "border-slate-200"
        } rounded-xl py-2.5 pl-10 pr-3 text-sm font-medium cursor-pointer transition-all flex items-center justify-between hover:border-violet-500`}
      >
        <span className={value ? "text-slate-900 truncate" : "text-slate-400 truncate"}>
          {selectedLabel}
        </span>
        <FiChevronLeft
          size={14}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${isOpen ? "rotate-90" : "-rotate-90"}`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1"
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                  value === option.value
                    ? "bg-violet-50 text-violet-600"
                    : "text-slate-700 hover:bg-slate-50 hover:text-violet-600"
                }`}
              >
                {option.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
