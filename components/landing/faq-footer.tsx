"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  FiArrowRight,
  FiAward,
  FiCheck,
  FiChevronDown,
  FiDownload,
  FiLayers,
  FiShield,
} from "react-icons/fi";

import { cn } from "@/lib/utils";

import { CONTAINER, faqs } from "./data";
import { CtaLink } from "./shared";

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const quickFacts = [
    {
      icon: FiCheck,
      title: "Pay once",
      copy: "No subscriptions or recurring charges.",
    },
    {
      icon: FiShield,
      title: "Secure checkout",
      copy: "Payments handled through Razorpay.",
    },
    {
      icon: FiDownload,
      title: "Instant PDF",
      copy: "Download right after generation.",
    },
    {
      icon: FiLayers,
      title: "Role versions",
      copy: "Keep separate resumes for each application.",
    },
  ];

  return (
    <section id="faq" className="bg-[#fffaf4] py-20 sm:py-24 lg:py-28">
      <div className={CONTAINER}>
        <div
          className="overflow-hidden rounded-[2rem] border border-[#eadfce] bg-[#fffdf9] p-5 shadow-[0_35px_80px_-55px_rgba(15,23,42,0.28)] sm:rounded-[2.75rem] sm:p-8 lg:p-10"
          data-aos="fade-up"
        >
          <div className="grid gap-6 border-b border-[#efe3d6] pb-7 sm:gap-8 sm:pb-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-[#e8d8c8] bg-[#fff7f0] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8c6d54]">
                FAQ
              </span>
              <h2 className="mt-4 font-heading text-3xl font-bold leading-tight text-[#102033] sm:mt-5 sm:text-5xl">
                Questions before you start?
                <span className="block text-[#d9481f]">
                  Everything is answered here.
                </span>
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600 sm:mt-5 sm:text-lg">
                This should feel simple before you ever reach checkout. Here are
                the answers users usually need before they decide to build their
                first resume.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {quickFacts.map(({ icon: Icon, title, copy }, index) => (
                <div
                  key={title}
                  className="rounded-[1.35rem] border border-[#eee2d5] bg-[#fffaf4] p-4 sm:rounded-[1.5rem]"
                  data-aos="zoom-in"
                  data-aos-delay={index * 70}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#102033] text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-[#102033]">
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div
                className="rounded-[1.75rem] border border-[#e9ddd0] bg-[#102033] p-6 text-white shadow-[0_28px_70px_-45px_rgba(15,23,42,0.85)] sm:rounded-[2rem] sm:p-7"
                data-aos="fade-right"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  Before You Pay
                </span>
                <h3 className="mt-4 font-heading text-2xl font-bold leading-tight sm:mt-5 sm:text-3xl">
                  Pick your plan with confidence.
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/68">
                  SAASIO is intentionally straightforward: paste the role,
                  tailor the resume, export the PDF, and apply. No hidden
                  workflow and no subscription trap.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    "Best for freshers and active job seekers",
                    "ATS-focused resume tailoring in seconds",
                    "Works across multiple target roles",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#102033]">
                        <FiCheck className="h-3 w-3" />
                      </span>
                      <span className="text-sm text-white/82">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <CtaLink
                    href="/login"
                    className="w-full justify-center px-6 py-3.5 text-sm sm:w-auto lg:w-full"
                  >
                    Build My Resume
                    <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </CtaLink>
                  <a
                    href="#pricing"
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/5 sm:w-auto lg:w-full"
                  >
                    Compare Pricing
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4" data-aos="fade-left" data-aos-delay="90">
              {faqs.map((faq, index) => (
                <div
                  key={faq.q}
                  className={cn(
                    "overflow-hidden rounded-[1.5rem] border bg-white transition-all duration-300 sm:rounded-[1.75rem]",
                    openIdx === index
                      ? "border-[#ffcfbe] shadow-[0_22px_55px_-40px_rgba(255,107,74,0.3)]"
                      : "border-[#eadfce] hover:border-[#e6d5c4]",
                  )}
                  data-aos="fade-left"
                  data-aos-delay={index * 55}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(openIdx === index ? null : index)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:gap-4 sm:px-6 sm:py-5"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-[11px] font-bold sm:h-9 sm:w-9 sm:rounded-2xl sm:text-xs",
                          openIdx === index
                            ? "border-[#ffd4c5] bg-[#fff4ec] text-[#d9481f]"
                            : "border-[#ece1d4] bg-[#fffaf4] text-[#8c6d54]",
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <span
                          className={cn(
                            "block text-sm font-semibold sm:text-base",
                            openIdx === index
                              ? "text-[#102033]"
                              : "text-slate-700",
                          )}
                        >
                          {faq.q}
                        </span>
                        {openIdx !== index && (
                          <span className="mt-1 block text-xs text-slate-400">
                            Tap to view the answer
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.span
                      animate={{ rotate: openIdx === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "shrink-0 rounded-full border p-2",
                        openIdx === index
                          ? "border-[#ffd4c5] bg-[#fff4ec] text-[#d9481f]"
                          : "border-[#ece1d4] text-slate-400",
                      )}
                    >
                      <FiChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openIdx === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                          <div className="h-px bg-[#f1e5d7]" />
                          <p className="pt-4 text-sm leading-7 text-slate-600 sm:pt-5 sm:text-[15px]">
                            {faq.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="bg-[#fffaf4] pb-20 sm:pb-24">
      <div className={CONTAINER}>
        <div
          className="rounded-[2rem] border border-[#e5d7c7] bg-[#102033] px-5 py-10 shadow-[0_40px_90px_-55px_rgba(15,23,42,0.95)] sm:rounded-[2.5rem] sm:px-8 sm:py-12 lg:px-12 lg:py-14"
          data-aos="zoom-in-up"
        >
          <div className="relative grid items-center gap-8 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                <FiAward className="h-3.5 w-3.5 text-[#ffb489]" />
                Start today
              </span>
              <h2 className="mt-5 font-heading text-3xl font-bold leading-tight text-white sm:mt-6 sm:text-5xl lg:text-6xl">
                Build the next version of your resume before this coffee gets
                cold.
              </h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/65 sm:mt-5 sm:text-lg">
                The product already had the right promise. Now the landing page
                matches it with clearer momentum, stronger contrast, and a
                sharper first click.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                <CtaLink
                  href="/login"
                  className="w-full justify-center px-7 py-4 text-base sm:w-auto sm:justify-start"
                >
                  Build My Resume
                  <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </CtaLink>
                <a
                  href="#pricing"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-7 py-4 text-base font-semibold text-white/85 transition-all duration-300 hover:bg-white/5 sm:w-auto"
                >
                  View Pricing
                </a>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { value: "97/100", label: "ATS scores on tailored resumes" },
                { value: "28 sec", label: "Average generation time" },
                { value: "50+", label: "Layouts plus version tracking" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] bg-white/90 p-4 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.55)] sm:rounded-[1.75rem] sm:p-5"
                >
                  <div className="text-2xl font-black tracking-tight text-[#102033] sm:text-3xl">
                    {item.value}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0d1520] text-slate-400">
      <div className={cn(CONTAINER, "py-14 sm:py-16")}>
        <div
          className="grid gap-8 border-b border-white/10 pb-10 sm:gap-10 sm:pb-12 md:grid-cols-2 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.9fr]"
          data-aos="fade-up"
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-[#102033] sm:h-11 sm:w-11">
                S
              </span>
              <div>
                <div className="font-heading text-lg font-bold text-white sm:text-xl">
                  SAASIO
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Resume Studio
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              AI-powered resume building for job seekers who want ATS-friendly,
              role-specific resumes without burning hours on formatting and
              edits.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Product
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href="#features"
                  className="transition-colors hover:text-white"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="transition-colors hover:text-white"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="transition-colors hover:text-white"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Company
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Support
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Legal
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-white"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-white"
                >
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>Copyright {currentYear} SAASIO. All rights reserved.</p>
          <span>support@saasio.in</span>
        </div>
      </div>
    </footer>
  );
}
