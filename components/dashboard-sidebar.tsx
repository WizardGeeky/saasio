"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiLayers } from "react-icons/fi";

export type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

interface DashboardSidebarProps {
  navItems: NavItem[];
  isOpen: boolean;
}

export function DashboardSidebar({ navItems, isOpen }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col bg-white border-r-2 border-slate-200 transition-transform duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:static lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-20 items-center px-6 border-b-2 ">
        <Link href="/dashboard" className="flex items-center gap-3 text-2xl font-extrabold text-slate-900 tracking-tight decoration-transparent">
          <div className="flex items-center justify-center p-2 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_8px_16px_rgba(16,185,129,0.2)]">
            <FiLayers size={22} />
          </div>
          SAASIO
        </Link>
      </div>
      
      {/* 
        This is where your dynamic plug-and-play components go!
        Since navItems are passed as props, any external config (like RBAC)
        can simply pass their authorized links to this component.
      */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`group relative flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-medium text-[0.95rem] transition-all duration-200 ${
                isActive 
                  ? "bg-emerald-50 text-emerald-700 font-semibold" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-[10%] bottom-[10%] w-1 bg-emerald-500 rounded-r-md" />
              )}
              <item.icon className={`text-xl transition-colors duration-200 ${
                isActive ? "text-emerald-700" : "group-hover:text-emerald-500"
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
