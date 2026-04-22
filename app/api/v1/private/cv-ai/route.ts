import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/configs/database.config";
import { decrypt } from "@/app/configs/crypto.config";
import { CustomJwtPayload } from "@/app/configs/jwt.config";
import { extractPdfText, PdfTextExtractionError } from "@/app/utils/pdf-text-extraction";
import { withAuth } from "@/app/utils/withAuth";
import { AiModel } from "@/models/AiModel";

export const runtime = "nodejs";

type LooseRecord = Record<string, unknown>;

// ─── JSON schema (same structure as resume) ───────────────────────────────────

const CV_JSON_SCHEMA = {
    header: {
        name: "",
        title: "",
        contact: "",
        links: { linkedin: "", github: "", portfolio: "" },
    },
    summary: "",
    skills: [{ label: "", value: "" }],
    experience: [{ company: "", role: "", duration: "", link: "", points: [""], techStack: "" }],
    projects: [{ name: "", role: "", duration: "", link: "", points: [""], techStack: "" }],
    internships: [{ company: "", role: "", duration: "", link: "", points: [""], techStack: "" }],
    education: [{ college: "", degree: "", duration: "", score: "" }],
    certifications: [{ name: "", issuer: "", date: "", details: "" }],
    achievements: [""],
    positions: [{ organization: "", role: "", duration: "", points: [""] }],
    volunteering: [{ organization: "", role: "", duration: "", points: [""] }],
    awards: [""],
    coursework: [""],
    languages: [""],
    publications: [""],
    customSections: [{ title: "", items: [""] }],
};

// ─── CV-specific system prompt ─────────────────────────────────────────────────

const CV_AI_SYSTEM_PROMPT = `You are an expert CV writer and career strategist. Your task is to transform a raw resume PDF into a comprehensive, highly polished professional CV — without any job description or target role provided by the user.

OUTPUT FORMAT (non-negotiable):
1. Return ONLY valid JSON. No markdown fences, no commentary, no text before or after the JSON object.
2. Preserve ALL factual anchors: real companies, dates, education, certifications, skills, projects, URLs. Never fabricate or drop factual data.
3. Never invent employers, degrees, certifications, or achievements not present in the resume.
4. Empty fields: use "" or [] — never use placeholder text like "N/A", "Not Specified", "TBD", "None", etc.
5. header.links must contain ONLY: linkedin, github, portfolio keys.
6. contact format: "phone | email | city, state" — only data from the resume.
7. skills.value = comma-separated skill names within that category.

═══ CV GENERATION RULES ═══

ROLE INFERENCE (do this first):
- Carefully read the entire resume to identify the candidate's primary domain and strongest role type.
- Set header.title to the most accurate professional title that represents their experience level and domain (e.g., "Full Stack Engineer", "Data Scientist", "Product Manager", "DevOps Engineer").
- The summary must name this inferred title in the first or second sentence and reflect the candidate's actual career trajectory.

COMPREHENSIVE COVERAGE:
- A CV is broader and more complete than a resume. Include ALL experience, ALL projects, ALL certifications, ALL education, ALL achievements — do not omit anything from the original resume.
- For experienced professionals: give equal depth to every role, not just the most recent one.
- For freshers: treat every project and internship with full depth — each is a showcase of capability.

POLISHING — MANDATORY:
- Rewrite every bullet from scratch. Do NOT copy-paste raw text from the resume.
- Bullet structure: [Strong action verb] + [specific technology/tool] + [what was built or improved] + [quantified outcome or scale].
- Upgrade all weak language: "worked on" → "Engineered", "helped" → "Collaborated on", "did testing" → "Executed end-to-end testing".
- Every bullet must have at least one measurable element (number, percentage, scale, timeline, user count, or team size).

QUANTIFICATION (mandatory on every bullet):
- Use exact figures from the resume when available.
- When absent, infer realistic industry-standard metrics:
  • API/backend work → "serving X,000+ daily requests", "reducing latency by ~X%"
  • Frontend → "improving Lighthouse score from X to Y", "supporting X concurrent users"
  • Data/ML → "processing X records", "achieving X% model accuracy", "reducing inference time by X%"
  • DevOps/cloud → "reducing deployment time by X%", "achieving X% uptime SLA"
  • Bug fixes → "resolving X+ critical issues", "reducing error rate by X%"
  • Leadership → "mentoring a team of X", "delivering X sprint goals on time"
- Mark inferred ranges with (~) only when it's a range; otherwise state directly as a professional achievement.

SUMMARY — must be exceptional:
- Write from scratch — never copy the original summary.
- Name the inferred target role/title in the first or second sentence.
- Capture the candidate's total years of experience, primary domain, key technologies, and strongest achievement.
- Structure for freshers: "[Degree] graduate with strong foundation in [domain]. Aspiring [title] with hands-on expertise in [tech1], [tech2], [tech3]. [Key project/achievement as value proposition]."
- Structure for experienced: "[X] years of [domain] experience as a [title]. Proven track record of [achievement type]. Deep expertise in [top 3-4 technologies]. [Value proposition]."
- Do NOT write a vague summary — every word must reflect this specific candidate.

SKILLS — comprehensive and categorized:
- Group skills into logical categories matching the candidate's domain (e.g., "Programming Languages", "Frontend Frameworks", "Backend & APIs", "Cloud & DevOps", "Databases", "Tools & Methodologies").
- Include proficiency hints for primary skills: "Python (Expert), Java (Advanced), Go (Intermediate)".
- Add standard soft skills for the inferred role type: Agile, Cross-functional Collaboration, Technical Documentation, Problem Solving.
- Infer companion tools that are standard with their existing stack.

EXPERIENCE & INTERNSHIPS — deep and impactful:
- Minimum 4 bullets per experience/internship entry, maximum 6.
- Every tech stack field: 4–8 specific technologies used in that role.
- Start each bullet with a DIFFERENT strong action verb (no verb repetition within one entry).
- Senior roles: add leadership, architecture decisions, cross-team impact, cost/performance outcomes.

PROJECTS — full depth:
- Minimum 3 bullets per project.
- Include: tech stack, deployment platform, estimated users/scale/metrics, duration.
- For freshers: projects are the primary differentiator — treat each one with the depth of a work experience entry.

EDUCATION:
- education is an ARRAY. List ALL institutions from most recent to oldest: degree → junior college/intermediate → high school.
- college = institution name + city, degree = qualification name only (no CGPA in degree), score = CGPA/percentage/marks in score field.
- For high school/junior college: show marks if available ("Marks: 961/1000").
- NEVER put education in customSections.

CERTIFICATIONS:
- Include ALL structured learning: professional certs, online courses (Coursera, edX, Udemy), cloud training, bootcamps.
- Format: "Certification Name — Issuer, Year".
- Leave [] only if zero certifications exist in the resume.

LINKS:
- Populate header.links.linkedin, github, portfolio with full https:// URLs from the resume.
- Convert plain-text URLs (e.g., "linkedin.com/in/user") to full https:// format.

GENERAL:
- The output must read as a professionally authored CV, not a transcription of a raw PDF.
- Do not drop any factual section — a CV is comprehensive by design.
- Preserve all real dates, company names, project names, and degree titles exactly as they appear.`;

