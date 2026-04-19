/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { decrypt } from "@/app/configs/crypto.config";
import ResumeDownload from "@/models/ResumeDownload";
import Subscription from "@/models/Subscription";

type ResumeDownloadPayload = {
    fileName?: unknown;
    templateId?: unknown;
    templateName?: unknown;
    resumeName?: unknown;
    resumeTitle?: unknown;
    source?: unknown;
    resumePayload?: unknown;
    subscriptionId?: unknown;
    subscriptionUsageCount?: unknown;
    subscriptionMaxUsage?: unknown;
    subscriptionRemaining?: unknown;
};

function asTrimmedString(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value.trim() : fallback;
}

function asNullableNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function asPlainObject(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
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

            const subscriptionId = asTrimmedString(body.subscriptionId);
            const resumePayload = asPlainObject(body.resumePayload);
            const subscriptionUsageCount = asNullableNumber(body.subscriptionUsageCount);
            const subscriptionMaxUsage = asNullableNumber(body.subscriptionMaxUsage);
            const subscriptionRemaining = asNullableNumber(body.subscriptionRemaining);

            const plainEmail = decrypt(user.email);

            let subscriptionSnapshot: any = null;
            if (subscriptionId && mongoose.Types.ObjectId.isValid(subscriptionId)) {
                subscriptionSnapshot = await Subscription.findOne({
                    _id: subscriptionId,
                    userEmail: plainEmail,
                }).lean();
            }

            const record = await ResumeDownload.create({
                userId: user.sub,
                userEmail: plainEmail,
                userName: user.name || "",
                fileName,
                templateId,
                templateName,
                resumeName: asTrimmedString(body.resumeName),
                resumeTitle: asTrimmedString(body.resumeTitle),
                source: asTrimmedString(body.source, "resume-config"),
                ...(resumePayload ? { resumePayload } : {}),
                ...(subscriptionSnapshot
                    ? {
                        subscriptionId: String(subscriptionSnapshot._id),
                        subscriptionProjectId: subscriptionSnapshot.projectId,
                        subscriptionProjectName: subscriptionSnapshot.projectName,
                        subscriptionPlanName: subscriptionSnapshot.planName,
                        subscriptionPlanPrice: subscriptionSnapshot.planPrice,
                        subscriptionCurrency: subscriptionSnapshot.currency,
                        subscriptionStatus: subscriptionSnapshot.status,
                        subscriptionUsageCount,
                        subscriptionMaxUsage,
                        subscriptionRemaining,
                    }
                    : {}),
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
