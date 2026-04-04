"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiArrowRight, FiCheckCircle, FiChevronLeft, FiLayers } from "react-icons/fi";
import { useToast } from "@/components/ui/toast";

type AuthStep = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes("@")) {
      toastError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/public/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toastError(data.message || "Something went wrong. Please try again.");
        return;
      }

      toastSuccess("OTP sent! Check your inbox.");
      setStep("otp");
    } catch {
      toastError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = otp.join("");
    if (code.length < 6) {
      toastError("Please enter the complete 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/public/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        toastError(data.message || "Invalid or expired OTP.");
        return;
      }

      // Save JWT token to localStorage and redirect
      localStorage.setItem("token", data.token);
      toastSuccess("Logged in successfully!");
      router.push("/dashboard");
    } catch {
      toastError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── OTP Input Handlers ───────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(value.length - 1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);

    // Focus last filled box
    const lastIndex = Math.min(pasted.length - 1, 5);
    const target = document.getElementById(`otp-${lastIndex}`);
    if (target) target.focus();
  };

  const handleBack = () => {
    setStep("email");
    setOtp(["", "", "", "", "", ""]);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[440px] bg-white relative">
        <div className="p-4 sm:p-8">

          {/* Logo / Brand */}
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_8px_16px_rgba(16,185,129,0.2)] mb-4">
              <FiLayers size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SAASIO</h1>
            <p className="text-sm font-medium text-slate-500 mt-1 text-center">
              {step === "email" ? "Sign in to your dashboard" : "Enter the code we sent you"}
            </p>
          </div>

          {step === "otp" && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-6 group w-fit mx-auto"
            >
              <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
              Back to email
            </button>
          )}

          <form onSubmit={step === "email" ? handleSendOtp : handleVerifyOtp} className="flex flex-col gap-5 sm:gap-6">
            {step === "email" ? (
              // ── EMAIL STEP ────────────────────────────────────────────────────
              <div className="flex flex-col gap-2 transition-all">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative flex items-center group">
                  <FiMail className="absolute left-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-[0.95rem]"
                    required
                  />
                </div>
              </div>
            ) : (
              // ── OTP STEP ──────────────────────────────────────────────────────
              <div className="flex flex-col gap-3 transition-all">

                <div className="flex justify-center gap-2 sm:gap-3 w-full">
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
                      className="w-10 h-12 flex-0 text-center bg-slate-50 border border-slate-200 rounded-lg text-lg font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                      placeholder="-"
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-500/30 ${isLoading
                  ? "bg-slate-300 shadow-none cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:-translate-y-0.5"
                }`}
            >
              {isLoading ? (
                <div className="flex gap-1.5 items-center h-5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                </div>
              ) : step === "email" ? (
                <>Continue <FiArrowRight size={18} /></>
              ) : (
                <>Verify &amp; Sign In <FiCheckCircle size={18} /></>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
