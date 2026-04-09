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
    FiBarChart2,
    FiUsers,
    FiShield,
    FiKey,
    FiSettings,
    FiCreditCard,
    FiCpu,
    FiBell,
    FiUser,
    FiFolder,
    FiFileText,
    FiList,
    FiShoppingCart,
    FiMessageSquare,
    FiZap,
    FiClock,
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
    /** Optional sub-navigation items rendered as an indented group */
    children?: NavConfig[];
}

export const NAV_CONFIG: NavConfig[] = [
    {
        name: "Analytics",
        href: "/dashboard",
        icon: FiBarChart2,
        privileges: [],
    },
    {
        name: "Projects",
        href: "/dashboard/projects",
        icon: FiFolder,
        privileges: [
            { method: "GET",    apiPath: "/api/v1/private/projects" },
            { method: "POST",   apiPath: "/api/v1/private/projects" },
            { method: "PUT",    apiPath: "/api/v1/private/projects" },
            { method: "DELETE", apiPath: "/api/v1/private/projects" },
        ],
    },
    {
        name: "Resumes",
        href: "/dashboard/resume-templates",
        icon: FiFileText,
        privileges: [],
    },
    {
        name: "AI ATS",
        href: "/dashboard/ai-ats",
        icon: FiZap,
        privileges: [
            { method: "GET",  apiPath: "/api/v1/private/ai-ats" },
            { method: "POST", apiPath: "/api/v1/private/ai-ats" },
        ],
    },
    {
        name: "ATS History",
        href: "/dashboard/ats-history",
        icon: FiClock,
        privileges: [
            { method: "GET", apiPath: "/api/v1/private/ai-ats" },
        ],
    },
    {
        name: "My Transactions",
        href: "/dashboard/my-transactions",
        icon: FiCreditCard,
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
            { method: "PUT",    apiPath: "/api/v1/private/privileges" },
            { method: "DELETE", apiPath: "/api/v1/private/privileges" },
        ],
    },
    {
        name: "AI Models",
        href: "/dashboard/ai-models",
        icon: FiCpu,
        privileges: [
            { method: "GET",    apiPath: "/api/v1/private/ai-models" },
            { method: "POST",   apiPath: "/api/v1/private/ai-models" },
            { method: "PUT",    apiPath: "/api/v1/private/ai-models" },
            { method: "DELETE", apiPath: "/api/v1/private/ai-models" },
        ],
    },
    {
        name: "Notifications",
        href: "/dashboard/notifications",
        icon: FiBell,
        privileges: [
            { method: "POST",   apiPath: "/api/v1/private/notifications" },
            { method: "GET",    apiPath: "/api/v1/private/notifications" },
        ],
    },
    {
        name: "Razorpay",
        href: "/dashboard/rozarpay",
        icon: FiShoppingCart,
        privileges: [
            { method: "GET",    apiPath: "/api/v1/private/rozarpay" },
            { method: "POST",   apiPath: "/api/v1/private/rozarpay" },
            { method: "PUT",    apiPath: "/api/v1/private/rozarpay" },
            { method: "DELETE", apiPath: "/api/v1/private/rozarpay" },
        ],
    },
    {
        name: "Create Order",
        href: "/dashboard/rozarpay/orders",
        icon: FiShoppingCart,
        privileges: [
            { method: "GET",  apiPath: "/api/v1/private/rozarpay" },
            { method: "POST", apiPath: "/api/v1/private/rozarpay" },
        ],
    },
    {
        name: "Transactions",
        href: "/dashboard/rozarpay/transactions",
        icon: FiList,
        privileges: [
            { method: "GET", apiPath: "/api/v1/private/rozarpay" },
        ],
    },
    {
        name: "Profile",
        href: "/dashboard/profile",
        icon: FiUser,
        privileges: [],
    },
    {
        name: "My Complaints",
        href: "/dashboard/complaints/my",
        icon: FiMessageSquare,
        privileges: [
            { method: "GET", apiPath: "/api/v1/private/complaints/my" },
            { method: "POST", apiPath: "/api/v1/private/complaints" },
        ],
    },
    {
        name: "Complaints",
        href: "/dashboard/complaints",
        icon: FiMessageSquare,
        privileges: [
            { method: "GET", apiPath: "/api/v1/private/complaints" },
            { method: "PUT", apiPath: "/api/v1/private/complaints/[id]" },
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
