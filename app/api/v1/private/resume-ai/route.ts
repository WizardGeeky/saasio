import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { decrypt } from "@/app/configs/crypto.config";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { extractPdfText, PdfTextExtractionError } from "@/app/utils/pdf-text-extraction";
import { withAuth } from "@/app/utils/withAuth";
import { AiModel } from "@/models/AiModel";

export const runtime = "nodejs";

type LooseRecord = Record<string, unknown>;

const RESUME_JSON_SCHEMA = {
    header: {
        name: "",
        title: "",
        contact: "",
        links: {
            linkedin: "",
            github: "",
            portfolio: "",
        },
    },
    summary: "",
    skills: [
        {
            label: "",
            value: "",
        },
    ],
    experience: [
        {
            company: "",
            role: "",
            duration: "",
            link: "",
            points: [""],
            techStack: "",
        },
    ],
    projects: [
        {
            name: "",
            role: "",
            duration: "",
            link: "",
            points: [""],
            techStack: "",
        },
    ],
    internships: [
        {
            company: "",
            role: "",
            duration: "",
            link: "",
            points: [""],
            techStack: "",
        },
    ],
    education: {
        college: "",
        degree: "",
        duration: "",
    },
    certifications: [
        {
            name: "",
            issuer: "",
            date: "",
            details: "",
        },
    ],
    achievements: [""],
    positions: [
        {
            organization: "",
            role: "",
            duration: "",
            points: [""],
        },
    ],
    volunteering: [
        {
            organization: "",
            role: "",
            duration: "",
            points: [""],
        },
    ],
    awards: [""],
    coursework: [""],
    languages: [""],
    publications: [""],
    customSections: [
        {
            title: "",
            items: [""],
        },
    ],
};

const RESUME_AI_SYSTEM_PROMPT = `You are an expert resume writer and ATS optimizer.
Transform the candidate's uploaded resume into the exact JSON schema provided by the user. The goal is to create a job-specific resume, optimizing it for Applicant Tracking Systems (ATS) while capturing all relevant information from the original resume.

Rules:
1. Return ONLY valid JSON. No markdown fences. No commentary.
2. Preserve all factual candidate data from the uploaded resume. Do not drop real companies, dates, education, certifications, skills, projects, links, or achievements.
3. Tailor wording to the target role and job description while staying truthful to the uploaded resume.
4. Maximize ATS alignment by using relevant keywords from the job description naturally across summary, skills, experience, projects, internships, and supporting sections.
5. Prefer quantified bullet points when the uploaded resume already contains numbers, durations, counts, percentages, scale, volumes, or measurable impact.
6. Never invent facts, companies, dates, degrees, certifications, technologies, or exact metrics that are not supported by the uploaded resume or job description.
7. If a section has no credible information, return an empty array or empty string for that section.
8. Support both fresher and experienced candidates using the same schema.
9. Keep bullets concise, strong, and recruiter-friendly.
10. Keep header.links limited to linkedin, github, and portfolio keys.`;

export const POST = withAuth(async (
    req: NextRequest,
    _ctx: { params: any },
    _user: CustomJwtPayload,
): Promise<NextResponse> => {
    try {
        await connectDB();

        const formData = await req.formData();
        const modelId = asText(formData.get("modelId"));
        const targetRole = asText(formData.get("targetRole"));
        const jobDescription = asText(formData.get("jobDescription"));
        const templateId = asText(formData.get("templateId"));
        const templateName = asText(formData.get("templateName"));
        const resumeFile = formData.get("resumeFile");

        if (!modelId || !targetRole || !jobDescription) {
            return NextResponse.json(
                { message: "modelId, targetRole, and jobDescription are required." },
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
                { message: "Only PDF resumes are supported." },
                { status: 400 },
            );
        }

        const aiModel = await AiModel.findById(modelId);
        if (!aiModel) {
            return NextResponse.json({ message: "Selected AI model was not found." }, { status: 404 });
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
                { message: "No readable text was found in the uploaded PDF. Please upload a text-based PDF, not a scanned image PDF." },
                { status: 400 },
            );
        }

        const prompt = buildResumeGenerationPrompt({
            targetRole,
            jobDescription,
            extractedResumeText,
            templateId,
            templateName,
            fileName: resumeFile.name,
        });

        const rawResponse = await generateResumeWithModel({
            provider: aiModel.provider,
            modelName: aiModel.modelName,
            apiKey,
            baseUrl: asText(aiModel.baseUrl),
            prompt,
        });

        const parsedResponse = parseJsonObject(rawResponse);
        const resumeJson = normalizeResumeJson(parsedResponse);

        return NextResponse.json(
            {
                message: "Resume generated successfully.",
                resumeJson,
                model: {
                    id: String(aiModel._id),
                    provider: aiModel.provider,
                    displayName: aiModel.displayName,
                    modelName: aiModel.modelName,
                },
                extractedCharacters: extractedResumeText.length,
            },
            { status: 200 },
        );
    } catch (error: unknown) {
        if (error instanceof PdfTextExtractionError) {
            return NextResponse.json(
                {
                    message: "Failed to read text from the uploaded PDF on the server.",
                    details: error.details,
                },
                { status: 500 },
            );
        }

        const message = error instanceof Error ? error.message : "Failed to generate resume.";
        return NextResponse.json({ message }, { status: 500 });
    }
});

