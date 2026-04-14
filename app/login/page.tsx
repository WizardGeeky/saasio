"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiGlobe,
  FiInfo,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiUser,
} from "react-icons/fi";

import { useToast } from "@/components/ui/toast";
import { useAuthGuard } from "@/app/utils/useAuthGuard";

type AuthMode = "login" | "signup";
type AuthStep = "form" | "otp" | "success";

type SelectOption = {
  value: string;
  label: string;
};

const showcaseCards = [
  { company: "Google", role: "Senior SWE", score: 96, delay: 0.18 },
  { company: "Swiggy", role: "Product Manager", score: 91, delay: 0.28 },
  { company: "PhonePe", role: "Data Scientist", score: 88, delay: 0.38 },
];

const sourceOptions: SelectOption[] = [
  { value: "GOOGLE", label: "Google" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "TWITTER", label: "Twitter (X)" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "FRIEND", label: "Friend" },
  { value: "OTHER", label: "Other" },
];

const inputCls =
  "w-full rounded-[1rem] border border-[#e5d8c9] bg-[#fffaf4] py-3 pl-11 pr-4 text-sm font-medium text-[#102033] placeholder:text-slate-400 focus:border-[#d9481f] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ff6b4a]/15 transition-all";

function MatchCard({
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
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-[#102033]">
          {score}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{role}</p>
          <p className="truncate text-xs text-white/62">{company}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#ffd0c2] bg-[#fff4ec] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#d9481f]">
          <FiCheck className="h-3 w-3" />
          Match
        </span>
      </div>
    </motion.div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden h-full min-h-dvh overflow-hidden bg-[#102033] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, rgba(255,107,74,0.24), transparent 26%), radial-gradient(circle at 82% 18%, rgba(15,118,110,0.2), transparent 24%), linear-gradient(180deg, rgba(16,32,51,0.95) 0%, rgba(13,21,32,1) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="absolute -left-16 bottom-16 h-48 w-48 rounded-full bg-[#ff6b4a]/18 blur-3xl" />
      <div className="absolute right-0 top-14 h-44 w-44 rounded-full bg-[#0f766e]/18 blur-3xl" />

      <div className="relative">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-[#102033]">
            S
          </span>
          <div>
            <div className="font-heading text-xl font-bold">SAASIO</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
              Resume Studio
            </div>
          </div>
        </Link>
      </div>

      <div className="relative max-w-xl">
        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
          Resume Access
        </span>
        <h1 className="mt-6 font-heading text-5xl font-bold leading-[0.98] tracking-[-0.04em]">
          Turn any job description into
          <span className="mt-2 block text-[#ffb489]">
            a resume recruiters want to open.
          </span>
        </h1>
        <p className="mt-5 max-w-lg text-base leading-8 text-white/68">
          The auth flow now uses the same SAASIO visual language as the landing
          page. Desktop stays in a clean two-column split, and mobile collapses
          down to one focused form column.
        </p>

        <div className="mt-8 space-y-3">
          {showcaseCards.map((card) => (
            <MatchCard key={card.role} {...card} />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { value: "10K+", label: "Users" },
            { value: "Rs9", label: "Starting" },
            { value: "30s", label: "Average" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-4"
            >
              <p className="font-heading text-2xl font-bold text-white">
                {item.value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/55 transition-colors hover:text-white"
        >
          <FiChevronLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}

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
      <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c6d54]">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8c6d54]">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

function LoginContent() {
  useAuthGuard("requireGuest");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();

  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<AuthStep>("form");
  const [isLoading, setIsLoading] = useState(false);
  const hasShownActivationToast = React.useRef(false);

  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");
  const [mobile, setMobile] = useState("");
  const [occupation, setOccupation] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [source, setSource] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  useEffect(() => {
    if (
      searchParams.get("activated") === "true" &&
      !hasShownActivationToast.current
    ) {
      toastSuccess("Account activated successfully! You can now sign in.");
      hasShownActivationToast.current = true;
    }
  }, [searchParams, toastSuccess]);

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

  const handleOtpChange = (index: number, value: string) => {
    const nextValue = value.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = nextValue;
    setOtp(nextOtp);

    if (nextValue && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (!pasted) {
      return;
    }

    const nextOtp = [...otp];
    pasted.split("").forEach((char, index) => {
      nextOtp[index] = char;
    });
    setOtp(nextOtp);
    document.getElementById(`otp-${Math.min(pasted.length - 1, 5)}`)?.focus();
  };

  const handleBack = () => {
    setStep("form");
    setOtp(["", "", "", "", "", ""]);
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setStep("form");
  };

  const heading =
    step === "otp"
      ? "Verify your email"
      : mode === "login"
        ? "Welcome back"
        : "Create your account";

  const subheading =
    step === "otp" ? (
      <>
        Enter the code sent to <span className="font-semibold text-[#102033]">{email}</span>.
      </>
    ) : mode === "login" ? (
      "Enter your email and we will send a one-time sign-in code."
    ) : (
      "Start building ATS-optimized resumes in the same flow as the landing page."
    );

  return (
    <div className="grid h-dvh w-screen overflow-hidden bg-[#fffdf9]/95 lg:grid-cols-[minmax(0,1.02fr)_minmax(380px,0.98fr)]">
      <BrandPanel />

      <div className="relative flex h-dvh items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(255,107,74,0.18), transparent 28%), radial-gradient(circle at 82% 16%, rgba(15,118,110,0.14), transparent 22%), linear-gradient(180deg, #fffdf9 0%, #f8f1e7 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <div className="absolute -left-12 top-10 h-36 w-36 rounded-full bg-white/80 blur-3xl" />
        <div className="absolute bottom-6 right-0 h-36 w-36 rounded-full bg-[#ffcfbe]/45 blur-3xl" />

        <div className="relative z-10 w-full max-w-[32rem]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#102033] text-sm font-black text-white">
                S
              </span>
              <div>
                <div className="font-heading text-lg font-bold text-[#102033]">
                  SAASIO
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c6d54]">
                  Resume Studio
                </div>
              </div>
            </Link>
            <Link
              href="/"
              className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#102033]"
            >
              Back home
            </Link>
          </div>

          {step === "otp" && (
            <button
              type="button"
              onClick={handleBack}
              className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-[#102033]"
            >
              <FiChevronLeft className="h-4 w-4" />
              Back to email
            </button>
          )}

          <AnimatePresence mode="wait">
            {step === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.28 }}
                className="rounded-[2rem] border border-[#eadfce] bg-white/90 p-8 text-center shadow-[0_24px_70px_-45px_rgba(15,23,42,0.45)]"
              >
                <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-[#102033] shadow-[0_20px_45px_-24px_rgba(15,23,42,0.8)]">
                  <FiCheckCircle className="h-8 w-8 text-[#ffb489]" />
                </div>
                <h2 className="mt-6 font-heading text-3xl font-bold text-[#102033]">
                  Check your inbox
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  We sent an activation link to <span className="font-semibold text-[#102033]">{email}</span>.
                  Open that email, activate your account, then come back here to sign in.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setStep("form");
                  }}
                  className="mt-6 inline-flex items-center justify-center rounded-full border border-[#d8c9b6] px-5 py-3 text-sm font-semibold text-[#102033] transition-colors hover:bg-[#fffaf4]"
                >
                  Go to sign in
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={`${mode}-${step}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-7 text-center">
                  <span className="inline-flex rounded-full border border-[#e8d8c8] bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8c6d54] shadow-[0_15px_30px_-20px_rgba(15,23,42,0.3)]">
                    {step === "otp" ? "Secure verification" : "Account access"}
                  </span>
                  <h1 className="mt-5 font-heading text-4xl font-bold tracking-[-0.04em] text-[#102033]">
                    {heading}
                  </h1>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
                    {subheading}
                  </p>
                </div>

                {step === "form" && (
                  <div className="mb-6 flex rounded-[1.2rem] border border-[#eadfce] bg-white/75 p-1 shadow-[0_15px_35px_-28px_rgba(15,23,42,0.3)]">
                    {(["login", "signup"] as AuthMode[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setMode(value);
                          setStep("form");
                        }}
                        className={`flex-1 rounded-[0.95rem] px-4 py-2.5 text-sm font-semibold transition-all ${
                          mode === value
                            ? "bg-[#102033] text-white shadow-[0_18px_35px_-24px_rgba(15,23,42,0.8)]"
                            : "text-slate-500 hover:text-[#102033]"
                        }`}
                      >
                        {value === "login" ? "Sign In" : "Sign Up"}
                      </button>
                    ))}
                  </div>
                )}

                <div className="rounded-[2rem] border border-[#eadfce] bg-white/92 p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.4)] sm:p-7">
                  <form
                    onSubmit={
                      step === "otp"
                        ? handleVerifyOtp
                        : mode === "login"
                          ? handleLogin
                          : handleSignup
                    }
                    className="space-y-4"
                  >
                    <AnimatePresence mode="wait">
                      {step === "otp" ? (
                        <motion.div
                          key="otp"
                          initial={{ opacity: 0, x: 18 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -18 }}
                          transition={{ duration: 0.22 }}
                          className="space-y-5"
                        >
                          <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c6d54]">
                            6-digit code
                          </p>
                          <div className="flex justify-center gap-2 sm:gap-2.5">
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
                                className="h-14 w-11 rounded-[1rem] border-2 border-[#eadfce] bg-[#fffaf4] text-center text-lg font-bold text-[#102033] focus:border-[#d9481f] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ff6b4a]/15 sm:w-12"
                                placeholder="-"
                              />
                            ))}
                          </div>
                          <p className="text-center text-xs text-slate-400">
                            Code expires in 3 minutes
                          </p>
                        </motion.div>
                      ) : mode === "login" ? (
                        <motion.div
                          key="login"
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.22 }}
                          className="space-y-3"
                        >
                          <Field label="Email Address" icon={<FiMail className="h-4 w-4" />}>
                            <input
                              type="email"
                              placeholder="name@company.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className={inputCls}
                            />
                          </Field>
                          <div className="rounded-[1rem] border border-[#e9ddd0] bg-[#fffaf4] px-4 py-3 text-sm text-slate-600">
                            <span className="flex items-start gap-2.5">
                              <FiShield className="mt-0.5 h-4 w-4 shrink-0 text-[#d9481f]" />
                              No password needed. We send a secure one-time code to your email.
                            </span>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="signup"
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.22 }}
                          className="space-y-3.5"
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Full Name" icon={<FiUser className="h-4 w-4" />}>
                              <input
                                type="text"
                                placeholder="John Doe"
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                                required
                                className={inputCls}
                              />
                            </Field>
                            <Field label="Mobile" icon={<FiPhone className="h-4 w-4" />}>
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

                          <Field label="Email Address" icon={<FiMail className="h-4 w-4" />}>
                            <input
                              type="email"
                              placeholder="name@company.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className={inputCls}
                            />
                          </Field>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Occupation" icon={<FiBriefcase className="h-4 w-4" />}>
                              <input
                                type="text"
                                placeholder="Engineer"
                                value={occupation}
                                onChange={(e) => setOccupation(e.target.value)}
                                required
                                className={inputCls}
                              />
                            </Field>
                            <Field label="State" icon={<FiMapPin className="h-4 w-4" />}>
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

                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Country" icon={<FiGlobe className="h-4 w-4" />}>
                              <input
                                type="text"
                                placeholder="India"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                required
                                className={inputCls}
                              />
                            </Field>
                            <Field label="How Did You Hear?" icon={<FiInfo className="h-4 w-4" />}>
                              <CustomSelect
                                value={source}
                                onChange={setSource}
                                options={sourceOptions}
                                placeholder="Select"
                              />
                            </Field>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="relative mt-2 w-full overflow-hidden rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-4 focus:ring-[#ff6b4a]/25 disabled:cursor-not-allowed disabled:opacity-70"
                      style={{
                        background: isLoading
                          ? "#d9481f"
                          : "linear-gradient(135deg,#ff6b4a,#ff9b5f)",
                        boxShadow: "0 20px 45px -26px rgba(217,72,31,0.75)",
                      }}
                    >
                      {!isLoading && (
                        <span
                          className="pointer-events-none absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)",
                            animation: "shimmer-traverse 2.6s ease-in-out infinite",
                          }}
                        />
                      )}
                      <span className="relative flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" />
                          </>
                        ) : step === "otp" ? (
                          <>
                            Verify and sign in
                            <FiCheckCircle className="h-4 w-4" />
                          </>
                        ) : mode === "login" ? (
                          <>
                            Continue
                            <FiArrowRight className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Create account
                            <FiArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                </div>

                <div className="mt-5 text-center">
                  <p className="text-sm text-slate-500">
                    {mode === "login" ? "New to SAASIO?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="font-semibold text-[#d9481f] transition-colors hover:text-[#b93812]"
                    >
                      {mode === "login" ? "Create account" : "Sign in"}
                    </button>
                  </p>
                </div>

                <p className="mt-8 text-center text-xs leading-6 text-slate-400">
                  By continuing, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-slate-500 underline underline-offset-2 transition-colors hover:text-[#102033]"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-slate-500 underline underline-offset-2 transition-colors hover:text-[#102033]"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative h-dvh overflow-hidden bg-[#fffaf4] text-[#102033]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,107,74,0.22), transparent 34%), radial-gradient(circle at 82% 18%, rgba(15,118,110,0.16), transparent 26%), linear-gradient(180deg, #fffaf4 0%, #f2eadf 100%)",
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
      <div className="absolute left-1/2 top-16 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-white/55 blur-3xl" />

      <div className="relative flex h-dvh w-screen items-stretch">
        {children}
      </div>
    </main>
  );
}

function LoginFallback() {
  return (
    <LoginShell>
      <div className="flex h-dvh w-screen items-center justify-center bg-white/80 backdrop-blur-xl">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#d9481f]/20 border-t-[#d9481f]" />
      </div>
    </LoginShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginShell>
        <LoginContent />
      </LoginShell>
    </Suspense>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((option) => option.value === value)?.label || placeholder;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full items-center justify-between rounded-[1rem] border bg-[#fffaf4] py-3 pl-11 pr-4 text-sm font-medium transition-all ${
          isOpen
            ? "border-[#d9481f] bg-white ring-4 ring-[#ff6b4a]/15"
            : "border-[#e5d8c9] hover:border-[#d8c9b6]"
        }`}
      >
        <span className={value ? "truncate text-[#102033]" : "truncate text-slate-400"}>
          {selectedLabel}
        </span>
        <FiChevronDown
          className={`h-4 w-4 shrink-0 text-[#8c6d54] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-[1rem] border border-[#eadfce] bg-white shadow-[0_24px_60px_-35px_rgba(15,23,42,0.35)]"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                  value === option.value
                    ? "bg-[#fff4ec] text-[#d9481f]"
                    : "text-slate-700 hover:bg-[#fffaf4] hover:text-[#102033]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
