import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import ResumeDownload from "@/models/ResumeDownload";

export const GET = withAuth(
    async (
        _req: NextRequest,
        ctx: { params: Promise<{ id: string }> },
        user: CustomJwtPayload
    ): Promise<NextResponse> => {
        try {
            await connectDB();

            const { id } = await ctx.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return NextResponse.json(
                    { success: false, message: "Invalid resume history id." },
                    { status: 400 }
                );
            }

            const resume = await ResumeDownload.findOne({
                _id: id,
                userId: user.sub,
            }).lean();

            if (!resume) {
                return NextResponse.json(
                    { success: false, message: "Resume history not found." },
                    { status: 404 }
                );
            }

            if (!resume.resumePayload || typeof resume.resumePayload !== "object" || Array.isArray(resume.resumePayload)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Exact resume format is unavailable for this older download. Please open a newer saved resume.",
                    },
                    { status: 409 }
                );
            }

            return NextResponse.json({
                success: true,
                data: {
                    _id: resume._id?.toString?.() ?? String(resume._id),
                    fileName: resume.fileName,
                    templateId: resume.templateId,
                    templateName: resume.templateName,
                    resumeName: resume.resumeName || "",
                    resumeTitle: resume.resumeTitle || "",
                    createdAt: resume.createdAt,
                    resumePayload: resume.resumePayload,
                },
            });
        } catch (error: unknown) {
            return NextResponse.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unexpected error",
                },
                { status: 500 }
            );
        }
    }
);