// ─── Route handler ────────────────────────────────────────────────────────────

export const POST = withAuth(async (
    req: NextRequest,
    _ctx: { params: unknown },
    _user: CustomJwtPayload,
): Promise<NextResponse> => {
    try {
        await connectDB();

        const formData = await req.formData();
        const modelId = asText(formData.get("modelId"));
        const resumeFile = formData.get("resumeFile");

        if (!modelId) {
            return NextResponse.json({ message: "modelId is required." }, { status: 400 });
        }

        if (!(resumeFile instanceof File)) {
            return NextResponse.json({ message: "A resume PDF upload is required." }, { status: 400 });
        }

        const isPdf =
            resumeFile.type === "application/pdf" ||
            resumeFile.name.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            return NextResponse.json({ message: "Only PDF resumes are supported." }, { status: 400 });
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

        const prompt = buildCvGenerationPrompt({
            extractedResumeText,
            fileName: resumeFile.name,
        });

        const rawResponse = await generateWithModel({
            provider: aiModel.provider,
            modelName: aiModel.modelName,
            apiKey,
            baseUrl: asText(aiModel.baseUrl),
            prompt,
        });

        const parsedResponse = parseJsonObject(rawResponse);
        const resumeJson = normalizeJson(parsedResponse);

        return NextResponse.json(
            {
                message: "CV generated successfully.",
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
                { message: "Failed to read text from the uploaded PDF on the server.", details: error.details },
                { status: 500 },
            );
        }
        const message = error instanceof Error ? error.message : "Failed to generate CV.";
        return NextResponse.json({ message }, { status: 500 });
    }
});

// ─── CV-specific prompt builder ────────────────────────────────────────────────

