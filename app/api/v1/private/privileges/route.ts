import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { Role } from "@/models/Role";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

export interface PrivilegeDto {
    apiPath: string;
    method: string;
    name: string;
}

/**
 * GET /api/v1/private/privileges
 *
 * Returns the full list of privileges for the authenticated user's role.
 * The response is used by the client PrivilegeContext to gate UI elements.
 */
export const GET = withAuth(async (
    _req: NextRequest,
    _ctx: { params: any },
    user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        // Fetch the role and populate its privileges
        const role = await Role.findById(user.role).populate<{
            privileges: { apiPath: string; method: string; name: string }[];
        }>("privileges", "apiPath method name");

        if (!role) {
            return NextResponse.json({ message: "Role not found" }, { status: 404 });
        }

        const privileges: PrivilegeDto[] = role.privileges.map((p) => ({
            apiPath: p.apiPath,
            method: p.method,
            name: p.name,
        }));

        return NextResponse.json({ privileges }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
