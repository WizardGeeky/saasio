"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiArrowRight, FiCheckCircle, FiChevronLeft, FiLayers, FiShield } from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { useAuthGuard } from "@/app/utils/useAuthGuard";

type AuthStep = "email" | "otp";

export default function LoginPage() {
  useAuthGuard("requireGuest");

  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
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
    <div className="min-h-screen w-full grid place-items-center bg-white p-4 font-sans">

      <div className="relative w-full max-w-[420px]">

        {/* Card — flat, no shadow, blends with white bg */}
        <div>

          <div className="px-2 py-10">

            {/* Brand */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 mb-4">
                <FiLayers size={30} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SAASIO</h1>
              <p className="text-sm text-slate-500 mt-1 text-center font-medium">
                {step === "email" ? "Sign in to your dashboard" : "Enter your verification code"}
              </p>
            </div>

            {/* Back link */}
            {step === "otp" && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-6 group"
              >
                <FiChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to email
              </button>
            )}

            <form onSubmit={step === "email" ? handleSendOtp : handleVerifyOtp} className="space-y-5">

              {step === "email" ? (
                // ── Email step ───────────────────────────────────────────────
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative group">
                    <FiMail
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none"
                    />
                    <input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm font-medium"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-400 pt-0.5 flex items-center gap-1.5">
                    <FiShield size={11} />
                    We&apos;ll send a one-time code to this address
                  </p>
                </div>
              ) : (
                // ── OTP step ─────────────────────────────────────────────────
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 text-center">
                    Code sent to <span className="font-semibold text-slate-700">{email}</span>
                  </p>
                  <div className="flex justify-center gap-1.5 sm:gap-2.5">
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
                        className="w-9 h-11 sm:w-11 sm:h-13 shrink-0 text-center bg-slate-50 border-2 border-slate-200 rounded-xl text-base sm:text-lg font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all"
                        placeholder="·"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    Code expires in 3 minutes
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isLoading ? (
                  <span className="flex gap-1.5 items-center h-5">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                  </span>
                ) : step === "email" ? (
                  <><span>Continue</span><FiArrowRight size={17} /></>
                ) : (
                  <><span>Verify &amp; Sign In</span><FiCheckCircle size={17} /></>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="pt-4 text-center">
            <p className="text-xs text-slate-400">
              Secured by <span className="font-semibold text-slate-500">SAASIO</span>
            </p>
          </div>
        </div>

        {/* Version tag */}
        <p className="text-center text-xs text-slate-400 mt-4">v1.0 · Admin Portal</p>
      </div>
    </div>
  );
}
