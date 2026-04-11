import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { Project } from "@/models/Project";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { normalizePlanMaxUsage } from "@/app/utils/plan-usage";

const EMPTY_PLAN = (name: string) => ({ name, price: 0, currency: "INR", descriptions: [] });
const normalizePlans = (plans: any[]) =>
    [
        plans?.[0] ?? EMPTY_PLAN("Basic"),
        plans?.[1] ?? EMPTY_PLAN("Standard"),
        plans?.[2] ?? EMPTY_PLAN("Premium"),
    ].map((p: any) => ({
        name:         p.name?.trim() || "Plan",
        price:        Number(p.price) || 0,
        currency:     p.currency?.trim() || "INR",
        descriptions: Array.isArray(p.descriptions) ? p.descriptions.filter(Boolean) : [],
        maxUsage:     normalizePlanMaxUsage(p),
    }));

/**
 * GET /api/v1/private/projects
 * Returns all projects sorted by createdAt desc.
 */
export const GET = withAuth(async (
    _req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();
        const projects = await Project.find().sort({ createdAt: -1 }).lean();
        const normalizedProjects = projects.map((project: any) => ({
            ...project,
            plans: normalizePlans(project.plans ?? []),
        }));
        return NextResponse.json({ projects: normalizedProjects }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
});

/**
 * POST /api/v1/private/projects
 * Body: { name, status?, plans: [{ name, price, currency, descriptions[] }] × 3 }
 * _id is derived from name → UPPER_SNAKE_CASE
 */
export const POST = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();
        const { name, status, plans } = await req.json();

        if (!name?.trim()) {
            return NextResponse.json({ message: "Project name is required" }, { status: 400 });
        }

        const id = name.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
        if (!id) {
            return NextResponse.json({ message: "Invalid project name" }, { status: 400 });
        }

        const existing = await Project.findById(id);
        if (existing) {
            return NextResponse.json({ message: `Project '${id}' already exists` }, { status: 409 });
        }

        const normalizedPlans = normalizePlans(plans ?? []);

        const project = await Project.create({
            _id: id,
            name: name.trim(),
            status: status ?? "INACTIVE",
            plans: normalizedPlans,
        });

        return NextResponse.json({ message: "Project created successfully", project }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
});

/**
 * PUT /api/v1/private/projects
 * Body: { id, name?, status?, plans? }
 */
export const PUT = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();
        const { id, name, status, plans } = await req.json();

        if (!id) {
            return NextResponse.json({ message: "Project ID is required" }, { status: 400 });
        }

        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        const updates: Record<string, any> = {};
        if (name?.trim()) updates.name = name.trim();
        if (status)       updates.status = status;
        if (Array.isArray(plans) && plans.length === 3) {
            updates.plans = normalizePlans(plans);
        }

        await Project.updateOne({ _id: id }, { $set: updates });
        const updated = await Project.findById(id).lean();

        return NextResponse.json({ message: "Project updated successfully", project: updated }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
});

/**
 * DELETE /api/v1/private/projects
 * Query: ?id=PROJECT_ID
 */
export const DELETE = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();
        const id = new URL(req.url).searchParams.get("id");

        if (!id) {
            return NextResponse.json({ message: "Project ID is required" }, { status: 400 });
        }

        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        await Project.deleteOne({ _id: id });
        return NextResponse.json({ message: "Project deleted successfully" }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
});
