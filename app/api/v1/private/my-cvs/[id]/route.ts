/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import ResumeDownload from "@/models/ResumeDownload";

export const GET = withAuth(async (
    req: NextRequest,
    ctx: { params: any },
    user: CustomJwtPayload,
): Promise<NextResponse> => {
    try {
        await connectDB();

        const { id } = await ctx.params;
        if (!id) {
            return NextResponse.json({ message: "CV ID is required." }, { status: 400 });
        }

        const record = await ResumeDownload.findOne(
            { _id: id, userId: user.sub, source: "my-cvs-ai" },
            { resumePayload: 1, resumeName: 1, resumeTitle: 1, templateId: 1, templateName: 1, createdAt: 1 }
        ).lean();

        if (!record) {
            return NextResponse.json({ message: "CV not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, cv: record }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

export const DELETE = withAuth(async (
    req: NextRequest,
    ctx: { params: any },
    user: CustomJwtPayload,
): Promise<NextResponse> => {
    try {
        await connectDB();

        const { id } = await ctx.params;
        if (!id) {
            return NextResponse.json({ message: "CV ID is required." }, { status: 400 });
        }

        const result = await ResumeDownload.deleteOne({ _id: id, userId: user.sub, source: "my-cvs-ai" });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: "CV not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "CV deleted." }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
