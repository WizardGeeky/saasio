/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import ResumeDownload from "@/models/ResumeDownload";

const CV_SOURCE = "my-cvs-ai";

// ─── GET — current user's AI-generated CVs ────────────────────────────────────

export const GET = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    user: CustomJwtPayload,
): Promise<NextResponse> => {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
        const skip  = (page - 1) * limit;

        const filter = { userId: user.sub, source: CV_SOURCE };

        const [total, rawRecords] = await Promise.all([
            ResumeDownload.countDocuments(filter),
            ResumeDownload.find(filter, {
                _id: 1, resumeName: 1, resumeTitle: 1, fileName: 1,
                templateId: 1, templateName: 1, createdAt: 1, resumePayload: 1,
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        const pages = Math.max(1, Math.ceil(total / limit));

        const cvs = rawRecords.map((r: any) => ({
            _id:         String(r._id),
            resumeName:  r.resumeName  || "",
            resumeTitle: r.resumeTitle || "",
            fileName:    r.fileName    || "",
            templateId:  r.templateId  || "classic",
            templateName:r.templateName|| "Classic",
            hasPayload:  !!r.resumePayload,
            createdAt:   r.createdAt,
        }));

        return NextResponse.json({ success: true, cvs, pagination: { total, page, pages, limit } }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

// ─── POST — save an AI-generated CV ──────────────────────────────────────────

export const POST = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    user: CustomJwtPayload,
): Promise<NextResponse> => {
    try {
        await connectDB();

        const body = await req.json();
        const { resumeJson, targetRole } = body;

        if (!resumeJson || typeof resumeJson !== "object") {
            return NextResponse.json({ message: "resumeJson is required" }, { status: 400 });
        }

        const name   = resumeJson?.header?.name  || resumeJson?.name  || user.name || "CV";
        const title  = targetRole || resumeJson?.header?.title || resumeJson?.title || "";
        const safeRole = (targetRole || "cv").replace(/[^a-zA-Z0-9\s_-]/g, "").replace(/\s+/g, "_").slice(0, 60);
        const fileName = `${safeRole}_ai_${Date.now()}.pdf`;

        const record = await ResumeDownload.create({
            userId:      user.sub,
            userEmail:   user.email,
            userName:    user.name || "",
            templateId:  "classic",
            templateName:"Classic",
            fileName,
            resumeName:  name,
            resumeTitle: title,
            source:      CV_SOURCE,
            resumePayload: resumeJson,
        });

        return NextResponse.json({ success: true, cvId: String(record._id) }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});
