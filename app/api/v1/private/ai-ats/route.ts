import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/configs/database.config";
import { withAuth } from "@/app/utils/withAuth";
import { decrypt, encrypt } from "@/app/configs/crypto.config";
import { AiModel } from "@/models/AiModel";
import { AtsRecord } from "@/models/AtsRecord";
import Subscription from "@/models/Subscription";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { extractPdfText } from "@/app/utils/pdf-text-extraction";
import { resolveSubscriptionQuota } from "@/app/utils/subscription-usage";

export const runtime = "nodejs";

type LooseRecord = Record<string, unknown>;

type SectionScores = {
    skills: number;
    experience: number;
    projects: number;
    education: number;
};

type ResumeExperience = {
    company: string;
    role: string;
    duration: string;
    highlights: string[];
};

type ResumeProject = {
    name: string;
    techStack: string[];
    highlights: string[];
};

type ResumeEducation = {
    institution: string;
    degree: string;
    duration: string;
};

type ResumeData = {
    name: string;
    headline: string;
    contact: string[];
    summary: string;
    skills: string[];
    experience: ResumeExperience[];
    projects: ResumeProject[];
    education: ResumeEducation[];
    certifications: string[];
};

type NormalizedAtsAnalysis = {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    sectionScores: SectionScores;
    suggestions: string[];
    strengths: string[];
    concerns: string[];
    resumeData: ResumeData;
};

const ATS_RESPONSE_SCHEMA = {
    score: 0,
    matchedKeywords: [""],
    missingKeywords: [""],
    sectionScores: {
        skills: 0,
        experience: 0,
        projects: 0,
        education: 0,
    },
    suggestions: [""],
    strengths: [""],
    concerns: [""],
    resumeData: {
        name: "",
        headline: "",
        contact: [""],
        summary: "",
        skills: [""],
        experience: [
            {
                company: "",
                role: "",
                duration: "",
                highlights: [""],
            },
        ],
        projects: [
            {
                name: "",
                techStack: [""],
                highlights: [""],
            },
        ],
        education: [
            {
                institution: "",
                degree: "",
                duration: "",
            },
        ],
        certifications: [""],
    },
};

const ATS_ANALYSIS_SYSTEM_PROMPT = `You are an expert ATS analyzer.
You receive plain text extracted from a PDF resume plus a target job description.
Return ONLY valid JSON matching the schema requested by the user.

Rules:
1. Use only the facts supported by the extracted resume text and job description.
2. Never invent jobs, dates, skills, degrees, certifications, or achievements.
3. Score the resume based on ATS alignment, role relevance, keyword coverage, experience relevance, project relevance, and education fit.
4. Suggestions must be specific and actionable for improving ATS performance for this exact job description.
5. matchedKeywords and missingKeywords must be concise ATS-friendly phrases.
6. strengths should call out strong parts of the current resume.
7. concerns should call out weak or risky areas hurting ATS performance.
8. resumeData must summarize the extracted resume content in a recruiter-friendly structure.
9. If information is missing or unclear, use empty strings or empty arrays instead of inventing data.`;

