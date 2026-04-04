/**
 * nav.config.ts — Centralized Sidebar Navigation Configuration
 *
 * Each nav item declares:
 *  - name, href, icon  → standard nav properties
 *  - privileges         → array of { method, apiPath }
 *
 * A nav item is only shown in the sidebar if the current user has
 * AT LEAST ONE of the listed privileges.
 *
 * This is the ONLY place to add, remove, or reorder sidebar items.
 * The sidebar itself is "dumb" — it just renders what it receives.
 *
 * ─── How to add a new nav item ────────────────────────────────────────
 * 1. Create your private route under app/api/v1/private/<resource>/route.ts
 * 2. Run syncPrivileges (happens automatically on dev server start via initApp)
 * 3. Add an entry here referencing one or more of its apiPaths
 * ──────────────────────────────────────────────────────────────────────
 */

import {
    FiHome,
    FiUsers,
    FiShield,
    FiKey,
    FiSettings,
    FiCreditCard,
} from "react-icons/fi";

export interface NavPrivilege {
    method: string;
    apiPath: string;
}

export interface NavConfig {
    name: string;
    href: string;
    icon: React.ElementType;
    /**
     * Privileges required to see this item.
     * Item is shown if the user has AT LEAST ONE matching privilege.
     * Use an empty array [] to always show (e.g., a home/overview page).
     */
    privileges: NavPrivilege[];
}

export const NAV_CONFIG: NavConfig[] = [
    {
        name: "Overview",
        href: "/dashboard",
        icon: FiHome,
        // Always visible — no specific privilege required
        privileges: [],
    },
    {
        name: "Users",
        href: "/dashboard/users",
        icon: FiUsers,
        privileges: [
            { method: "GET",    apiPath: "/api/v1/private/users" },
            { method: "POST",   apiPath: "/api/v1/private/users" },
            { method: "PUT",    apiPath: "/api/v1/private/users" },
            { method: "PATCH",  apiPath: "/api/v1/private/users" },
            { method: "DELETE", apiPath: "/api/v1/private/users" },
        ],
    },
    {
        name: "Roles",
        href: "/dashboard/roles",
        icon: FiShield,
        privileges: [
            { method: "GET",    apiPath: "/api/v1/private/roles" },
            { method: "POST",   apiPath: "/api/v1/private/roles" },
            { method: "PUT",    apiPath: "/api/v1/private/roles" },
            { method: "DELETE", apiPath: "/api/v1/private/roles" },
        ],
    },
    {
        name: "Privileges",
        href: "/dashboard/privileges",
        icon: FiKey,
        privileges: [
            { method: "GET",    apiPath: "/api/v1/private/privileges" },
            { method: "POST",   apiPath: "/api/v1/private/privileges" },
            { method: "DELETE", apiPath: "/api/v1/private/privileges" },
        ],
    },
    {
        name: "Razorpay",
        href: "/dashboard/rozarpay",
        icon: FiCreditCard,
        privileges: [
            { method: "GET",    apiPath: "/api/v1/private/rozarpay" },
            { method: "POST",   apiPath: "/api/v1/private/rozarpay" },
            { method: "PUT",    apiPath: "/api/v1/private/rozarpay" },
            { method: "DELETE", apiPath: "/api/v1/private/rozarpay" },
        ],
    },
    {
        name: "Settings",
        href: "/dashboard/settings",
        icon: FiSettings,
        privileges: [
            { method: "GET",    apiPath: "/api/v1/private/settings" },
            { method: "PUT",    apiPath: "/api/v1/private/settings" },
        ],
    },
];
