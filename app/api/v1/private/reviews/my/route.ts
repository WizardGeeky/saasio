/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import Review from "@/models/Review";

// GET /api/v1/private/reviews/my — user's own reviews
export const GET = withAuth(
    async (_req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const reviews = await Review.find({ userId: user.sub }).sort({ createdAt: -1 }).lean();

            return NextResponse.json({ success: true, data: reviews });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