function buildResumeGenerationPrompt({
    targetRole,
    jobDescription,
    extractedResumeText,
    templateId,
    templateName,
    fileName,
}: {
    targetRole: string;
    jobDescription: string;
    extractedResumeText: string;
    templateId: string;
    templateName: string;
    fileName: string;
}) {
    return [
        `Target role: ${targetRole}`,
        `Selected resume format: ${templateName || templateId || "resume-builder"}`,
        `Uploaded file name: ${fileName}`,
        "",
        "Job description:",
        jobDescription,
        "",
        "Extracted resume text:",
        extractedResumeText,
        "",
        "Return data in this exact JSON schema shape:",
        JSON.stringify(RESUME_JSON_SCHEMA, null, 2),
        "",
        "Extra instructions:",
        "- Use role-aligned ATS keywords from the job description across summary, skills, and relevant bullets.",
        "- Keep all valid user resume information from the uploaded PDF.",
        "- Reword bullets for stronger impact, but remain truthful to the candidate's actual experience.",
        "- IMPORTANT: Include numbers or percentages in bullet points to quantify impact and significantly increase ATS score.",
        "- If exact metrics are missing from the source, infer reasonable and plausible numbers or percentage improvements based on context.",
        "- Put fresher content into internships, projects, coursework, positions, volunteering, achievements, and certifications when appropriate.",
        "- Keep unsupported sections empty instead of inventing unrelated content.",
    ].join("\n");
}

async function generateResumeWithModel({
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
            throw new Error(`Provider "${provider}" is not supported for Resume With AI.`);
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
                parts: [{ text: RESUME_AI_SYSTEM_PROMPT }],
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
            max_tokens: 4000,
            temperature: 0.2,
            system: RESUME_AI_SYSTEM_PROMPT,
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
        throw new Error("Anthropic returned an empty response.");
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
                { role: "system", content: RESUME_AI_SYSTEM_PROMPT },
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

    throw new Error(`${provider} returned an empty response.`);
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
    if (!text) throw new Error("AI returned an empty response.");

    try {
        const parsed = JSON.parse(text);
        const record = asRecord(parsed);
        if (!record) throw new Error("AI did not return a JSON object.");
        return record;
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("AI response could not be parsed as resume JSON.");

        const parsed = JSON.parse(match[0]);
        const record = asRecord(parsed);
        if (!record) throw new Error("AI did not return a JSON object.");
        return record;
    }
}

function normalizeResumeJson(value: LooseRecord) {
    const header = asRecord(value.header);
    const headerLinks = asRecord(header?.links);

    return {
        header: {
            name: firstText(header, ["name", "fullName"]),
            title: firstText(header, ["title", "headline", "role"]),
            contact: firstText(header, ["contact", "contactInfo"]),
            links: {
                linkedin: firstText(headerLinks, ["linkedin"]),
                github: firstText(headerLinks, ["github"]),
                portfolio: firstText(headerLinks, ["portfolio", "website"]),
            },
        },
        summary: asText(value.summary),
        skills: normalizeSkills(value.skills),
        experience: normalizeExperienceEntries(value.experience),
        projects: normalizeProjectEntries(value.projects),
        internships: normalizeExperienceEntries(value.internships),
        education: normalizeEducation(value.education),
        certifications: normalizeCertifications(value.certifications),
        achievements: asTextArray(value.achievements),
        positions: normalizePositionEntries(value.positions),
        volunteering: normalizePositionEntries(value.volunteering),
        awards: asTextArray(value.awards),
        coursework: asTextArray(value.coursework),
        languages: asTextArray(value.languages),
        publications: asTextArray(value.publications),
        customSections: normalizeCustomSections(value.customSections),
    };
}

function normalizeSkills(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            if (typeof item === "string") {
                const [label, rawValue] = item.split(/:(.+)/);
                const normalizedLabel = rawValue ? label.trim() : "Core Skills";
                const normalizedValue = rawValue ? rawValue.trim() : item.trim();
                return normalizedValue ? { label: normalizedLabel, value: normalizedValue } : null;
            }

            const record = asRecord(item);
            if (!record) return null;

            const label = firstText(record, ["label", "category", "title", "name"]) || "Core Skills";
            const rawValue = record.value ?? record.skills ?? record.items ?? record.list ?? record.technologies;
            const normalizedValue = Array.isArray(rawValue)
                ? asTextArray(rawValue).join(", ")
                : asText(rawValue);

            return normalizedValue ? { label, value: normalizedValue } : null;
        })
        .filter((item): item is { label: string; value: string } => Boolean(item));
}

