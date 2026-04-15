"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { useAuthGuard } from "@/app/utils/useAuthGuard";
import { PrivilegeProvider, usePrivilegeContext } from "@/app/contexts/PrivilegeContext";
import { DashThemeProvider, useDashTheme } from "@/app/contexts/DashThemeContext";
import { NAV_CONFIG, NavConfig } from "@/app/configs/nav.config";
import { NavItem } from "@/components/dashboard-sidebar";
import { getStoredToken, decodeToken } from "@/app/utils/token";

type DashboardIdentity = {
  name: string;
  role: string;
};

const DEFAULT_DASHBOARD_IDENTITY: DashboardIdentity = { name: "Admin", role: "" };

let cachedDashboardIdentityToken: string | null | undefined;
let cachedDashboardIdentitySnapshot = DEFAULT_DASHBOARD_IDENTITY;

function getDashboardIdentitySnapshot(): DashboardIdentity {
  const token = getStoredToken();
  if (token === cachedDashboardIdentityToken) {
    return cachedDashboardIdentitySnapshot;
  }

  cachedDashboardIdentityToken = token;

  if (!token) {
    cachedDashboardIdentitySnapshot = DEFAULT_DASHBOARD_IDENTITY;
    return cachedDashboardIdentitySnapshot;
  }

  const payload = decodeToken(token);

  cachedDashboardIdentitySnapshot = {
    name: payload?.name ?? "Admin",
    role: payload?.role ?? "",
  };

  return cachedDashboardIdentitySnapshot;
}

function subscribeToDashboardIdentity(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

// ─── Inner layout (has access to PrivilegeContext) ────────────────────────────

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  useAuthGuard("requireAuth");

  const { isDark } = useDashTheme();
  const { hasPrivilege, isLoading } = usePrivilegeContext();
  const pathname = usePathname();
  const [mobileMenuState, setMobileMenuState] = useState({ open: false, path: "" });
  const isMobileMenuOpen = mobileMenuState.open && mobileMenuState.path === pathname;
  const dashboardIdentity = useSyncExternalStore(
    subscribeToDashboardIdentity,
    getDashboardIdentitySnapshot,
    () => DEFAULT_DASHBOARD_IDENTITY,
  );

  /**
   * Filter nav items by privilege:
   * - Items with empty privileges[] are always shown (e.g., Overview)
   * - Items with privileges are shown if the user has AT LEAST ONE match
   */
  const filteredNavItems: NavItem[] = useMemo(() => {
    if (isLoading) return [];

    const filterItem = (item: NavConfig): NavItem | null => {
      const visible =
        item.privileges.length === 0 ||
        item.privileges.some((p) => hasPrivilege(p.method, p.apiPath));
      if (!visible) return null;

      const filteredChildren = item.children
        ?.map(filterItem)
        .filter((c): c is NavItem => c !== null);

      return {
        name: item.name,
        href: item.href,
        icon: item.icon,
        ...(filteredChildren && filteredChildren.length > 0 ? { children: filteredChildren } : {}),
      };
    };

    return NAV_CONFIG.map(filterItem).filter((i): i is NavItem => i !== null);
  }, [hasPrivilege, isLoading]);

  return (
    <div className={`db-theme relative isolate flex h-screen w-full overflow-hidden font-sans transition-colors duration-500 ${isDark ? "db-dark" : ""}`}>
      <div className="db-theme-shell pointer-events-none absolute inset-0" />

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        } ${isDark ? "bg-[#020617]/60" : "bg-[#102033]/28"}`}
        onClick={() => setMobileMenuState((currentState) => ({ ...currentState, open: false }))}
      />

      {/* Sidebar — receives privilege-filtered nav items */}
      <DashboardSidebar
        navItems={filteredNavItems}
        isOpen={isMobileMenuOpen}
        onClose={() => setMobileMenuState((currentState) => ({ ...currentState, open: false }))}
      />

      {/* Main Content */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardTopbar
          onMobileMenuToggle={() => setMobileMenuState({ open: true, path: pathname })}
          userName={dashboardIdentity.name}
          userRole={dashboardIdentity.role}
        />

        <main className="db-theme-main custom-scrollbar relative flex-1 overflow-y-auto bg-transparent p-3 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {/* Scrollbar styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? "#2d3050" : "#c9b39c"}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? "#404570" : "#b18f72"}; }
      `}} />
    </div>
  );
}

// ─── Outer layout (provides PrivilegeContext) ─────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashThemeProvider>
      <PrivilegeProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </PrivilegeProvider>
    </DashThemeProvider>
  );
}
