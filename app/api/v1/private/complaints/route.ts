import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import Complaint from "@/models/Complaint";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

/**
 * GET /api/v1/private/complaints
 * Admin list of all complaints.
 * Requires: GET /api/v1/private/complaints privilege.
 */
export const GET = withAuth(
    async (req: NextRequest, _ctx: { params: any }, _user: CustomJwtPayload): Promise<NextResponse> => {
        const deny = await checkPrivilege(_user, "GET", "/api/v1/private/complaints");
        if (deny) return deny;

        try {
            await connectDB();

            const { searchParams } = new URL(req.url);
            const status = searchParams.get("status") || "ALL";
            const search = searchParams.get("search") || "";

            const filter: any = {};
            if (status !== "ALL") {
                filter.status = status;
            }
            if (search) {
                filter.$or = [
                    { userName: { $regex: search, $options: "i" } },
                    { userEmail: { $regex: search, $options: "i" } },
                    { reason: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                ];
            }

            const complaints = await Complaint.find(filter).sort({ createdAt: -1 });

            return NextResponse.json({
                success: true,
                data: complaints,
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);

/**
 * POST /api/v1/private/complaints
 * (Submit a new complaint)
 */
export const POST = withAuth(
    async (req: NextRequest, _ctx: { params: any }, _user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const { reason, description } = await req.json();

            if (!reason || !description) {
                return NextResponse.json(
                    { success: false, message: "Reason and description are required" },
                    { status: 400 }
                );
            }

            const newComplaint = await Complaint.create({
                userId: _user.sub,
                userName: _user.name,
                userEmail: _user.email,
                reason,
                description,
                status: "PENDING",
            });

            return NextResponse.json({
                success: true,
                data: newComplaint,
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
