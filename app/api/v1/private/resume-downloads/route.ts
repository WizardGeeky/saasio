/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import ResumeDownload from "@/models/ResumeDownload";

type ResumeDownloadPayload = {
    fileName?: unknown;
    templateId?: unknown;
    templateName?: unknown;
    resumeName?: unknown;
    resumeTitle?: unknown;
    source?: unknown;
};

function asTrimmedString(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value.trim() : fallback;
}

export const POST = withAuth(
    async (req: NextRequest, _ctx: { params: any }, user: CustomJwtPayload): Promise<NextResponse> => {
        try {
            await connectDB();

            const body = await req.json() as ResumeDownloadPayload;
            const fileName = asTrimmedString(body.fileName);
            const templateId = asTrimmedString(body.templateId);
            const templateName = asTrimmedString(body.templateName);

            if (!fileName || !templateId || !templateName) {
                return NextResponse.json(
                    { success: false, message: "fileName, templateId and templateName are required." },
                    { status: 400 }
                );
            }

            const record = await ResumeDownload.create({
                userId: user.sub,
                userEmail: user.email,
                userName: user.name || "",
                fileName,
                templateId,
                templateName,
                resumeName: asTrimmedString(body.resumeName),
                resumeTitle: asTrimmedString(body.resumeTitle),
                source: asTrimmedString(body.source, "resume-config"),
            });

            return NextResponse.json({
                success: true,
                data: {
                    _id: record._id,
                    createdAt: record.createdAt,
                },
            });
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
    }
);