function buildCvGenerationPrompt({
    extractedResumeText,
    fileName,
}: {
    extractedResumeText: string;
    fileName: string;
}) {
    return [
        `Source file: ${fileName}`,
        "",
        "TASK: Generate a comprehensive, polished professional CV purely from the resume content below.",
        "No target role or job description is provided — infer the candidate's best-fit professional title from their experience and use it throughout.",
        "",
        "=== CANDIDATE RESUME TEXT (single source of truth — all factual data comes from here) ===",
        extractedResumeText,
        "",
        "=== REQUIRED JSON SCHEMA ===",
        JSON.stringify(CV_JSON_SCHEMA, null, 2),
        "",
        "=== GENERATION CHECKLIST ===",
        "",
        "① INFER THE ROLE:",
        "  • Read the full resume and determine the candidate's primary professional title.",
        "  • Set header.title to this inferred title (e.g., 'Senior Software Engineer', 'Data Analyst', 'Product Manager').",
        "  • Name this title in the first or second sentence of the summary.",
        "",
        "② REWRITE EVERY BULLET (most important):",
        "  • Do NOT copy-paste text from the resume — rewrite every bullet from scratch.",
        "  • Structure: [Strong action verb] + [technology/tool] + [what was built/improved] + [quantified outcome].",
        "  • Replace all weak verbs: 'worked on' → 'Engineered', 'helped' → 'Collaborated on', 'did' → 'Executed'.",
        "  • Minimum 4 bullets per experience/internship entry, minimum 3 per project.",
        "  • No verb repetition within a single entry — each bullet must start with a different action verb.",
        "",
        "③ QUANTIFY EVERYTHING:",
        "  • Every bullet must contain at least one number, percentage, scale, or timeline.",
        "  • Use exact figures from the resume when available.",
        "  • When absent, infer realistic metrics for the role and tech stack (mark uncertain ranges with ~).",
        "  • Examples: 'serving 5,000+ daily requests', 'reducing latency by ~30%', 'processing 100K records', 'team of 4 engineers'.",
        "",
        "④ COMPREHENSIVE SUMMARY:",
        "  • Rewrite from scratch — never copy the original summary.",
        "  • Name the inferred title in sentence 1 or 2.",
        "  • Include: years of experience, primary domain, top 3–4 technologies, strongest achievement or value proposition.",
        "  • Tailored to this specific candidate's actual background — no generic filler.",
        "",
        "⑤ SKILLS — categorized and complete:",
        "  • Group into logical categories for the inferred domain.",
        "  • Add proficiency indicators for primary skills (e.g., 'Python (Expert), Java (Advanced)').",
        "  • Include relevant soft skills: Agile Methodologies, Cross-functional Collaboration, Technical Documentation.",
        "  • Add standard companion tools for the candidate's existing stack.",
        "",
        "⑥ COMPLETE COVERAGE:",
        "  • A CV is comprehensive — include ALL experience, projects, internships, certifications, achievements, education from the resume.",
        "  • Do not omit or truncate any section that has data.",
        "  • education MUST be an array of all institutions (degree → junior college → high school).",
        "  • CGPA/marks go in the score field, NOT in the degree field.",
        "",
        "⑦ LINKS & CONTACT:",
        "  • Populate header.links.linkedin, github, portfolio with full https:// URLs from the resume.",
        "  • Convert plain-text URLs to full https:// format.",
        "  • contact = 'phone | email | city' using only data from the resume.",
        "",
        "GENERAL:",
        "  • Preserve all factual anchors (company names, job titles, project names, dates, degree names).",
        "  • Empty fields: use '' or [] — never use 'N/A', 'Not Specified', 'TBD', or similar placeholders.",
        "  • The output must read as a professionally authored CV, not a transcription of a raw PDF.",
    ].join("\n");
}

// ─── Model dispatch (same pattern as resume-ai) ────────────────────────────────

async function generateWithModel({
    provider, modelName, apiKey, baseUrl, prompt,
}: {
    provider: string; modelName: string; apiKey: string; baseUrl: string; prompt: string;
}) {
    switch (provider) {
        case "google":    return callGemini({ apiKey, modelName, prompt });
        case "anthropic": return callAnthropic({ apiKey, modelName, prompt, baseUrl });
        case "openai":
        case "groq":
        case "mistral":
        case "custom":    return callOpenAiCompat({ apiKey, modelName, prompt, provider, baseUrl });
        default:          throw new Error(`Provider "${provider}" is not supported.`);
    }
}

