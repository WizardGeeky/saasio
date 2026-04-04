"use client";

import React from "react";
import { FiMenu, FiBell, FiSearch } from "react-icons/fi";

interface DashboardTopbarProps {
  onMobileMenuToggle: () => void;
  userInitials?: string;
  userName?: string;
}

export function DashboardTopbar({ 
  onMobileMenuToggle, 
  userInitials = "A", 
  userName = "Admin User" 
}: DashboardTopbarProps) {
  return (
    <header className="flex h-20 items-center justify-between bg-white px-5 lg:px-8 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative border-b-2 border-slate-200">
      <button 
        className="flex lg:hidden bg-transparent border-none text-slate-800 p-2.5 rounded-lg hover:bg-slate-100 transition-colors mr-2" 
        onClick={onMobileMenuToggle}
      >
        <FiMenu size={24} />
      </button>

      {/* Spacer for mobile to center/align actions if search is hidden */}
      <div className="flex-1 lg:hidden"></div>

      <div className="hidden lg:flex items-center">
        
      </div>

      <div className="flex items-center gap-2 lg:gap-2">
        <button className="relative flex items-center justify-center p-2.5 rounded-full bg-transparent border border-transparent text-slate-500 hover:bg-slate-50 hover:text-emerald-500 hover:border-slate-200 transition-all">
          <FiBell size={20} />
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-500 text-[0.65rem] font-bold text-white">3</span>
        </button>
        <button className="flex items-center gap-3 bg-transparent border border-slate-200 p-1 lg:pl-1.5 lg:pr-4 rounded-full transition-all ml-2 lg:ml-4 hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-[0_4px_12px_rgba(16,185,129,0.1)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-emerald-700 font-bold text-[0.95rem] text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]">{userInitials}</div>
          <span className="hidden lg:block text-sm font-semibold text-slate-800">{userName}</span>
        </button>
      </div>
    </header>
  );
}
