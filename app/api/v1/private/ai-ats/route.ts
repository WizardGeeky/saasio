import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { decrypt, encrypt } from "@/app/configs/crypto.config";
import { AiModel } from "@/models/AiModel";
import { AtsRecord } from "@/models/AtsRecord";
import Subscription from "@/models/Subscription";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { resolveSubscriptionQuota } from "@/app/utils/subscription-usage";

// ─── GET — fetch history for the current user ─────────────────────────────────

export const GET = withAuth(async (
    _req: NextRequest,
    _ctx: { params: any },
    user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        const records = await AtsRecord
            .find({ userEmail: encrypt(user.email) })
            .populate("modelId", "displayName provider modelName")
            .sort({ createdAt: -1 });

        return NextResponse.json({ records, email: user.email }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

// ─── POST — run analysis ──────────────────────────────────────────────────────

export const POST = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    user: CustomJwtPayload
): Promise<NextResponse> => {
    try {
        await connectDB();

        // ── Subscription gate: user must have an active subscription with remaining usage ──
        const activeSub = await Subscription.findOne({
            userEmail: user.email,
            status: "ACTIVE",
        }).sort({ createdAt: -1 });

        if (!activeSub) {
            return NextResponse.json(
                { message: "No active subscription. Please subscribe to use AI ATS." },
                { status: 403 }
            );
        }

        const quota = await resolveSubscriptionQuota(activeSub);
        const subUsageCount = quota.usageCount;
        const subMaxUsage = quota.maxUsage;

        if (quota.shouldPersistResolvedMaxUsage) {
            activeSub.maxUsage = subMaxUsage;
        }

        if (!quota.hasUsage) {
            if (subMaxUsage > 0) {
                activeSub.status = "EXPIRED";
                await activeSub.save();
            }
            return NextResponse.json(
                { message: "Usage limit reached. Please re-subscribe to continue using AI ATS." },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { modelId, jobRoleName, jobDescription, resumeBase64, fileName } = body;

        if (!modelId || !jobRoleName || !jobDescription || !resumeBase64 || !fileName) {
            return NextResponse.json({ message: "modelId, jobRoleName, jobDescription, resumeBase64 and fileName are required" }, { status: 400 });
        }

        // ── Fetch & decrypt AI model ──
        const aiModel = await AiModel.findById(modelId);
        if (!aiModel) {
            return NextResponse.json({ message: "AI model not found" }, { status: 404 });
        }

        let apiKey: string;
        try {
            apiKey = decrypt(aiModel.apiKey);
        } catch {
            return NextResponse.json({ message: "Failed to read model API key" }, { status: 500 });
        }

        // ── Call the AI provider ──
        let analysis: any;

        if (aiModel.provider === "google") {
            analysis = await callGemini(apiKey, aiModel.modelName, jobRoleName, jobDescription, resumeBase64);
        } else {
            return NextResponse.json(
                { message: `Provider "${aiModel.provider}" is not yet supported for ATS analysis` },
                { status: 400 }
            );
        }

        // ── Validate required fields in AI response ──
        const score = typeof analysis.score === "number" ? analysis.score : 0;
        const matchedKeywords: string[] = Array.isArray(analysis.matchedKeywords) ? analysis.matchedKeywords : [];
        const missingKeywords: string[] = Array.isArray(analysis.missingKeywords) ? analysis.missingKeywords : [];
        const sectionScores = {
            skills:     analysis.sectionScores?.skills     ?? 0,
            experience: analysis.sectionScores?.experience ?? 0,
            projects:   analysis.sectionScores?.projects   ?? 0,
            education:  analysis.sectionScores?.education  ?? 0,
        };
        const suggestions: string[] = Array.isArray(analysis.suggestions) ? analysis.suggestions : [];

        // ── Save to DB ──
        const record = await AtsRecord.create({
            userId:         new mongoose.Types.ObjectId(user.sub),
            userEmail:      encrypt(user.email),
            jobRoleName:    jobRoleName.trim(),
            jobDescription: jobDescription.trim(),
            resumeText:     `[PDF: ${fileName}]`,
            structuredData: analysis,
            analysis:       { score, matchedKeywords, missingKeywords, sectionScores, suggestions },
            modelId:        aiModel._id,
            fileName:       fileName,
        });

        const populated = await record.populate("modelId", "displayName provider modelName");

        // ── Increment subscription usage after successful analysis ──
        const newUsage = subUsageCount + 1;
        activeSub.usageCount = newUsage;
        await activeSub.save();
        if (subMaxUsage > 0 && newUsage >= subMaxUsage) {
            await Subscription.updateOne({ _id: activeSub._id }, { status: "EXPIRED" });
        }

        return NextResponse.json({ message: "Analysis complete", record: populated }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
});

// ─── Gemini helper ────────────────────────────────────────────────────────────

async function callGemini(
    apiKey: string,
    modelName: string,
    jobRoleName: string,
    jobDescription: string,
    resumeBase64: string
) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer.
Analyze the attached resume PDF against the job details below.

Job Role: ${jobRoleName}
Job Description:
${jobDescription}

Return ONLY valid JSON — no markdown fences, no extra text. Use this exact structure:
{
  "score": <integer 0-100, overall ATS match percentage>,
  "matchedKeywords": [<keywords/skills present in both resume and job description>],
  "missingKeywords": [<important keywords/skills from job description that are absent in the resume>],
  "sectionScores": {
    "skills": <integer 0-100>,
    "experience": <integer 0-100>,
    "projects": <integer 0-100>,
    "education": <integer 0-100>
  },
  "suggestions": [<3 to 5 specific, actionable improvement suggestions>]
}`;

    const body = {
        contents: [
            {
                parts: [
                    { inlineData: { mimeType: "application/pdf", data: resumeBase64 } },
                    { text: prompt },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
        },
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `Gemini API error (${res.status})`);
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error("Could not parse AI response as JSON");
    }
}