async function callGemini({ apiKey, modelName, prompt }: { apiKey: string; modelName: string; prompt: string }) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: CV_AI_SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        }),
    });
    if (!response.ok) {
        const e = await response.json().catch(() => ({}));
        throw new Error(e?.error?.message ?? `Google AI request failed (${response.status}).`);
    }
    const data = await response.json();
    return asText(data?.candidates?.[0]?.content?.parts?.[0]?.text);
}

async function callAnthropic({ apiKey, modelName, prompt, baseUrl }: { apiKey: string; modelName: string; prompt: string; baseUrl: string }) {
    const base = baseUrl?.trim().replace(/\/+$/, "") || "https://api.anthropic.com";
    const endpoint = base.endsWith("/messages") ? base : base.endsWith("/v1") ? `${base}/messages` : `${base}/v1/messages`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
            model: modelName, max_tokens: 4000, temperature: 0.2,
            system: CV_AI_SYSTEM_PROMPT,
            messages: [{ role: "user", content: prompt }],
        }),
    });
    if (!response.ok) {
        const e = await response.json().catch(() => ({}));
        throw new Error(e?.error?.message ?? `Anthropic request failed (${response.status}).`);
    }
    const data = await response.json();
    const text = (Array.isArray(data?.content) ? data.content : [])
        .map((item: LooseRecord) => asText(item?.text)).filter(Boolean).join("\n");
    if (!text) throw new Error("Anthropic returned an empty response.");
    return text;
}

async function callOpenAiCompat({ apiKey, modelName, prompt, provider, baseUrl }: { apiKey: string; modelName: string; prompt: string; provider: string; baseUrl: string }) {
    const fallback = provider === "groq" ? "https://api.groq.com/openai/v1" : provider === "mistral" ? "https://api.mistral.ai/v1" : provider === "openai" ? "https://api.openai.com/v1" : baseUrl;
    if (!fallback) throw new Error("A base URL is required for the selected custom AI model.");
    const base = fallback.trim().replace(/\/+$/, "");
    const endpoint = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: modelName, temperature: 0.2,
            messages: [{ role: "system", content: CV_AI_SYSTEM_PROMPT }, { role: "user", content: prompt }],
        }),
    });
    if (!response.ok) {
        const e = await response.json().catch(() => ({}));
        throw new Error(e?.error?.message ?? `${provider} request failed (${response.status}).`);
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        const text = content.map((item: LooseRecord) => asText(item?.text)).filter(Boolean).join("\n");
        if (text) return text;
    }
    throw new Error(`${provider} returned an empty response.`);
}

// ─── JSON parsing & normalization (mirrors resume-ai) ─────────────────────────

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
        if (!match) throw new Error("AI response could not be parsed as CV JSON.");
        const parsed = JSON.parse(match[0]);
        const record = asRecord(parsed);
        if (!record) throw new Error("AI did not return a JSON object.");
        return record;
    }
}

function normalizeJson(value: LooseRecord) {
    const header = asRecord(value.header);
    const links = asRecord(header?.links);
    return {
        header: {
            name: firstText(header, ["name", "fullName"]),
            title: firstText(header, ["title", "headline", "role"]),
            contact: cleanContact(firstText(header, ["contact", "contactInfo"])),
            links: {
                linkedin:  firstText(links, ["linkedin"]),
                github:    firstText(links, ["github"]),
                portfolio: firstText(links, ["portfolio", "website"]),
            },
        },
        summary:        asText(value.summary),
        skills:         normalizeSkills(value.skills),
        experience:     normalizeExpEntries(value.experience),
        projects:       normalizeProjEntries(value.projects),
        internships:    normalizeExpEntries(value.internships),
        education:      normalizeEdu(value.education),
        certifications: normalizeCerts(value.certifications),
        achievements:   asTextArray(value.achievements),
        positions:      normalizePosEntries(value.positions),
        volunteering:   normalizePosEntries(value.volunteering),
        awards:         asTextArray(value.awards),
        coursework:     asTextArray(value.coursework),
        languages:      asTextArray(value.languages),
        publications:   asTextArray(value.publications),
        customSections: normalizeCustom(value.customSections),
    };
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function asText(v: unknown): string {
    return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}

function asRecord(v: unknown): LooseRecord | null {
    return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as LooseRecord) : null;
}

function firstText(obj: LooseRecord | null, keys: string[]): string {
    if (!obj) return "";
    for (const k of keys) { const v = asText(obj[k]); if (v) return v; }
    return "";
}