export const GET = withAuth(async (
    _req: NextRequest,
    _ctx: { params: unknown },
    user: CustomJwtPayload,
): Promise<NextResponse> => {
    try {
        await connectDB();

        const encryptedEmail = encrypt(user.email);

        const [rawRecords, latestRecord] = await Promise.all([
            AtsRecord.find({ userEmail: encryptedEmail })
                .select("jobRoleName fileName analysis modelId createdAt")
                .populate("modelId", "displayName provider modelName")
                .sort({ createdAt: -1 })
                .lean(),
            AtsRecord.findOne({ userEmail: encryptedEmail })
                .select("jobRoleName jobDescription fileName analysis modelId createdAt structuredData resumeText")
                .populate("modelId", "displayName provider modelName")
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        return NextResponse.json(
            {
                email: user.email,
                records: rawRecords.map(serializeHistoryRecord),
                latestResult: latestRecord ? buildLiveResult(latestRecord) : null,
            },
            { status: 200 },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load ATS analyses.";
        return NextResponse.json({ message }, { status: 500 });
    }
});

export const POST = withAuth(async (
    req: NextRequest,
    _ctx: { params: unknown },
    user: CustomJwtPayload,
): Promise<NextResponse> => {
    try {
        await connectDB();

        const activeSub = await Subscription.findOne({
            userEmail: user.email,
            status: "ACTIVE",
        }).sort({ createdAt: -1 });

        if (!activeSub) {
            return NextResponse.json(
                { message: "No active subscription. Please subscribe to use AI ATS." },
                { status: 403 },
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
                { status: 403 },
            );
        }

        const formData = await req.formData();
        const modelId = asText(formData.get("modelId"));
        const jobRoleName = asText(formData.get("jobRoleName"));
        const jobDescription = asText(formData.get("jobDescription"));
        const resumeFile = formData.get("resumeFile");

        if (!modelId || !jobRoleName || !jobDescription) {
            return NextResponse.json(
                { message: "modelId, jobRoleName, jobDescription and resumeFile are required." },
                { status: 400 },
            );
        }

        if (!(resumeFile instanceof File)) {
            return NextResponse.json(
                { message: "A resume PDF upload is required." },
                { status: 400 },
            );
        }

        const isPdf =
            resumeFile.type === "application/pdf" ||
            resumeFile.name.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            return NextResponse.json(
                { message: "Only PDF resumes are supported for AI ATS analysis." },
                { status: 400 },
            );
        }

        if (resumeFile.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { message: "Resume PDF must be 10 MB or smaller." },
                { status: 400 },
            );
        }

        const aiModel = await AiModel.findById(modelId);
        if (!aiModel) {
            return NextResponse.json({ message: "AI model not found." }, { status: 404 });
        }

        let apiKey = "";
        try {
            apiKey = decrypt(aiModel.apiKey);
        } catch {
            return NextResponse.json({ message: "Failed to read the selected AI model key." }, { status: 500 });
        }

        const extractedResumeText = await extractPdfText(resumeFile);
        if (!extractedResumeText) {
            return NextResponse.json(
                { message: "No readable text was found in the uploaded PDF." },
                { status: 400 },
            );
        }

        const prompt = buildAtsPrompt({
            fileName: resumeFile.name,
            jobRoleName,
            jobDescription,
            extractedResumeText,
        });

        const rawResponse = await generateAtsWithModel({
            provider: aiModel.provider,
            modelName: aiModel.modelName,
            apiKey,
            baseUrl: asText(aiModel.baseUrl),
            prompt,
        });

        const parsedResponse = parseJsonObject(rawResponse);
        const normalizedAnalysis = normalizeAtsAnalysis(parsedResponse);

        const record = await AtsRecord.create({
            userId: new mongoose.Types.ObjectId(user.sub),
            userEmail: encrypt(user.email),
            jobRoleName: jobRoleName.trim(),
            jobDescription: jobDescription.trim(),
            resumeText: extractedResumeText,
            structuredData: normalizedAnalysis,
            analysis: {
                score: normalizedAnalysis.score,
                matchedKeywords: normalizedAnalysis.matchedKeywords,
                missingKeywords: normalizedAnalysis.missingKeywords,
                sectionScores: normalizedAnalysis.sectionScores,
                suggestions: normalizedAnalysis.suggestions,
            },
            modelId: aiModel._id,
            fileName: resumeFile.name,
        });

        const populatedRecord = await record.populate("modelId", "displayName provider modelName");
        const populatedObject = populatedRecord.toObject();

        const newUsage = subUsageCount + 1;
        activeSub.usageCount = newUsage;
        await activeSub.save();

        if (subMaxUsage > 0 && newUsage >= subMaxUsage) {
            await Subscription.updateOne({ _id: activeSub._id }, { status: "EXPIRED" });
        }

        return NextResponse.json(
            {
                message: "Analysis complete.",
                record: serializeHistoryRecord(populatedObject),
                result: buildLiveResult(populatedObject),
            },
            { status: 201 },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to analyze resume.";
        return NextResponse.json({ message }, { status: 500 });
    }
});

function buildAtsPrompt({
    fileName,
    jobRoleName,
    jobDescription,
    extractedResumeText,
}: {
    fileName: string;
    jobRoleName: string;
    jobDescription: string;
    extractedResumeText: string;
}) {
    return [
        `Target role: ${jobRoleName}`,
        `Uploaded resume file: ${fileName}`,
        "",
        "Job description:",
        jobDescription,
        "",
        "Extracted resume text:",
        extractedResumeText,
        "",
        "Return JSON in this exact shape:",
        JSON.stringify(ATS_RESPONSE_SCHEMA, null, 2),
        "",
        "Scoring guidance:",
        "- Evaluate ATS fit on a 0-100 scale.",
        "- matchedKeywords should include the strongest overlaps between the resume and JD.",
        "- missingKeywords should capture important JD terms that are absent or weakly represented.",
        "- suggestions should help the candidate improve ATS fit quickly.",
        "- resumeData should summarize the candidate resume from the extracted PDF text only.",
    ].join("\n");
}

async function generateAtsWithModel({
    provider,
    modelName,
    apiKey,
    baseUrl,
    prompt,
}: {
    provider: string;
    modelName: string;
    apiKey: string;
    baseUrl: string;
    prompt: string;
}) {
    switch (provider) {
        case "google":
            return callGeminiModel({ apiKey, modelName, prompt });
        case "anthropic":
            return callAnthropicModel({ apiKey, modelName, prompt, baseUrl });
        case "openai":
        case "groq":
        case "mistral":
        case "custom":
            return callOpenAiCompatibleModel({ apiKey, modelName, prompt, provider, baseUrl });
        default:
            throw new Error(`Provider "${provider}" is not supported for AI ATS analysis.`);
    }
}

async function callGeminiModel({
    apiKey,
    modelName,
    prompt,
}: {
    apiKey: string;
    modelName: string;
    prompt: string;
}) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: ATS_ANALYSIS_SYSTEM_PROMPT }],
            },
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
            },
        }),
    });

    if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.error?.message ?? `Google AI request failed (${response.status}).`);
    }

    const data = await response.json();
    return asText(data?.candidates?.[0]?.content?.parts?.[0]?.text);
}

