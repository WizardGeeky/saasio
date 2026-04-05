import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { Role } from "@/models/Role";
import { Privilege } from "@/models/Privilege";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

export interface PrivilegeDto {
    apiPath: string;
    method: string;
    name: string;
}

const VALID_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/**
 * GET /api/v1/private/privileges
 *
 * ?all=true  — every privilege in the system (role management UI)
 * default    — privileges for the authenticated user's role
 */
export const GET = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        if (searchParams.get("all") === "true") {
            const privileges = await Privilege.find()
                .sort({ apiPath: 1, method: 1 })
                .select("_id name apiPath method createdAt");
            return NextResponse.json({ privileges }, { status: 200 });
        }

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

/**
 * POST /api/v1/private/privileges
 * Body: { name, apiPath, method }
 * _id is auto-computed as "METHOD:apiPath"
 */
export const POST = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const { name, apiPath, method } = await req.json();

        if (!name?.trim() || !apiPath?.trim() || !method) {
            return NextResponse.json({ message: "name, apiPath and method are required" }, { status: 400 });
        }

        const normalizedMethod = method.toUpperCase();
        if (!VALID_METHODS.includes(normalizedMethod)) {
            return NextResponse.json({ message: `method must be one of: ${VALID_METHODS.join(", ")}` }, { status: 400 });
        }

        const normalizedPath = apiPath.trim().toLowerCase();
        const id = `${normalizedMethod}:${normalizedPath}`;

        const existing = await Privilege.findById(id);
        if (existing) {
            return NextResponse.json({ message: `Privilege '${id}' already exists` }, { status: 409 });
        }

        const privilege = await Privilege.create({
            _id: id,
            name: name.trim(),
            apiPath: normalizedPath,
            method: normalizedMethod,
        });

        return NextResponse.json({ message: "Privilege created successfully", privilege }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * PUT /api/v1/private/privileges
 * Body: { id, name, apiPath?, method? }
 * If apiPath or method changes, old doc is deleted and a new one is created.
 */
export const PUT = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const { id, name, apiPath, method } = await req.json();

        if (!id) {
            return NextResponse.json({ message: "id is required" }, { status: 400 });
        }

        const existing = await Privilege.findById(id);
        if (!existing) {
            return NextResponse.json({ message: "Privilege not found" }, { status: 404 });
        }

        const newMethod = method ? method.toUpperCase() : existing.method;
        const newPath = apiPath ? apiPath.trim().toLowerCase() : existing.apiPath;
        const newName = name ? name.trim() : existing.name;

        if (method && !VALID_METHODS.includes(newMethod)) {
            return NextResponse.json({ message: `method must be one of: ${VALID_METHODS.join(", ")}` }, { status: 400 });
        }

        const newId = `${newMethod}:${newPath}`;

        // If id changes, delete old and create new (update all role references too)
        if (newId !== id) {
            const duplicate = await Privilege.findById(newId);
            if (duplicate) {
                return NextResponse.json({ message: `Privilege '${newId}' already exists` }, { status: 409 });
            }

            await Privilege.create({ _id: newId, name: newName, apiPath: newPath, method: newMethod });
            await Privilege.deleteOne({ _id: id });

            // Update all roles that referenced the old privilege id
            await Role.updateMany({ privileges: id }, { $addToSet: { privileges: newId }, $pull: { privileges: id } });

            const updated = await Privilege.findById(newId);
            return NextResponse.json({ message: "Privilege updated successfully", privilege: updated }, { status: 200 });
        }

        // Same id — just update name
        await Privilege.updateOne({ _id: id }, { $set: { name: newName } });
        const updated = await Privilege.findById(id);

        return NextResponse.json({ message: "Privilege updated successfully", privilege: updated }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

/**
 * DELETE /api/v1/private/privileges
 * Query: ?id=PRIVILEGE_ID
 * Also removes the privilege from all roles that reference it.
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
            return NextResponse.json({ message: "id is required" }, { status: 400 });
        }

        const privilege = await Privilege.findById(id);
        if (!privilege) {
            return NextResponse.json({ message: "Privilege not found" }, { status: 404 });
        }

        await Privilege.deleteOne({ _id: id });

        // Remove from all roles
        await Role.updateMany({ privileges: id }, { $pull: { privileges: id } });

        return NextResponse.json({ message: "Privilege deleted successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
