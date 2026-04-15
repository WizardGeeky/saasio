"use client";

import React, { createContext, useContext, useCallback, useEffect, useSyncExternalStore } from "react";

interface DashThemeCtx {
  isDark: boolean;
  toggle: () => void;
}

const DashThemeContext = createContext<DashThemeCtx>({ isDark: false, toggle: () => {} });
const DASH_THEME_STORAGE_KEY = "saasio-dashboard-theme";
const DASH_THEME_EVENT_NAME = "saasio-dashboard-theme-change";

function resolveDashboardThemeSnapshot() {
  if (typeof window === "undefined") return false;

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  try {
    const storedTheme = window.localStorage.getItem(DASH_THEME_STORAGE_KEY);
    return storedTheme === "dark" || (storedTheme !== "light" && mediaQuery.matches);
  } catch {
    return mediaQuery.matches;
  }
}

function applyThemeToDocument(isDark: boolean) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

function subscribeToDashboardTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleChange);
  window.addEventListener(DASH_THEME_EVENT_NAME, handleChange);
  mediaQuery.addEventListener("change", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(DASH_THEME_EVENT_NAME, handleChange);
    mediaQuery.removeEventListener("change", handleChange);
  };
}

export function DashThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useSyncExternalStore(
    subscribeToDashboardTheme,
    resolveDashboardThemeSnapshot,
    () => false,
  );

  useEffect(() => {
    applyThemeToDocument(isDark);
  }, [isDark]);

  const toggle = useCallback(() => {
    const nextTheme = !resolveDashboardThemeSnapshot();

    try {
      window.localStorage.setItem(DASH_THEME_STORAGE_KEY, nextTheme ? "dark" : "light");
    } catch {
      // Ignore storage errors and still update the DOM snapshot for this tab.
    }

    applyThemeToDocument(nextTheme);
    window.dispatchEvent(new Event(DASH_THEME_EVENT_NAME));
  }, []);

  return (
    <DashThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </DashThemeContext.Provider>
  );
}

export const useDashTheme = () => useContext(DashThemeContext);