async function callAnthropicModel({
    apiKey,
    modelName,
    prompt,
    baseUrl,
}: {
    apiKey: string;
    modelName: string;
    prompt: string;
    baseUrl: string;
}) {
    const endpoint = resolveAnthropicEndpoint(baseUrl);
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: modelName,
            max_tokens: 2500,
            temperature: 0.2,
            system: ATS_ANALYSIS_SYSTEM_PROMPT,
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        }),
    });

    if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.error?.message ?? `Anthropic request failed (${response.status}).`);
    }

    const data = await response.json();
    const content = Array.isArray(data?.content) ? data.content : [];
    const text = content
        .map((item: LooseRecord) => asText(item?.text))
        .filter(Boolean)
        .join("\n");

    if (!text) {
        throw new Error("Anthropic returned an empty ATS response.");
    }

    return text;
}

async function callOpenAiCompatibleModel({
    apiKey,
    modelName,
    prompt,
    provider,
    baseUrl,
}: {
    apiKey: string;
    modelName: string;
    prompt: string;
    provider: string;
    baseUrl: string;
}) {
    const endpoint = resolveOpenAiCompatibleEndpoint(provider, baseUrl);
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: modelName,
            temperature: 0.2,
            messages: [
                { role: "system", content: ATS_ANALYSIS_SYSTEM_PROMPT },
                { role: "user", content: prompt },
            ],
        }),
    });

    if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.error?.message ?? `${provider} request failed (${response.status}).`);
    }

    const data = await response.json();
    const messageContent = data?.choices?.[0]?.message?.content;

    if (typeof messageContent === "string") return messageContent;

    if (Array.isArray(messageContent)) {
        const text = messageContent
            .map((item: LooseRecord) => asText(item?.text))
            .filter(Boolean)
            .join("\n");

        if (text) return text;
    }

    throw new Error(`${provider} returned an empty ATS response.`);
}

function resolveOpenAiCompatibleEndpoint(provider: string, configuredBaseUrl: string): string {
    const fallbackBaseUrl =
        provider === "groq"
            ? "https://api.groq.com/openai/v1"
            : provider === "mistral"
                ? "https://api.mistral.ai/v1"
                : provider === "openai"
                    ? "https://api.openai.com/v1"
                    : configuredBaseUrl;

    if (!fallbackBaseUrl) {
        throw new Error("A base URL is required for the selected custom AI model.");
    }

    return appendEndpoint(fallbackBaseUrl, "/chat/completions");
}

