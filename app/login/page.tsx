"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiMail, FiArrowRight, FiCheckCircle, FiChevronLeft, FiLayers, FiShield } from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { useAuthGuard } from "@/app/utils/useAuthGuard";

type AuthStep = "email" | "otp";

export default function LoginPage() {
  useAuthGuard("requireGuest");

  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [step, setStep]       = useState<AuthStep>("email");
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
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

  // ── Verify OTP ──────────────────────────────────────────────────────────────
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

  // ── OTP input handlers ──────────────────────────────────────────────────────
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

  const handleBack = () => { setStep("email"); setOtp(["", "", "", "", "", ""]); };

  return (
    <div className="min-h-screen w-full flex bg-white">

      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-gradient-to-br from-emerald-600 to-emerald-800 p-10 relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/30 rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-white backdrop-blur-sm">
            <FiLayers size={20} />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">SAASIO</span>
        </div>

        {/* Middle copy */}
        <div className="relative space-y-6">
          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Build AI-Powered Resumes That Land Jobs
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Join 10,000+ professionals who used SAASIO to get hired faster.
            Tailored, ATS-optimized resumes in seconds.
          </p>
          {/* Feature list */}
          <ul className="space-y-3">
            {[
              "Job description matching",
              "ATS-optimized output",
              "Download as PDF instantly",
              "Starting at just ₹9",
            ].map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 shrink-0">
                  <FiCheckCircle size={11} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom back link */}
        <div className="relative">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-emerald-200 hover:text-white transition-colors">
            <FiChevronLeft size={15} /> Back to home
          </Link>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
            <FiLayers size={18} />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            SAAS<span className="text-emerald-600">IO</span>
          </span>
        </div>

        <div className="w-full max-w-sm">

          {/* Back button (OTP step) */}
          {step === "otp" && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-6 group"
            >
              <FiChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to email
            </button>
          )}

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {step === "email" ? "Sign in to SAASIO" : "Verify your email"}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              {step === "email"
                ? "Enter your email to receive a one-time code."
                : <>Code sent to <span className="font-semibold text-slate-700">{email}</span></>
              }
            </p>
          </div>

          <form onSubmit={step === "email" ? handleSendOtp : handleVerifyOtp} className="space-y-5">

            {step === "email" ? (
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative group">
                  <FiMail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none"
                  />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm font-medium"
                  />
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <FiShield size={11} className="text-emerald-500" />
                  We&apos;ll send a one-time code — no password needed
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">6-Digit Code</p>
                <div className="flex justify-center gap-2">
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
                      className="w-10 h-12 text-center bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all"
                      placeholder="·"
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 text-center">Code expires in 3 minutes</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] shadow-lg shadow-emerald-600/25 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <span className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                </span>
              ) : step === "email" ? (
                <><span>Continue</span><FiArrowRight size={16} /></>
              ) : (
                <><span>Verify &amp; Sign In</span><FiCheckCircle size={16} /></>
              )}
            </button>
          </form>

          {/* Mobile back to home */}
          <div className="mt-8 text-center lg:hidden">
            <Link href="/" className="text-sm text-slate-400 hover:text-emerald-600 transition-colors">
              ← Back to home
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Protected by <span className="font-semibold text-slate-500">SAASIO</span> · v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
