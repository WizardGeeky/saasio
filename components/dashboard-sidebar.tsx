"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiLayers, FiLogOut, FiX, FiChevronDown } from "react-icons/fi";
import { useDashTheme } from "@/app/contexts/DashThemeContext";

export type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
};

interface DashboardSidebarProps {
  navItems: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}

// ─── Single nav link ──────────────────────────────────────────────────────────

function NavLink({
  item,
  isActive,
  isDark,
  onClose,
  indent = false,
}: {
  item: NavItem;
  isActive: boolean;
  isDark: boolean;
  onClose: () => void;
  indent?: boolean;
}) {
  const activeTone = isDark
    ? "border-[#ffb78d]/30 bg-[linear-gradient(135deg,rgba(255,166,130,0.18),rgba(45,212,191,0.1)_58%,rgba(99,102,241,0.14))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_44px_-28px_rgba(13,148,136,0.48)]"
    : "border-[#ffd7c9] bg-[linear-gradient(135deg,#fff4ec,#fffaf6)] text-[#102033] shadow-[0_18px_36px_-30px_rgba(255,107,74,0.42)]";
  const idleTone = isDark
    ? "border-transparent text-slate-300 hover:-translate-y-[1px] hover:border-white/10 hover:bg-white/[0.055] hover:text-white hover:shadow-[0_18px_34px_-30px_rgba(0,0,0,0.85)]"
    : "border-transparent text-slate-700 hover:border-[#eadfce] hover:bg-white/85 hover:text-[#102033]";
  const iconTone = isActive
    ? isDark
      ? "text-[#ffe3d4]"
      : "text-[#d9481f]"
    : isDark
      ? "text-slate-500 group-hover:text-[#9ce8de]"
      : "text-[#8c6d54] group-hover:text-[#0f766e]";

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`group flex items-center gap-3 rounded-[1.15rem] border px-4 py-3 font-semibold transition-all duration-200 ${
        indent ? "ml-3 pl-4 text-[0.95rem]" : "text-[0.98rem]"
      } ${isActive ? activeTone : idleTone}`}
    >
      <item.icon className={`shrink-0 text-[1.05rem] transition-colors duration-200 ${iconTone}`} />
      {item.name}
    </Link>
  );
}

// ─── Group item (has children) ────────────────────────────────────────────────