function resolveAnthropicEndpoint(configuredBaseUrl: string): string {
    if (!configuredBaseUrl) {
        return "https://api.anthropic.com/v1/messages";
    }

    const normalizedBaseUrl = stripTrailingSlash(configuredBaseUrl);

    if (normalizedBaseUrl.endsWith("/messages")) return normalizedBaseUrl;
    if (normalizedBaseUrl.endsWith("/v1")) return `${normalizedBaseUrl}/messages`;
    return `${normalizedBaseUrl}/v1/messages`;
}

function appendEndpoint(baseUrl: string, path: string): string {
    const normalizedBaseUrl = stripTrailingSlash(baseUrl);
    return normalizedBaseUrl.endsWith(path) ? normalizedBaseUrl : `${normalizedBaseUrl}${path}`;
}

function stripTrailingSlash(value: string): string {
    return value.trim().replace(/\/+$/, "");
}

function parseJsonObject(value: string): LooseRecord {
    const text = value.trim();
    if (!text) throw new Error("AI returned an empty ATS response.");

    try {
        const parsed = JSON.parse(text);
        const record = asRecord(parsed);
        if (!record) throw new Error("AI did not return a JSON object.");
        return record;
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("AI response could not be parsed as JSON.");

        const parsed = JSON.parse(match[0]);
        const record = asRecord(parsed);
        if (!record) throw new Error("AI did not return a JSON object.");
        return record;
    }
}

function normalizeAtsAnalysis(value: unknown): NormalizedAtsAnalysis {
    const record = asRecord(value) ?? {};

    return {
        score: clampScore(asNumber(record.score)),
        matchedKeywords: uniqueStrings(asTextArray(record.matchedKeywords)),
        missingKeywords: uniqueStrings(asTextArray(record.missingKeywords)),
        sectionScores: normalizeSectionScores(record.sectionScores),
        suggestions: uniqueStrings(asTextArray(record.suggestions)).slice(0, 6),
        strengths: uniqueStrings(asTextArray(record.strengths)).slice(0, 6),
        concerns: uniqueStrings(asTextArray(record.concerns)).slice(0, 6),
        resumeData: normalizeResumeData(record.resumeData),
    };
}

function normalizeSectionScores(value: unknown): SectionScores {
    const record = asRecord(value) ?? {};

    return {
        skills: clampScore(asNumber(record.skills)),
        experience: clampScore(asNumber(record.experience)),
        projects: clampScore(asNumber(record.projects)),
        education: clampScore(asNumber(record.education)),
    };
}

function normalizeResumeData(value: unknown): ResumeData {
    const record = asRecord(value) ?? {};

    return {
        name: asText(record.name),
        headline: asText(record.headline),
        contact: uniqueStrings(asTextArray(record.contact)),
        summary: asText(record.summary),
        skills: uniqueStrings(asTextArray(record.skills)),
        experience: normalizeExperience(record.experience),
        projects: normalizeProjects(record.projects),
        education: normalizeEducation(record.education),
        certifications: uniqueStrings(asTextArray(record.certifications)),
    };
}

function normalizeExperience(value: unknown): ResumeExperience[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            const record = asRecord(item);
            if (!record) {
                const text = asText(item);
                return text ? { company: "", role: "", duration: "", highlights: [text] } : null;
            }

            const entry = {
                company: firstText(record, ["company", "organization", "employer"]),
                role: firstText(record, ["role", "title", "position"]),
                duration: firstText(record, ["duration", "dates", "timeline"]),
                highlights: asTextArray(record.highlights ?? record.points ?? record.bullets),
            };

            return hasValue(entry) ? entry : null;
        })
        .filter((item): item is ResumeExperience => Boolean(item))
        .slice(0, 6);
}

function normalizeProjects(value: unknown): ResumeProject[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            const record = asRecord(item);
            if (!record) {
                const text = asText(item);
                return text ? { name: text, techStack: [], highlights: [] } : null;
            }

            const entry = {
                name: firstText(record, ["name", "title", "project"]),
                techStack: uniqueStrings(asTextArray(record.techStack ?? record.technologies ?? record.stack)),
                highlights: asTextArray(record.highlights ?? record.points ?? record.bullets),
            };

            return hasValue(entry) ? entry : null;
        })
        .filter((item): item is ResumeProject => Boolean(item))
        .slice(0, 6);
}

