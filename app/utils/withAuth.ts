import { NextRequest, NextResponse } from "next/server";
import { verifyToken, CustomJwtPayload } from "@/app/configs/jwt.config";

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
