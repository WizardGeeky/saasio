"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { useAuthGuard } from "@/app/utils/useAuthGuard";
import { PrivilegeProvider, usePrivilegeContext } from "@/app/contexts/PrivilegeContext";
import { NAV_CONFIG, NavConfig } from "@/app/configs/nav.config";
import { NavItem } from "@/components/dashboard-sidebar";
import { getStoredToken, decodeToken } from "@/app/utils/token";

// ─── Inner layout (has access to PrivilegeContext) ────────────────────────────

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  useAuthGuard("requireAuth");

  const { hasPrivilege, isLoading } = usePrivilegeContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const [userName, setUserName] = useState("Admin");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    const payload = decodeToken(token);
    if (payload) {
      setUserName(payload.name ?? "Admin");
      setUserRole(payload.role ?? "");
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  /**
   * Filter nav items by privilege:
   * - Items with empty privileges[] are always shown (e.g., Overview)
   * - Items with privileges are shown if the user has AT LEAST ONE match
   */
  const filteredNavItems: NavItem[] = useMemo(() => {
    if (isLoading) return [];
    return NAV_CONFIG.filter((item: NavConfig) => {
      if (item.privileges.length === 0) return true;
      return item.privileges.some((p) => hasPrivilege(p.method, p.apiPath));
    });
  }, [hasPrivilege, isLoading]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100 font-sans">
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar — receives privilege-filtered nav items */}
      <DashboardSidebar
        navItems={filteredNavItems}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DashboardTopbar
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
          userName={userName}
          userRole={userRole}
        />

        <main className="flex-1 overflow-y-auto p-3 lg:px-8 lg:py-8  bg-gray-100 custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Scrollbar styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}

// ─── Outer layout (provides PrivilegeContext) ─────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrivilegeProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </PrivilegeProvider>
  );
}