function normalizeEducation(value: unknown): ResumeEducation[] {
    if (!Array.isArray(value)) {
        const record = asRecord(value);
        if (!record) return [];

        const single = {
            institution: firstText(record, ["institution", "college", "school", "university"]),
            degree: firstText(record, ["degree", "qualification", "program"]),
            duration: firstText(record, ["duration", "dates", "timeline"]),
        };

        return hasValue(single) ? [single] : [];
    }

    return value
        .map((item) => {
            const record = asRecord(item);
            if (!record) return null;

            const entry = {
                institution: firstText(record, ["institution", "college", "school", "university"]),
                degree: firstText(record, ["degree", "qualification", "program"]),
                duration: firstText(record, ["duration", "dates", "timeline"]),
            };

            return hasValue(entry) ? entry : null;
        })
        .filter((item): item is ResumeEducation => Boolean(item))
        .slice(0, 4);
}

function serializeHistoryRecord(value: unknown) {
    const record = asRecord(value) ?? {};
    const analysisSource = asRecord(record.analysis) ?? record.structuredData;
    const normalized = normalizeAtsAnalysis(analysisSource);

    return {
        _id: toIdString(record._id),
        jobRoleName: asText(record.jobRoleName),
        fileName: asText(record.fileName),
        analysis: {
            score: normalized.score,
            matchedKeywords: normalized.matchedKeywords,
            missingKeywords: normalized.missingKeywords,
            sectionScores: normalized.sectionScores,
            suggestions: normalized.suggestions,
        },
        modelId: serializeModel(record.modelId),
        createdAt: toDateString(record.createdAt),
    };
}

function buildLiveResult(value: unknown) {
    const record = asRecord(value) ?? {};
    const normalized = normalizeAtsAnalysis(record.structuredData ?? record.analysis);
    const extractedResumeText = asText(record.resumeText);

    return {
        recordId: toIdString(record._id),
        jobRoleName: asText(record.jobRoleName),
        jobDescription: asText(record.jobDescription),
        fileName: asText(record.fileName),
        createdAt: toDateString(record.createdAt),
        model: serializeModel(record.modelId),
        analysis: {
            score: normalized.score,
            matchedKeywords: normalized.matchedKeywords,
            missingKeywords: normalized.missingKeywords,
            sectionScores: normalized.sectionScores,
            suggestions: normalized.suggestions,
        },
        strengths: normalized.strengths,
        concerns: normalized.concerns,
        resumeData: normalized.resumeData,
        extractedResumeText,
        extractedCharacters: extractedResumeText.length,
        extractedWordCount: countWords(extractedResumeText),
    };
}

function serializeModel(value: unknown) {
    const record = asRecord(value);
    if (!record) return null;

    return {
        id: toIdString(record._id),
        displayName: asText(record.displayName),
        provider: asText(record.provider),
        modelName: asText(record.modelName),
    };
}

function clampScore(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
}

function countWords(value: string): number {
    if (!value.trim()) return 0;
    return value.trim().split(/\s+/).length;
}

function uniqueStrings(values: string[]): string[] {
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const value of values) {
        const normalized = value.trim();
        const key = normalized.toLowerCase();

        if (!normalized || seen.has(key)) continue;

        seen.add(key);
        unique.push(normalized);
    }

    return unique;
}

function firstText(record: LooseRecord, keys: string[]): string {
    for (const key of keys) {
        const text = asText(record[key]);
        if (text) return text;
    }

    return "";
}

function asRecord(value: unknown): LooseRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as LooseRecord;
}

function asText(value: unknown): string {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return "";
}

function asNumber(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
}

function asTextArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        const single = asText(value);
        return single ? [single] : [];
    }

    return value
        .map((item) => {
            if (typeof item === "string" || typeof item === "number") {
                return asText(item);
            }

            const record = asRecord(item);
            if (!record) return "";

            return [
                firstText(record, ["name", "title", "label", "value", "text", "keyword"]),
                firstText(record, ["detail", "description", "issuer"]),
            ]
                .filter(Boolean)
                .join(" - ");
        })
        .filter(Boolean);
}

function hasValue(entry: LooseRecord): boolean {
    return Object.values(entry).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return Boolean(asText(value));
    });
}

function toIdString(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (value && typeof value === "object" && "toString" in value) {
        return String(value);
    }
    return "";
}

function toDateString(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return value;
    return "";
}
