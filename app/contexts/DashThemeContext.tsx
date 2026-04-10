"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface DashThemeCtx {
  isDark: boolean;
  toggle: () => void;
}

const DashThemeContext = createContext<DashThemeCtx>({ isDark: false, toggle: () => {} });

export function DashThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const toggle = useCallback(() => setIsDark((d) => !d), []);
  return (
    <DashThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </DashThemeContext.Provider>
  );
}

export const useDashTheme = () => useContext(DashThemeContext);
