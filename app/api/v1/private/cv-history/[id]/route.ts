/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth, checkPrivilege } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import ResumeDownload from "@/models/ResumeDownload";

export const DELETE = withAuth(async (
    req: NextRequest,
    ctx: { params: any },
    user: CustomJwtPayload,
): Promise<NextResponse> => {
    const deny = await checkPrivilege(user, "GET", "/api/v1/private/cv-history");
    if (deny) return deny;

    try {
        await connectDB();

        const { id } = await ctx.params;
        if (!id) {
            return NextResponse.json({ message: "CV ID is required." }, { status: 400 });
        }

        const result = await ResumeDownload.deleteOne({ _id: id, source: "my-cvs-ai" });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: "CV record not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "CV record deleted." }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
