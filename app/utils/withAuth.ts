import { NextRequest, NextResponse } from "next/server";
import { verifyToken, CustomJwtPayload } from "@/app/configs/jwt.config";
import { connectDB } from "@/app/configs/database.config";
import { Role } from "@/models/Role";

type AuthHandler = (
    req: NextRequest,
    context: { params: any },
    user: CustomJwtPayload
) => Promise<NextResponse>;

/**
 * withAuth — server-side HOF for private API routes.
 *
 * Usage:
 *   export const GET = withAuth(async (req, ctx, user) => { ... });
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it using jwt.config, and passes the decoded payload as `user`.
 */
export function withAuth(handler: AuthHandler) {
    return async (req: NextRequest, context: { params: any }): Promise<NextResponse> => {
        const authHeader = req.headers.get("authorization") ?? "";

        if (!authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { message: "Authorization token required" },
                { status: 401 }
            );
        }

        const token = authHeader.slice(7);
        const result = verifyToken(token);

        if (!result.valid || !result.payload) {
            return NextResponse.json(
                { message: result.expired ? "Session expired. Please login again." : "Invalid token." },
                { status: 401 }
            );
        }

        return handler(req, context, result.payload);
    };
}

/**
 * checkPrivilege — Authorization guard for role-based access control.
 *
 * Queries the user's Role from DB, populates its privileges, and verifies
 * the user has the specified method + apiPath privilege.
 *
 * Returns null if authorized, or a 403 NextResponse if denied.
 *
 * Usage inside a withAuth handler:
 *   const deny = await checkPrivilege(user, "GET", "/api/v1/private/subscriptions");
 *   if (deny) return deny;
 */
export async function checkPrivilege(
    user: CustomJwtPayload,
    method: string,
    apiPath: string
): Promise<NextResponse | null> {
    await connectDB();

    const role = await Role.findById(user.role).populate("privileges").lean();

    if (!role) {
        return NextResponse.json(
            { success: false, message: "Role not found. Access denied." },
            { status: 403 }
        );
    }

    const privileges = role.privileges as any[];
    const authorized = privileges.some(
        (p: any) => p.apiPath === apiPath && p.method.toUpperCase() === method.toUpperCase()
    );

    if (!authorized) {
        return NextResponse.json(
            { success: false, message: "Access denied. Insufficient privileges." },
            { status: 403 }
        );
    }

    return null; // null means authorized — proceed
}
