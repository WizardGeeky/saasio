"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiArrowRight, FiMenu, FiX } from "react-icons/fi";

import { cn } from "@/lib/utils";

import { NAV_LINKS } from "./data";

export function CtaLink({
  href,
  children,
  className,
  tone = "coral",
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  tone?: "coral" | "ink";
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  const background =
    tone === "ink"
      ? "linear-gradient(135deg,#102033,#21364b)"
      : "linear-gradient(135deg,#ff6b4a,#ff9b5f)";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5",
        className,
      )}
      style={{ background }}
    >
      <span className="flex items-center gap-2">{children}</span>
    </Link>
  );
}

type NavbarLink = {
  label: string;
  href: string;
};

type NavbarAction = {
  label: string;
  href: string;
};

export function SectionIntro({
  badge,
  title,
  accent,
  description,
  dark = false,
  animation = "fade-up",
  delay = 0,
}: {
  badge: string;
  title: string;
  accent: string;
  description: string;
  dark?: boolean;
  animation?: string;
  delay?: number;
}) {
  return (
    <div
      className="mx-auto max-w-3xl text-center"
      data-aos={animation}
      data-aos-delay={delay}
    >
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em]",
          dark
            ? "border-white/15 bg-white/5 text-white/70"
            : "border-[#e6d8c7] bg-white/80 text-[#7b5a43]",
        )}
      >
        {badge}
      </span>
      <h2
        className={cn(
          "mt-5 font-heading text-3xl font-bold leading-tight sm:mt-6 sm:text-5xl lg:text-6xl",
          dark ? "text-white" : "text-[#102033]",
        )}
      >
        {title}{" "}
        <span className={dark ? "text-[#ffb489]" : "text-[#d9481f]"}>
          {accent}
        </span>
      </h2>
      <p
        className={cn(
          "mx-auto mt-4 max-w-2xl text-[15px] leading-7 sm:mt-5 sm:text-lg",
          dark ? "text-white/65" : "text-slate-600",
        )}
      >
        {description}
      </p>
    </div>
  );
}

export function Navbar({
  links = NAV_LINKS,
  primaryAction = { label: "Get Started", href: "/login" },
  secondaryAction = { label: "Sign In", href: "/login" },
}: {
  links?: NavbarLink[];
  primaryAction?: NavbarAction | null;
  secondaryAction?: NavbarAction | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const mobileActions = [secondaryAction, primaryAction].filter(
    (action): action is NavbarAction => Boolean(action),
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (open) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const shellTone =
    open || scrolled
      ? "border-[#e5d7c7] bg-[#fffaf4]/94 shadow-[0_22px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl"
      : "border-transparent bg-transparent";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-2.5 pt-2.5 sm:px-6 sm:pt-4 lg:px-8">
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Close navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#102033]/18 backdrop-blur-[3px] md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-[88rem] rounded-[1.75rem] border transition-all duration-300",
          shellTone,
        )}
      >
        <div className="flex items-center justify-between px-2.5 py-2.5 sm:px-5 sm:py-3">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-[1.2rem] bg-[#102033] text-sm font-black text-white shadow-[0_16px_35px_-18px_rgba(16,32,51,0.9)] sm:h-11 sm:w-11 sm:rounded-2xl">
              S
            </span>
            <div className="min-w-0">
              <div className="font-heading text-[1.05rem] font-bold text-[#102033] sm:text-xl">
                SAASIO
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8c6d54] sm:text-[10px] sm:tracking-[0.22em]">
                Resume Studio
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                whileHover={{ y: -1 }}
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#102033]"
              >
                {link.label}
              </motion.a>
            ))}
          </div>

          {(secondaryAction || primaryAction) && (
            <div className="hidden items-center gap-3 md:flex">
              {secondaryAction && (
                <Link
                  href={secondaryAction.href}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white/80 hover:text-[#102033]"
                >
                  {secondaryAction.label}
                </Link>
              )}
              {primaryAction && (
                <CtaLink
                  href={primaryAction.href}
                  className="px-5 py-3 text-sm"
                >
                  {primaryAction.label}
                  <FiArrowRight className="h-4 w-4" />
                </CtaLink>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-[1.2rem] border border-[#e5d7c7] bg-[#fffdf9] text-[#102033] md:hidden sm:h-11 sm:w-11 sm:rounded-2xl"
            aria-label="Toggle navigation"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "close" : "menu"}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.18 }}
              >
                {open ? (
                  <FiX className="h-5 w-5" />
                ) : (
                  <FiMenu className="h-5 w-5" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-x-2.5 top-[4.7rem] bottom-3 z-10 md:hidden sm:inset-x-6 sm:top-[6rem]"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#eadfce] bg-[#fffaf4] shadow-[0_28px_60px_-28px_rgba(16,32,51,0.32)]">
              <div className="border-b border-[#efe3d6] bg-[linear-gradient(180deg,#fffdf9,#fff7ee)] px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8c6d54]">
                  Navigation
                </p>
                <p className="mt-1 text-sm font-semibold text-[#102033]">
                  Explore SAASIO on mobile
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-1.5">
                  {links.map((link, index) => (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="block rounded-[1.4rem] border border-[#efe3d6] bg-white px-4 py-4 text-sm font-semibold text-slate-700 shadow-[0_14px_28px_-24px_rgba(16,32,51,0.28)] transition-all hover:border-[#e5d7c7] hover:-translate-y-0.5 hover:text-[#102033]"
                    >
                      {link.label}
                    </motion.a>
                  ))}
                </div>

                {mobileActions.length > 0 && (
                  <div className="mt-5 grid gap-3">
                    {secondaryAction && (
                      <Link
                        href={secondaryAction.href}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center justify-center rounded-full border border-[#d8c8b8] bg-white px-4 py-3.5 text-sm font-semibold text-[#102033] transition-colors hover:bg-[#fffdf9]"
                      >
                        {secondaryAction.label}
                      </Link>
                    )}
                    {primaryAction && (
                      <CtaLink
                        href={primaryAction.href}
                        onClick={() => setOpen(false)}
                        className="justify-center px-4 py-3.5 text-sm"
                      >
                        {primaryAction.label}
                      </CtaLink>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
