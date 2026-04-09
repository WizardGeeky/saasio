"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiLayers, FiLogOut, FiX, FiChevronDown } from "react-icons/fi";

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
  onClose,
  indent = false,
}: {
  item: NavItem;
  isActive: boolean;
  onClose: () => void;
  indent?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-full font-medium text-base sm:text-lg transition-all duration-200 ${
        indent ? "pl-10 text-sm sm:text-base" : ""
      } ${
        isActive
          ? "text-emerald-600 font-semibold bg-green-100"
          : "text-slate-700 hover:text-emerald-600"
      }`}
    >
      <item.icon
        className={`shrink-0 text-xl transition-colors duration-200 ${
          isActive ? "text-emerald-600" : "group-hover:text-emerald-600"
        }`}
      />
      {item.name}
    </Link>
  );
}

// ─── Group item (has children) ────────────────────────────────────────────────

function NavGroup({
  item,
  pathname,
  onClose,
}: {
  item: NavItem;
  pathname: string;
  onClose: () => void;
}) {
  const isChildActive = item.children?.some((c) => pathname === c.href) ?? false;
  const [open, setOpen] = useState(isChildActive);

  // Auto-expand when navigating to a child page
  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  const isParentActive = pathname === item.href || isChildActive;

  return (
    <div>
      {/* Parent row — toggles the group (does NOT navigate) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`group flex w-full items-center gap-2.5 px-4 py-2.5 rounded-full font-medium text-base sm:text-lg transition-all duration-200 ${
          isParentActive
            ? "text-emerald-600 font-semibold bg-green-100"
            : "text-slate-700 hover:text-emerald-600"
        }`}
      >
        <item.icon
          className={`shrink-0 text-xl transition-colors duration-200 ${
            isParentActive ? "text-emerald-600" : "group-hover:text-emerald-600"
          }`}
        />
        <span className="flex-1 text-left">{item.name}</span>
        <FiChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${
            isParentActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"
          }`}
        />
      </button>

      {/* Children */}
      {open && (
        <div className="mt-0.5 flex flex-col gap-0.5 pl-3 border-l-2 border-emerald-100 ml-6">
          {item.children!.map((child) => (
            <NavLink
              key={child.href}
              item={child}
              isActive={pathname === child.href}
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

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/");
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 sm:w-[300px] flex-col bg-white border-r-2 border-slate-200 transition-transform duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:static lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand */}
      <div className="flex h-14 sm:h-20 items-center px-4 sm:px-6 border-b-2 border-slate-200 shrink-0">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 text-2xl font-extrabold text-slate-900 tracking-tight decoration-transparent"
        >
          SAASIO
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="ml-auto flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Close menu"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-1 sm:gap-1.5 custom-scrollbar">
        {navItems.map((item) =>
          item.children && item.children.length > 0 ? (
            <NavGroup key={item.name} item={item} pathname={pathname} onClose={onClose} />
          ) : (
            <NavLink
              key={item.name}
              item={item}
              isActive={pathname === item.href}
              onClose={onClose}
            />
          )
        )}
      </nav>

      {/* Footer — Logout */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-t-2 border-gray-200 shrink-0">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl bg-red-50 px-4 py-3 sm:py-3.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 active:scale-[0.98]"
        >
          <FiLogOut size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