function NavGroup({
  item,
  pathname,
  isDark,
  onClose,
}: {
  item: NavItem;
  pathname: string;
  isDark: boolean;
  onClose: () => void;
}) {
  const isChildActive = item.children?.some((c) => pathname === c.href) ?? false;
  const [open, setOpen] = useState(isChildActive);

  const isParentActive = pathname === item.href || isChildActive;
  const isOpen = open || isChildActive;
  const activeTone = isDark
    ? "border-[#ffb78d]/30 bg-[linear-gradient(135deg,rgba(255,166,130,0.18),rgba(45,212,191,0.1)_58%,rgba(99,102,241,0.14))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_44px_-28px_rgba(13,148,136,0.48)]"
    : "border-[#ffd7c9] bg-[linear-gradient(135deg,#fff4ec,#fffaf6)] text-[#102033] shadow-[0_18px_36px_-30px_rgba(255,107,74,0.42)]";
  const idleTone = isDark
    ? "border-transparent text-slate-300 hover:-translate-y-[1px] hover:border-white/10 hover:bg-white/[0.055] hover:text-white hover:shadow-[0_18px_34px_-30px_rgba(0,0,0,0.85)]"
    : "border-transparent text-slate-700 hover:border-[#eadfce] hover:bg-white/85 hover:text-[#102033]";
  const iconTone = isParentActive
    ? isDark
      ? "text-[#ffe3d4]"
      : "text-[#d9481f]"
    : isDark
      ? "text-slate-500 group-hover:text-[#9ce8de]"
      : "text-[#8c6d54] group-hover:text-[#0f766e]";
  const chevronTone = isParentActive
    ? isDark
      ? "text-[#ffe3d4]"
      : "text-[#d9481f]"
    : isDark
      ? "text-slate-600 group-hover:text-[#9ce8de]"
      : "text-[#b08968] group-hover:text-[#0f766e]";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`group flex w-full items-center gap-3 rounded-[1.15rem] border px-4 py-3 text-[0.98rem] font-semibold transition-all duration-200 ${
          isParentActive ? activeTone : idleTone
        }`}
      >
        <item.icon className={`shrink-0 text-[1.05rem] transition-colors duration-200 ${iconTone}`} />
        <span className="flex-1 text-left">{item.name}</span>
        <FiChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${chevronTone}`}
        />
      </button>

      {isOpen && (
        <div className={`ml-4 mt-1 flex flex-col gap-1 border-l pl-3 ${isDark ? "border-white/10" : "border-[#f1d9cd]"}`}>
          {item.children!.map((child) => (
            <NavLink
              key={child.href}
              item={child}
              isActive={pathname === child.href}
              isDark={isDark}
              onClose={onClose}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function DashboardSidebar({ navItems, isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useDashTheme();
  const sidebarTone = isDark
    ? "relative overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(5,10,22,0.94),rgba(8,13,28,0.97)_22%,rgba(7,11,24,0.94)_100%)] text-white shadow-[18px_0_60px_-34px_rgba(0,0,0,0.95)]"
    : "border-[#e7dbc9] bg-[#fffdf9]/94 text-[#102033] shadow-[12px_0_48px_-34px_rgba(16,32,51,0.3)]";
  const dividerTone = isDark ? "border-white/10" : "border-[#eadfce]";
  const iconButtonTone = isDark
    ? "border-white/10 bg-white/[0.04] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-[#7ee8dc]/30 hover:bg-white/[0.08] hover:text-white"
    : "border-[#eadfce] bg-white/80 text-[#8c6d54] hover:border-[#ffd4c5] hover:bg-white hover:text-[#102033]";
  const logoutTone = isDark
    ? "border-[#6a2d26] bg-[linear-gradient(135deg,rgba(68,20,16,0.92),rgba(36,11,10,0.94))] text-[#ffc5b3] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-[#915045] hover:bg-[linear-gradient(135deg,rgba(86,26,20,0.96),rgba(48,14,12,0.96))]"
    : "border-[#ffd7c9] bg-[#fff3e9] text-[#d9481f] hover:border-[#ffc4ae] hover:bg-[#ffe9db]";

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/");
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 sm:w-[300px] flex-col border-r backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarTone} ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {isDark && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(255,166,130,0.18),transparent_58%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 top-28 h-48 w-48 rounded-full bg-[#2dd4bf]/10 blur-3xl"
          />
        </>
      )}

      <div className={`relative z-10 flex h-16 sm:h-20 items-center px-4 sm:px-6 border-b shrink-0 ${dividerTone}`}>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex min-w-0 items-center gap-3 decoration-transparent"
        >
          <span className={`flex h-11 w-11 items-center justify-center rounded-[1.25rem] text-white ${isDark ? "bg-[linear-gradient(135deg,#ff9b78,#ff6b4a_34%,#1b7f88_72%,#0f766e)] shadow-[0_20px_45px_-22px_rgba(255,107,74,0.78)]" : "bg-[#102033] shadow-[0_18px_38px_-20px_rgba(16,32,51,0.72)]"}`}>
            <FiLayers size={18} />
          </span>
          <div className="min-w-0">
            <div className={`font-heading text-[1.1rem] font-bold tracking-tight ${isDark ? "text-white" : "text-[#102033]"}`}>
              SAASIO
            </div>
            <div className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-[#9ce8de]" : "text-[#8c6d54]"}`}>
              Control deck
            </div>
          </div>
        </Link>
        <button
          onClick={onClose}
          className={`ml-auto flex h-10 w-10 items-center justify-center rounded-[1rem] border transition-all lg:hidden ${iconButtonTone}`}
          aria-label="Close menu"
        >
          <FiX size={18} />
        </button>
      </div>

      <nav className="custom-scrollbar relative z-10 flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
        {navItems.map((item) =>
          item.children && item.children.length > 0 ? (
            <NavGroup key={item.name} item={item} pathname={pathname} isDark={isDark} onClose={onClose} />
          ) : (
            <NavLink
              key={item.name}
              item={item}
              isActive={pathname === item.href}
              isDark={isDark}
              onClose={onClose}
            />
          )
        )}
      </nav>

      <div className={`relative z-10 px-3 sm:px-4 py-3 sm:py-4 border-t shrink-0 ${dividerTone}`}>
        <button
          onClick={handleLogout}
          className={`group flex w-full items-center gap-3 rounded-[1.15rem] border px-4 py-3 sm:py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${logoutTone}`}
        >
          <FiLogOut size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
