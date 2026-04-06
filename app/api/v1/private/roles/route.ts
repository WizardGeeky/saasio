import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { Role } from "@/models/Role";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

/**
 * GET /api/v1/private/roles
 * Returns all roles with populated privilege details.
 */
export const GET = withAuth(async (
    _req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const rawRoles = await Role.find()
            .populate<{
                privileges: {
                    _id: string;
                    name: string;
                    apiPath: string;
                    method: string;
                }[];
            }>("privileges", "_id name apiPath method")
            .sort({ createdAt: 1 });

        // Filter out null entries that occur when a referenced privilege no longer exists
        const roles = rawRoles.map((r) => {
            const obj = r.toObject();
            obj.privileges = (obj.privileges ?? []).filter(Boolean);
            return obj;
        });

        return NextResponse.json({ roles }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * POST /api/v1/private/roles
 * Creates a new role with the specified privilege IDs.
 * Body: { name: string, privileges: string[] }
 */
export const POST = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const body = await req.json();
        const { name, privileges } = body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return NextResponse.json({ message: "Role name is required" }, { status: 400 });
        }

        // Normalize: uppercase, spaces → underscores
        const roleId = name.trim().toUpperCase().replace(/\s+/g, "_");

        if (!/^[A-Z][A-Z0-9_]*$/.test(roleId)) {
            return NextResponse.json(
                { message: "Role name must start with a letter and contain only letters, numbers, or underscores" },
                { status: 400 }
            );
        }

        const existing = await Role.findById(roleId);
        if (existing) {
            return NextResponse.json({ message: `Role '${roleId}' already exists` }, { status: 409 });
        }

        const privilegeIds: string[] = Array.isArray(privileges) ? privileges : [];

        const role = await Role.create({ _id: roleId, privileges: privilegeIds });

        const populated = await Role.findById(role._id).populate<{
            privileges: { _id: string; name: string; apiPath: string; method: string }[];
        }>("privileges", "_id name apiPath method");

        const populatedObj = populated?.toObject();
        if (populatedObj) populatedObj.privileges = (populatedObj.privileges ?? []).filter(Boolean);

        return NextResponse.json(
            { message: "Role created successfully", role: populatedObj },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * PUT /api/v1/private/roles
 * Updates a role's privileges.
 * Body: { id: string, privileges: string[] }
 */
export const PUT = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const body = await req.json();
        const { id, privileges } = body;

        if (!id) {
            return NextResponse.json({ message: "Role ID is required" }, { status: 400 });
        }

        const role = await Role.findById(id);
        if (!role) {
            return NextResponse.json({ message: "Role not found" }, { status: 404 });
        }

        const privilegeIds: string[] = Array.isArray(privileges) ? privileges : [];

        await Role.updateOne({ _id: id }, { $set: { privileges: privilegeIds } });

        const updated = await Role.findById(id).populate<{
            privileges: { _id: string; name: string; apiPath: string; method: string }[];
        }>("privileges", "_id name apiPath method");

        const updatedObj = updated?.toObject();
        if (updatedObj) updatedObj.privileges = (updatedObj.privileges ?? []).filter(Boolean);

        return NextResponse.json(
            { message: "Role updated successfully", role: updatedObj },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * DELETE /api/v1/private/roles
 * Deletes a role by ID. SYSTEM_ADMIN is protected from deletion.
 * Query: ?id=ROLE_ID
 */
export const DELETE = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ message: "Role ID is required" }, { status: 400 });
        }

        if (id === "SYSTEM_ADMIN") {
            return NextResponse.json(
                { message: "SYSTEM_ADMIN role is protected and cannot be deleted" },
                { status: 403 }
            );
        }

        const role = await Role.findById(id);
        if (!role) {
            return NextResponse.json({ message: "Role not found" }, { status: 404 });
        }

        await Role.deleteOne({ _id: id });

        return NextResponse.json({ message: "Role deleted successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
