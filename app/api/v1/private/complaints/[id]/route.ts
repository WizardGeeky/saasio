import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import Complaint from "@/models/Complaint";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

/**
 * PUT /api/v1/private/complaints/[id]
 * (Update complaint status/notes - Admin only)
 */
export const PUT = withAuth(
    async (req: NextRequest, ctx: { params: { id: string } }, _user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();
            const { id } = ctx.params;
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
 */
export const DELETE = withAuth(
    async (req: NextRequest, ctx: { params: { id: string } }, _user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();
            const { id } = ctx.params;

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
