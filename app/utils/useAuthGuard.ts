"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken, isTokenValid } from "./token";

type GuardMode = "requireAuth" | "requireGuest";

/**
 * useAuthGuard — call this at the top of any page component.
 *
 * mode = "requireAuth"  → if token missing/invalid/expired, redirect to /
 * mode = "requireGuest" → if token valid and not expired, redirect to /dashboard
 */
export function useAuthGuard(mode: GuardMode): void {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    const valid = token ? isTokenValid(token) : false;

    if (mode === "requireAuth" && !valid) {
      router.replace("/");
    }

    if (mode === "requireGuest" && valid) {
      router.replace("/dashboard");
    }
  }, [mode, router]);
}
