"use client";

import React, { ReactNode } from "react";
import { usePrivilege } from "@/app/utils/usePrivilege";

interface CanDoProps {
    /** HTTP method of the associated API call */
    method: string;
    /** API path of the associated API call e.g. "/api/v1/private/users" */
    apiPath: string;
    /** Content to show when privilege exists */
    children: ReactNode;
    /** Optional: render this instead of null when privilege is missing.
     *  Use to show a disabled/grayed-out version rather than hiding completely. */
    fallback?: ReactNode;
}

/**
 * CanDo — privilege-gated render wrapper.
 *
 * Renders `children` only if the current user has the matching privilege.
 * Renders `fallback` (or null) otherwise.
 *
 * @example
 * <CanDo method="DELETE" apiPath="/api/v1/private/users">
 *   <DeleteUserButton />
 * </CanDo>
 *
 * @example — with disabled fallback
 * <CanDo
 *   method="POST"
 *   apiPath="/api/v1/private/users"
 *   fallback={<button disabled>Create User</button>}
 * >
 *   <CreateUserButton />
 * </CanDo>
 */
export function CanDo({ method, apiPath, children, fallback = null }: CanDoProps) {
    const { can, isLoading } = usePrivilege();

    // While loading, render nothing (avoids flash of unauthorized content)
    if (isLoading) return null;

    return can(method, apiPath) ? <>{children}</> : <>{fallback}</>;
}
