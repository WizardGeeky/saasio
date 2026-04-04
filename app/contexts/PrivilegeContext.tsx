"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from "react";
import { getStoredToken } from "@/app/utils/token";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrivilegeItem {
    apiPath: string;
    method: string;
    name: string;
}

interface PrivilegeContextValue {
    /** `true` while privileges are being fetched on mount */
    isLoading: boolean;
    /** Check if the user has a specific privilege */
    hasPrivilege: (method: string, apiPath: string) => boolean;
    /** Raw list of privilege items (useful for nav filtering) */
    privileges: PrivilegeItem[];
    /** Manually re-fetch privileges (e.g., after role change) */
    refetch: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PrivilegeContext = createContext<PrivilegeContextValue | null>(null);

/** Internal key format: "METHOD:/api/path" */
function toKey(method: string, apiPath: string): string {
    return `${method.toUpperCase()}:${apiPath}`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PrivilegeProvider({ children }: { children: ReactNode }) {
    const [privileges, setPrivileges] = useState<PrivilegeItem[]>([]);
    const [privilegeSet, setPrivilegeSet] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    const fetchPrivileges = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = getStoredToken();
            if (!token) {
                setPrivileges([]);
                setPrivilegeSet(new Set());
                return;
            }

            const res = await fetch("/api/v1/private/privileges", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                setPrivileges([]);
                setPrivilegeSet(new Set());
                return;
            }

            const data: { privileges: PrivilegeItem[] } = await res.json();

            setPrivileges(data.privileges);
            setPrivilegeSet(
                new Set(data.privileges.map((p) => toKey(p.method, p.apiPath)))
            );
        } catch {
            setPrivileges([]);
            setPrivilegeSet(new Set());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrivileges();
    }, [fetchPrivileges]);

    const hasPrivilege = useCallback(
        (method: string, apiPath: string): boolean => {
            return privilegeSet.has(toKey(method, apiPath));
        },
        [privilegeSet]
    );

    return (
        <PrivilegeContext.Provider
            value={{ isLoading, hasPrivilege, privileges, refetch: fetchPrivileges }}
        >
            {children}
        </PrivilegeContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePrivilegeContext(): PrivilegeContextValue {
    const ctx = useContext(PrivilegeContext);
    if (!ctx) throw new Error("usePrivilegeContext must be used inside <PrivilegeProvider>");
    return ctx;
}
