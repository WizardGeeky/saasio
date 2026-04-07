import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import Complaint from "@/models/Complaint";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";

/**
 * GET /api/v1/private/complaints/my
 * (User list of their own complaints)
 */
export const GET = withAuth(
    async (req: NextRequest, _ctx: { params: any }, _user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const complaints = await Complaint.find({ userId: _user.sub }).sort({ createdAt: -1 });

            return NextResponse.json({
                success: true,
                data: complaints,
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
