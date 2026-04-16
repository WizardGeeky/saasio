"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredToken, decodeToken, getStoredToken, isTokenValid } from "./token";

type GuardMode = "requireAuth" | "requireGuest";

type AuthGuardState = {
  isChecking: boolean;
  isAuthenticated: boolean;
};

/**
 * useAuthGuard — call this at the top of any page component.
 *
 * mode = "requireAuth"  → if token missing/invalid/expired, redirect to /
 * mode = "requireGuest" → if token valid and not expired, redirect to /dashboard
 */
export function useAuthGuard(mode: GuardMode): AuthGuardState {
  const router = useRouter();
  const [state, setState] = useState<AuthGuardState>({
    isChecking: mode === "requireAuth",
    isAuthenticated: false,
  });

  const validateAuth = useCallback(() => {
    const token = getStoredToken();
    const valid = token ? isTokenValid(token) : false;

    if (token && !valid) {
      clearStoredToken();
    }

    if (mode === "requireAuth" && !valid) {
      setState({ isChecking: false, isAuthenticated: false });
      router.replace("/login");
      return false;
    }

    if (mode === "requireGuest" && valid) {
      setState({ isChecking: false, isAuthenticated: true });
      router.replace("/dashboard");
      return true;
    }

    setState({ isChecking: false, isAuthenticated: valid });
    return valid;
  }, [mode, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let expiryTimeoutId: number | undefined;

    const clearExpiryTimeout = () => {
      if (expiryTimeoutId === undefined) return;

      window.clearTimeout(expiryTimeoutId);
      expiryTimeoutId = undefined;
    };

    const validateAndSchedule = () => {
      clearExpiryTimeout();

      const valid = validateAuth();
      if (mode !== "requireAuth" || !valid) return;

      const token = getStoredToken();
      const payload = token ? decodeToken(token) : null;
      if (!payload?.exp) return;

      const msUntilExpiry = payload.exp * 1000 - Date.now();
      expiryTimeoutId = window.setTimeout(validateAndSchedule, Math.max(msUntilExpiry, 0) + 250);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        validateAndSchedule();
      }
    };

    validateAndSchedule();

    window.addEventListener("focus", validateAndSchedule);
    window.addEventListener("storage", validateAndSchedule);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearExpiryTimeout();
      window.removeEventListener("focus", validateAndSchedule);
      window.removeEventListener("storage", validateAndSchedule);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mode, validateAuth]);

  return state;
}
