"use client";

import { FiMenu, FiBell } from "react-icons/fi";
import Link from "next/link";

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
  const initials = userName
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 sm:h-20 items-center justify-between bg-white px-4 lg:px-8 z-30 border-b border-gray-200 shadow-sm shrink-0">
      {/* Mobile menu toggle */}
      <button
        className="flex lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        onClick={onMobileMenuToggle}
        aria-label="Open menu"
      >
        <FiMenu size={22} />
      </button>

      {/* Left spacer on mobile */}
      <div className="flex-1 lg:hidden" />

      {/* Desktop left — empty for now (search could go here) */}
      <div className="hidden lg:flex flex-1 items-center" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <Link
          href="/dashboard/notifications"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-all"
          title="Notifications"
        >
          <FiBell size={19} />
        </Link>

        {/* User pill */}
        <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-2.5 py-1.5 rounded-xl transition-all cursor-default ml-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-emerald-700 text-[0.7rem] font-bold text-white shadow-sm shadow-emerald-500/30 shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-xs font-semibold text-slate-800 max-w-[110px] truncate">{userName}</p>
            {userRole && (
              <p className="text-[10px] text-slate-400 font-medium max-w-[110px] truncate">{userRole}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
