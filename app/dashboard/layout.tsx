"use client";

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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

function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const { isChecking, isAuthenticated } = useAuthGuard("requireAuth");

  if (isChecking || !isAuthenticated) {
    return null;
  }

  return children;
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { isDark } = useDashTheme();
  const { hasPrivilege, isLoading } = usePrivilegeContext();
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const resetHorizontalOffset = () => {
      window.scrollTo({ left: 0, top: window.scrollY });

      const scrollTargets = [
        document.scrollingElement as HTMLElement | null,
        document.documentElement,
        document.body,
        shellRef.current,
        contentRef.current,
        mainRef.current,
      ];

      scrollTargets.forEach((target) => {
        if (!target) return;

        const currentTop = target.scrollTop;
        target.scrollLeft = 0;
        target.scrollTo?.({ left: 0, top: currentTop });
      });
    };

    let nestedFrameId = 0;

    resetHorizontalOffset();

    const frameId = window.requestAnimationFrame(() => {
      resetHorizontalOffset();
      nestedFrameId = window.requestAnimationFrame(resetHorizontalOffset);
    });

    const timeoutId = window.setTimeout(resetHorizontalOffset, 180);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (nestedFrameId) {
        window.cancelAnimationFrame(nestedFrameId);
      }
      window.clearTimeout(timeoutId);
    };
  }, [isDark, pathname]);

  return (
    <div
      ref={shellRef}
      className={`db-theme relative block h-dvh min-h-dvh w-full max-w-full overflow-hidden font-sans transition-colors duration-500 lg:isolate lg:flex ${isDark ? "db-dark dark" : ""}`}
    >
      <div className="db-theme-shell pointer-events-none absolute inset-0" />

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className={`fixed inset-0 z-40 bg-[#102033]/28 transition-opacity duration-300 lg:hidden ${isDark ? "bg-[#020617]/60" : "bg-[#102033]/28"}`}
          onClick={() => setMobileMenuState((currentState) => ({ ...currentState, open: false }))}
        />
      )}

      {/* Sidebar — receives privilege-filtered nav items */}
      <DashboardSidebar
        navItems={filteredNavItems}
        isOpen={isMobileMenuOpen}
        onClose={() => setMobileMenuState((currentState) => ({ ...currentState, open: false }))}
      />

      {/* Main Content */}
      <div
        ref={contentRef}
        className="relative z-10 flex h-full min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden lg:flex-1"
      >
        <DashboardTopbar
          onMobileMenuToggle={() => setMobileMenuState({ open: true, path: pathname })}
          userName={dashboardIdentity.name}
          userRole={dashboardIdentity.role}
        />

        <main
          ref={mainRef}
          className="db-theme-main custom-scrollbar relative flex-1 min-h-0 max-w-full overflow-x-hidden overflow-y-auto bg-transparent p-3 lg:px-8 lg:py-8"
        >
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
      <DashboardAuthGate>
        <PrivilegeProvider>
          <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </PrivilegeProvider>
      </DashboardAuthGate>
    </DashThemeProvider>
  );
}
