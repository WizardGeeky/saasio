"use client";

import { FiMenu, FiBell, FiSun, FiMoon } from "react-icons/fi";
import Link from "next/link";
import { useDashTheme } from "@/app/contexts/DashThemeContext";

interface DashboardTopbarProps {
  onMobileMenuToggle: () => void;
  userName?: string;
  userRole?: string;
}

export function DashboardTopbar({
  onMobileMenuToggle,
  userName = "Admin",
  userRole = "",
}: DashboardTopbarProps) {
  const { isDark, toggle } = useDashTheme();
  const headerTone = isDark
    ? "border-white/10 bg-[linear-gradient(180deg,rgba(10,16,31,0.84),rgba(7,11,22,0.76))] text-slate-100 shadow-[0_26px_60px_-42px_rgba(0,0,0,0.88)]"
    : "border-[#e5d7c7] bg-[#fffaf4]/84 text-[#102033] shadow-[0_24px_60px_-42px_rgba(16,32,51,0.28)]";
  const iconButtonTone = isDark
    ? "border-white/10 bg-white/[0.04] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-[#7ee8dc]/30 hover:bg-white/[0.08] hover:text-white"
    : "border-[#eadfce] bg-white/80 text-[#7b5a43] hover:border-[#ffd4c5] hover:bg-white hover:text-[#102033]";
  const toggleTone = isDark
    ? "border-white/10 bg-white/[0.05] text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-[#ffb489]/38 hover:bg-[linear-gradient(135deg,rgba(255,166,130,0.12),rgba(255,255,255,0.06))] hover:text-[#ffe0d3]"
    : "border-[#eadfce] bg-white/85 text-[#8c6d54] hover:border-[#ffcfbe] hover:text-[#102033]";
  const userTone = isDark
    ? "border-white/10 bg-white/[0.05] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-[#7ee8dc]/24 hover:bg-white/[0.08]"
    : "border-[#eadfce] bg-white/88 text-[#102033] hover:border-[#ffd4c5] hover:bg-white";
  const avatarTone = isDark
    ? "from-[#ff8d6b] via-[#ff6b4a] to-[#0f766e] shadow-[0_18px_40px_-22px_rgba(255,107,74,0.7)]"
    : "from-[#102033] via-[#21364b] to-[#0f766e] shadow-[0_18px_40px_-22px_rgba(16,32,51,0.65)]";
  const badgeTone = isDark
    ? "border-white/10 bg-white/[0.05] text-[#a8f3ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    : "border-[#e6d8c7] bg-white/78 text-[#8c6d54]";

  const initials = userName
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className={`relative z-30 flex h-16 sm:h-20 items-center justify-between overflow-hidden border-b px-4 lg:px-8 shrink-0 backdrop-blur-xl transition-all duration-300 ${headerTone}`}>
      {isDark && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-0 h-full w-64 bg-[radial-gradient(circle_at_right,rgba(45,212,191,0.14),transparent_62%)]"
          />
        </>
      )}

      <button
        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-[1rem] border transition-all lg:hidden ${iconButtonTone}`}
        onClick={onMobileMenuToggle}
        aria-label="Open menu"
      >
        <FiMenu size={22} />
      </button>

      <div className="relative z-10 flex-1 lg:hidden" />

      <div className="relative z-10 hidden flex-1 items-center lg:flex">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] ${badgeTone}`}>
          <span className={`h-2 w-2 rounded-full ${isDark ? "bg-[#a8f3ea]" : "bg-[#d9481f]"}`} />
          Dashboard workspace
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className={`flex h-10 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-all ${toggleTone}`}
        >
          {isDark ? <FiSun size={13} /> : <FiMoon size={13} />}
          <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
        </button>

        <Link
          href="/dashboard/notifications"
          className={`relative flex h-10 w-10 items-center justify-center rounded-[1rem] border transition-all ${iconButtonTone}`}
          title="Notifications"
        >
          <FiBell size={19} />
        </Link>

        <div className={`ml-1 flex cursor-default items-center gap-3 rounded-[1.15rem] border px-2.5 py-1.5 transition-all ${userTone}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-[0.95rem] bg-linear-to-br text-[0.7rem] font-bold text-white shrink-0 ${avatarTone}`}>
            {initials}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className={`max-w-[120px] truncate text-xs font-semibold ${isDark ? "text-white" : "text-[#102033]"}`}>{userName}</p>
            {userRole && (
              <p className={`max-w-[120px] truncate text-[10px] font-medium uppercase tracking-[0.16em] ${isDark ? "text-slate-400" : "text-[#8c6d54]"}`}>{userRole}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