function asTextArray(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return v.map((item) => {
        if (typeof item === "string") return item;
        const r = asRecord(item);
        if (r) return firstText(r, ["name", "value", "text", "item"]);
        return "";
    }).filter(Boolean);
}

function cleanContact(raw: string): string {
    return raw.split(/\s*[|,]\s*/).filter((part) => {
        const t = part.trim();
        if (!t) return false;
        if (/^https?:\/\//i.test(t)) return false;
        if (/^(www\.)?[\w-]+\.(com|io|dev|net|org|me|app|co)\//i.test(t)) return false;
        if (/^(linkedin|github|twitter|instagram|behance|dribbble)\.com/i.test(t)) return false;
        return true;
    }).join(" | ");
}

function normalizeSkills(v: unknown) {
    if (!Array.isArray(v)) return [];
    return v.map((item) => {
        if (typeof item === "string") {
            const [label, val] = item.split(/:(.+)/);
            return val ? { label: label.trim(), value: val.trim() } : { label: "Core Skills", value: item.trim() };
        }
        const r = asRecord(item);
        if (!r) return null;
        const label = firstText(r, ["label", "category", "name", "type"]);
        const value = firstText(r, ["value", "skills", "items"]);
        return label || value ? { label: label || "Core Skills", value } : null;
    }).filter(Boolean);
}

function normalizeExpEntries(v: unknown) {
    if (!Array.isArray(v)) return [];
    return v.map((item) => {
        const r = asRecord(item);
        if (!r) return null;
        return {
            company:   firstText(r, ["company", "employer", "organization"]),
            role:      firstText(r, ["role", "title", "position"]),
            duration:  firstText(r, ["duration", "period", "dates"]),
            link:      firstText(r, ["link", "url"]),
            points:    asTextArray(r.points ?? r.bullets ?? r.responsibilities),
            techStack: firstText(r, ["techStack", "technologies", "stack"]),
        };
    }).filter(Boolean);
}

function normalizeProjEntries(v: unknown) {
    if (!Array.isArray(v)) return [];
    return v.map((item) => {
        const r = asRecord(item);
        if (!r) return null;
        return {
            name:      firstText(r, ["name", "title", "project"]),
            role:      firstText(r, ["role", "position"]),
            duration:  firstText(r, ["duration", "period"]),
            link:      firstText(r, ["link", "url", "github"]),
            points:    asTextArray(r.points ?? r.bullets ?? r.description),
            techStack: firstText(r, ["techStack", "technologies", "stack"]),
        };
    }).filter(Boolean);
}

function normalizeEdu(v: unknown) {
    if (Array.isArray(v)) return v.filter((e) => asRecord(e)).map((e) => {
        const r = asRecord(e)!;
        return {
            college:  firstText(r, ["college", "institution", "school", "university"]),
            degree:   firstText(r, ["degree", "qualification", "program"]),
            duration: firstText(r, ["duration", "period", "year"]),
            score:    firstText(r, ["score", "cgpa", "gpa", "marks", "percentage"]),
        };
    });
    const r = asRecord(v);
    return r ? [{ college: firstText(r, ["college", "institution"]), degree: firstText(r, ["degree"]), duration: firstText(r, ["duration"]), score: firstText(r, ["score"]) }] : [];
}

function normalizeCerts(v: unknown) {
    if (!Array.isArray(v)) return [];
    return v.map((item) => {
        if (typeof item === "string") return { name: item, issuer: "", date: "", details: "" };
        const r = asRecord(item);
        if (!r) return null;
        return {
            name:    firstText(r, ["name", "title", "certification"]),
            issuer:  firstText(r, ["issuer", "provider", "organization"]),
            date:    firstText(r, ["date", "year", "completedAt"]),
            details: firstText(r, ["details", "description"]),
        };
    }).filter(Boolean);
}

function normalizePosEntries(v: unknown) {
    if (!Array.isArray(v)) return [];
    return v.map((item) => {
        const r = asRecord(item);
        if (!r) return null;
        return {
            organization: firstText(r, ["organization", "company", "club"]),
            role:         firstText(r, ["role", "title", "position"]),
            duration:     firstText(r, ["duration", "period"]),
            points:       asTextArray(r.points ?? r.bullets),
        };
    }).filter(Boolean);
}

function normalizeCustom(v: unknown) {
    if (!Array.isArray(v)) return [];
    return v.map((item) => {
        const r = asRecord(item);
        if (!r) return null;
        return {
            title: firstText(r, ["title", "heading", "section"]),
            items: asTextArray(r.items ?? r.content ?? r.entries),
        };
    }).filter(Boolean);
}
