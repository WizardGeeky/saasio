import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import Complaint from "@/models/Complaint";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

/**
 * PUT /api/v1/private/complaints/[id]
 * Update complaint status/notes — Admin only.
 * Requires: PUT /api/v1/private/complaints/[id] privilege.
 */
export const PUT = withAuth(
    async (req: NextRequest, ctx: { params: Promise<{ id: string }> }, _user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(_user, "PUT", "/api/v1/private/complaints/[id]");
        if (deny) return deny;

        try {
            await connectDB();
            const { id } = await ctx.params;
            const { status, adminNotes } = await req.json();

            if (!status) {
                return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 });
            }

            const updatedComplaint = await Complaint.findByIdAndUpdate(
                id,
                { status, adminNotes },
                { new: true }
            );

            if (!updatedComplaint) {
                return NextResponse.json({ success: false, message: "Complaint not found" }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                data: updatedComplaint,
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);

/**
 * DELETE /api/v1/private/complaints/[id]
 * Admin only — requires GET /api/v1/private/complaints privilege.
 */
export const DELETE = withAuth(
    async (req: NextRequest, ctx: { params: Promise<{ id: string }> }, _user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(_user, "GET", "/api/v1/private/complaints");
        if (deny) return deny;

        try {
            await connectDB();
            const { id } = await ctx.params;

            const deleted = await Complaint.findByIdAndDelete(id);

            if (!deleted) {
                return NextResponse.json({ success: false, message: "Complaint not found" }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                message: "Complaint deleted successfully",
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