function normalizeExperienceEntries(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            const record = asRecord(item);
            if (!record) return null;

            const entry = {
                company: firstText(record, ["company", "organization", "institution"]),
                role: firstText(record, ["role", "title", "position", "name"]),
                duration: buildDuration(record),
                link: firstText(record, ["link", "url", "website"]),
                points: firstTextArray(record, ["points", "bullets", "highlights", "items"]),
                techStack: buildListString(record, ["techStack", "technologies", "stack"]),
            };

            return hasContent(entry) ? entry : null;
        })
        .filter((item): item is {
            company: string;
            role: string;
            duration: string;
            link: string;
            points: string[];
            techStack: string;
        } => Boolean(item));
}

function normalizeProjectEntries(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            const record = asRecord(item);
            if (!record) return null;

            const entry = {
                name: firstText(record, ["name", "title", "project"]),
                role: firstText(record, ["role", "title", "position"]),
                duration: buildDuration(record),
                link: firstText(record, ["link", "url", "website"]),
                points: firstTextArray(record, ["points", "bullets", "highlights", "items"]),
                techStack: buildListString(record, ["techStack", "technologies", "stack"]),
            };

            return hasContent(entry) ? entry : null;
        })
        .filter((item): item is {
            name: string;
            role: string;
            duration: string;
            link: string;
            points: string[];
            techStack: string;
        } => Boolean(item));
}

function normalizePositionEntries(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            const record = asRecord(item);
            if (!record) return null;

            const entry = {
                organization: firstText(record, ["organization", "company", "institution"]),
                role: firstText(record, ["role", "title", "position", "name"]),
                duration: buildDuration(record),
                points: firstTextArray(record, ["points", "bullets", "highlights", "items"]),
            };

            return hasContent(entry) ? entry : null;
        })
        .filter((item): item is {
            organization: string;
            role: string;
            duration: string;
            points: string[];
        } => Boolean(item));
}

function normalizeEducation(value: unknown) {
    const record = asRecord(value) ?? asRecord(Array.isArray(value) ? value[0] : null);

    return {
        college: firstText(record, ["college", "school", "university", "institution"]),
        degree: firstText(record, ["degree", "qualification", "program"]),
        duration: buildDuration(record),
    };
}

function normalizeCertifications(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            const record = asRecord(item);
            if (!record) return null;

            const entry = {
                name: firstText(record, ["name", "title", "certification", "certificate"]),
                issuer: firstText(record, ["issuer", "organization", "platform"]),
                date: buildDuration(record),
                details: buildListString(record, ["details", "points", "highlights"]),
            };

            return hasContent(entry) ? entry : null;
        })
        .filter((item): item is {
            name: string;
            issuer: string;
            date: string;
            details: string;
        } => Boolean(item));
}

function normalizeCustomSections(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            const record = asRecord(item);
            if (!record) return null;

            const entry = {
                title: firstText(record, ["title", "heading", "label", "name"]),
                items: firstTextArray(record, ["items", "points", "values"]),
            };

            return entry.title && entry.items.length > 0 ? entry : null;
        })
        .filter((item): item is { title: string; items: string[] } => Boolean(item));
}

function buildDuration(record: LooseRecord | null): string {
    if (!record) return "";

    const direct = firstText(record, ["duration", "date"]);
    if (direct) return direct;

    const start = firstText(record, ["startDate", "from"]);
    const end = firstText(record, ["endDate", "to"]);
    const current = record.current === true ? "Present" : "";
    return joinNonEmpty([start, current || end], " - ");
}

function buildListString(record: LooseRecord | null, keys: string[]): string {
    if (!record) return "";

    for (const key of keys) {
        const value = record[key];
        if (Array.isArray(value)) {
            const items = asTextArray(value);
            if (items.length > 0) return items.join(", ");
        }

        const text = asText(value);
        if (text) return text;
    }

    return "";
}

function firstText(record: LooseRecord | null, keys: string[]): string {
    if (!record) return "";

    for (const key of keys) {
        const text = asText(record[key]);
        if (text) return text;
    }

    return "";
}

function firstTextArray(record: LooseRecord | null, keys: string[]): string[] {
    if (!record) return [];

    for (const key of keys) {
        const value = record[key];
        const items = asTextArray(value);
        if (items.length > 0) return items;
    }

    return [];
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

function asTextArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        const single = asText(value);
        return single ? [single] : [];
    }

    const items = value
        .map((item) => {
            if (typeof item === "string" || typeof item === "number") return asText(item);

            const record = asRecord(item);
            if (!record) return "";

            return joinNonEmpty(
                [
                    firstText(record, ["name", "title", "label", "value", "language", "course", "item"]),
                    firstText(record, ["level", "issuer", "description"]),
                ],
                " - ",
            );
        })
        .filter(Boolean);

    return Array.from(new Set(items));
}

function joinNonEmpty(values: string[], separator = " | "): string {
    return values.filter(Boolean).join(separator);
}

function hasContent(entry: LooseRecord): boolean {
    return Object.values(entry).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return Boolean(asText(value));
    });
}
