"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar, NavItem } from "@/components/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";

// This array acts as your initial plug-and-play configuration.
// In the future, this can be fetched from an API or filtered by RBAC.
const PLUG_AND_PLAY_NAV_ITEMS: NavItem[] = [];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`} 
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Plug-and-play Sidebar Component */}
      <DashboardSidebar 
        navItems={PLUG_AND_PLAY_NAV_ITEMS} 
        isOpen={isMobileMenuOpen} 
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Plug-and-play Topbar Component */}
        <DashboardTopbar 
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)} 
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-slate-50 custom-scrollbar">
          {children}
        </main>
      </div>
      
      {/* Global styles for the scrollbar inside JSX to keep it zero-css-file approach */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
}
