"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FiMail,
  FiArrowRight,
  FiCheckCircle,
  FiChevronLeft,
  FiLayers,
  FiShield,
  FiUser,
  FiPhone,
  FiBriefcase,
  FiMapPin,
  FiGlobe,
  FiInfo,
} from "react-icons/fi";
import { useToast } from "@/components/ui/toast";
import { useAuthGuard } from "@/app/utils/useAuthGuard";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "login" | "signup";
type AuthStep = "form" | "otp" | "success";

function LoginContent() {
  useAuthGuard("requireGuest");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();

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

  // ── Handle Login ────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
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
        toastError(data.message || "Something went wrong.");
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

  // ── Handle Signup ───────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/public/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullname,
          mobile,
          occupation,
          state,
          country,
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError(data.message || "Signup failed.");
        return;
      }
      toastSuccess("Account created! Please check your email for activation link.");
      setStep("success");
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
    if (value && index < 5)
      document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    document.getElementById(`otp-${Math.min(pasted.length - 1, 5)}`)?.focus();
  };

  const handleBack = () => {
    setStep("form");
    setOtp(["", "", "", "", "", ""]);
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setStep("form");
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      {/* ── Left panel: branding (Desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-linear-to-br from-emerald-600 to-emerald-800 p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3.5">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/20 text-white backdrop-blur-md shadow-inner border border-white/20">
            <FiLayers size={22} />
          </div>
          <span className="text-3xl font-extrabold text-white tracking-tight">SAASIO</span>
        </div>

        {/* Middle copy */}
        <div className="relative space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold text-white leading-[1.1] tracking-tight">
              Build AI-Powered Resumes That Land Jobs
            </h2>
            <p className="text-emerald-100 text-lg leading-relaxed font-medium">
              Join 10,000+ professionals who used SAASIO to get hired faster.
              Tailored, ATS-optimized resumes in seconds.
            </p>
          </div>

          <ul className="space-y-4 pt-4">
            {[
              "Job description matching",
              "ATS-optimized output",
              "Download as PDF instantly",
              "Starting at just ₹9",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-white font-medium">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 shrink-0 border border-white/20">
                  <FiCheckCircle size={13} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom footer link */}
        <div className="relative">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white transition-colors group"
          >
            <FiChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
        </div>
      </div>

      {/* ── Right panel: Auth Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-6 sm:p-12 overflow-y-auto bg-slate-50 lg:bg-white">
        {/* Background decorative blurs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-50 lg:opacity-30">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-3xl" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md my-8">

        {/* Mobile only logo */}
        <div className="flex lg:hidden items-center justify-center gap-2.5 mb-10">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
            <FiLayers size={20} />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            SAAS<span className="text-emerald-600">IO</span>
          </span>
        </div>

        {/* Back button (OTP step) */}
        {step === "otp" && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-6 group"
          >
            <FiChevronLeft
              size={15}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to email
          </button>
        )}

        {step === "success" ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <FiCheckCircle size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
            <p className="text-slate-500">
              We've sent an activation link to <span className="font-semibold">{email}</span>. 
              Please click the link to activate your account.
            </p>
            <button
               onClick={() => { setMode("login"); setStep("form"); }}
               className="text-emerald-600 font-semibold hover:underline"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center">
                {step === "otp" ? "Verify OTP" : mode === "login" ? "Welcome back" : "Create Account"}
              </h1>
              <p className="text-sm text-slate-500 mt-1.5 text-center">
                {step === "otp" ? (
                   <>Code sent to <span className="font-semibold text-slate-700">{email}</span></>
                ) : mode === "login" ? (
                  "Enter your email to receive a one-time code."
                ) : (
                  "Fill in your details to get started with SAASIO."
                )}
              </p>
            </div>

            <form
              onSubmit={step === "otp" ? handleVerifyOtp : mode === "login" ? handleLogin : handleSignup}
              className="space-y-4"
            >
              {step === "otp" ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide text-center">
                    6-Digit Code
                  </p>
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
                  <p className="text-xs text-slate-400 text-center">
                    Code expires in 3 minutes
                  </p>
                </div>
              ) : (
                <>
                  {mode === "signup" && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</label>
                        <div className="relative">
                          <FiUser size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mobile Number</label>
                        <div className="relative">
                          <FiPhone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            placeholder="+91 XXXXX XXXXX"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email Address</label>
                    <div className="relative group">
                      <FiMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      />
                    </div>
                  </div>

                  {mode === "signup" && (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Occupation</label>
                          <div className="relative">
                            <FiBriefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Software Engineer"
                              value={occupation}
                              onChange={(e) => setOccupation(e.target.value)}
                              required
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">State</label>
                          <div className="relative">
                            <FiMapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Karnataka"
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              required
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Country</label>
                          <div className="relative">
                            <FiGlobe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="India"
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              required
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">How did you hear about us?</label>
                          <div className="relative">
                            <FiInfo size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                            <CustomSelect
                              value={source}
                              onChange={setSource}
                              options={[
                                { value: "GOOGLE", label: "Google Search" },
                                { value: "LINKEDIN", label: "LinkedIn" },
                                { value: "TWITTER", label: "Twitter (X)" },
                                { value: "YOUTUBE", label: "YouTube" },
                                { value: "FRIEND", label: "Friend / Colleague" },
                                { value: "OTHER", label: "Other" },
                              ]}
                              placeholder="Select an option"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {mode === "login" && (
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                      <FiShield size={11} className="text-emerald-500" />
                      We&apos;ll send a one-time code — no password needed
                    </p>
                  )}
                </>
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
                ) : step === "otp" ? (
                  <>
                    <span>Verify &amp; Sign In</span>
                    <FiCheckCircle size={16} />
                  </>
                ) : mode === "login" ? (
                  <>
                    <span>Continue</span>
                    <FiArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <FiArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={toggleMode}
                  className="text-emerald-600 font-bold hover:text-emerald-500 transition-colors"
                >
                  {mode === "login" ? "Create Account" : "Sign In"}
                </button>
              </p>
            </div>

            {/* Back to home */}
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="text-sm text-slate-400 hover:text-emerald-600 transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Protected by <span className="font-semibold text-slate-500">SAASIO</span> · v1.0
        </p>
      </div>
    </div>
  </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

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
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
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
          isOpen ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-slate-200"
        } rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium cursor-pointer transition-all flex items-center justify-between hover:border-emerald-500`}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {selectedLabel}
        </span>
        <FiChevronLeft
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-90" : "-rotate-90"
          }`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1.5"
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                  value === option.value
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
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
