"use client";

import { usePrivilegeContext } from "@/app/contexts/PrivilegeContext";

export interface UsePrivilegeReturn {
    /** Returns true if the current user has the given privilege */
    can: (method: string, apiPath: string) => boolean;
    /** True while privileges are being fetched */
    isLoading: boolean;
}

/**
 * usePrivilege — convenience hook for privilege checks.
 *
 * @example
 * const { can } = usePrivilege();
 * if (can("DELETE", "/api/v1/private/users")) { ... }
 */
export function usePrivilege(): UsePrivilegeReturn {
    const { hasPrivilege, isLoading } = usePrivilegeContext();
    return { can: hasPrivilege, isLoading };
}
