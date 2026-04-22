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
    education: [
        {
            college: "",
            degree: "",
            duration: "",
            score: "",
        },
    ],
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

const RESUME_AI_SYSTEM_PROMPT = `You are an expert resume writer, ATS optimization specialist, and career coach. Your mission is two-fold: (1) produce resumes that score 95+ on ATS systems, and (2) POLISH and ENHANCE the candidate's experience — do NOT copy-paste the original resume text. Rewrite every bullet, summary, and description to be more impactful, keyword-rich, and results-oriented.

OUTPUT FORMAT RULES (non-negotiable):
1. Return ONLY valid JSON. No markdown fences, no commentary, no text before or after.
2. Preserve ALL factual data: real companies, dates, education, certifications, skills, projects, links. Never drop or alter factual anchors (employer names, job titles, graduation years, degree names).
3. Never invent companies, employers, degrees, or certifications not present in the resume or JD.
4. QUANTIFICATION — you MUST add numbers to every bullet. Priority order:
   a. Use exact figures from the resume when available.
   b. When figures are absent, INFER a realistic estimate based on the role, tech stack, and industry norms. For example: "Reduced page load time by ~35% by implementing lazy loading" or "Served 500+ concurrent users" or "Cut deployment time by 40% via CI/CD automation". Mark inferred metrics with a tilde (~) only when the estimate is a range — otherwise state it directly as a professional achievement.
   c. Contextual scale is the minimum acceptable: "team of 5", "across 8 microservices", "in 3-week sprint" — but prefer a real metric over contextual scale.
   d. DO NOT leave any bullet without at least one measurable element.
5. NEVER use placeholder text for missing fields. If a value is unknown or missing, use "" (empty string) or [] (empty array). Forbidden placeholder values include: "Not Specified", "N/A", "None", "Unknown", "TBD", "Not Available", "No Link", "Not Provided" — these will break the PDF layout. Use empty string instead.
6. header.links must contain ONLY: linkedin, github, portfolio keys.
7. contact field format: "phone | email | city, state" — use only data from the resume.
8. skills.value = comma-separated skill names within that category.

═══ POLISHING RULES — MANDATORY ═══

REWRITE, DO NOT COPY:
- Every bullet point must be rewritten in professional, ATS-optimized language.
- Original resume text is raw material — transform it into polished, impactful statements.
- Weak bullet: "Worked on the backend API" → Strong: "Architected and deployed RESTful APIs using Node.js and Express, reducing average response latency by 28% and supporting 10,000+ daily requests."
- Weak bullet: "Fixed bugs" → Strong: "Resolved 25+ critical production bugs across 3 services, improving system stability and reducing error rate by 40%."
- Weak bullet: "Did data analysis" → Strong: "Performed exploratory data analysis on 500K+ records using Python and Pandas, generating actionable insights that informed 3 product decisions."

POWER WORDS & ATS VOCABULARY:
- Start every bullet with a strong action verb: Architected, Engineered, Spearheaded, Optimized, Deployed, Automated, Reduced, Increased, Streamlined, Implemented, Designed, Led, Mentored, Delivered, Integrated, Migrated, Refactored, Monitored, Collaborated, Built.
- Use industry-standard ATS vocabulary aligned to the role: e.g., for software roles use "CI/CD pipeline", "microservices architecture", "RESTful API", "agile sprint", "unit testing", "code review".
- Avoid weak verbs: "worked on", "helped with", "assisted", "did", "made", "used", "involved in".

ADD RELEVANT SKILLS FROM JD:
- If the JD mentions skills/tools that are standard companions to what the candidate already knows (e.g., candidate knows React → add "Redux, React Hooks, Webpack" if JD mentions them as expected knowledge), include them in the skills section.
- Add soft skills relevant to the role that ATS systems score: "Agile Methodologies", "Cross-functional Collaboration", "Technical Documentation", "Problem Solving".
- Add relevant certifications or training areas as suggestions in skills (do NOT fabricate certification entries — only add to skills keywords).

═══ ATS SCORING CRITERIA — TARGET 95+ ═══

① KEYWORDS & TECH STACK (target 20/20):
- Extract every technical keyword, framework, tool, methodology, and domain term from the job description.
- Embed them naturally in: summary (3-5 JD keywords), skills section (exact JD tool names), experience/project bullets (1-2 JD keywords each), tech stack fields.
- Use exact JD spelling: "Spring Boot" not "Spring", "RESTful API" not "REST API" if that's what JD says.
- Skills categories should mirror JD sections (e.g., "Backend Development", "Cloud & DevOps", "Databases").
- Add a proficiency indicator for top skills in each category: "Java (Expert), Python (Advanced), Go (Intermediate)".

② QUANTIFIED ACHIEVEMENTS (target 18/20):
- Every experience and internship bullet MUST include at least one number, percentage, scale, or timeline.
- Infer realistic metrics when not provided — this is expected and professional. A polished resume always has numbers.
- Projects: add deployment platform, estimated users/requests, tech stack count, project duration, or GitHub stars/forks if known.
- Absolutely no vague bullets — "Worked on backend" scores 0. "Built REST API endpoints serving 1,000+ daily requests" scores high.

③ CONTACT & FORMATTING (target 15/15):
- LinkedIn, GitHub, and Portfolio URLs must be in header.links with full resolvable https:// URLs.
- The contact string should include phone | email | city — the links object handles profile URLs separately.
- Use consistent date format throughout: "Jan 2023 – Jun 2023" or "2021 – 2023".
- Section titles must be clear and standard (EXPERIENCE, PROJECTS, EDUCATION, CERTIFICATIONS).

④ WORK EXPERIENCE DEPTH (target 17/20):
- Each role (full-time or internship): minimum 4 bullets, maximum 6 bullets.
- Bullet structure: [Strong action verb] + [specific technology/tool] + [what was built/improved] + [quantified impact/scale].
- Rewrite every bullet from scratch using the original context — do not paste raw resume text.
- For candidates with 1 employer: compensate depth by making internship entries as rich as full-time roles (4-5 bullets each). Treat academic capstone projects as professional work entries when they have real deployment, users, or complexity.
- Every tech stack field should be populated with 4-8 specific technologies used in that role/project.

⑤ EDUCATION & CERTIFICATIONS (target 14/15):
- Education field is an ARRAY. List ALL education in order from most recent to oldest: degree → junior college/intermediate → high school.
- Each entry: college = institution name + city, degree = qualification name ONLY (no CGPA here), score = CGPA/percentage (e.g., "CGPA: 8.4/10" or "Percentage: 92%"), duration = year range.
- For high school and junior college: omit CGPA, just show marks percentage if available (e.g., "Marks: 961/1000").
- NEVER create a "Academic Background" custom section — put all education in the education array.
- Certifications: include ALL structured learning — professional certs, Coursera/edX/Udemy completions, AWS Skill Builder, Google Cloud Skills Boost, Microsoft Learn, bootcamp certificates, vendor training. Format: "Certification Name — Issuer, Year".
- If no certifications exist in the resume, leave certifications as [] — do not invent.

⑥ SUMMARY & ROLE TARGETING (target 9/10):
- The summary MUST name the specific role title from the job posting (or very close variant) in the first or second sentence.
- Must contain ≥ 4 keywords or exact phrases from the job description requirements.
- Structure for freshers: "[Degree] graduate with strong foundation in [JD domain]. Seeking [exact role title] to apply expertise in [JD keyword 1], [JD keyword 2], and [JD keyword 3]. [Value proposition tied to JD]."
- Structure for experienced: "[X] years of [domain] experience specializing in [JD tech stack]. Proven track record of [achievement type relevant to JD role]. Currently seeking [exact role title] at [company type from JD]."
- Never write a generic summary — every word must connect to the specific JD.
- The summary itself must be rewritten — do not copy the original resume summary.

═══ PROFILE-SPECIFIC RULES ═══

FRESHER (0–2 years, students, recent graduates):
- Priority order: Skills → Projects → Internships → Education → Certifications → Achievements → Positions.
- Projects section is the strongest differentiator: 3-5 projects, 3-4 bullets each, full tech stack, inferred metrics (users, requests, response time, dataset size, accuracy %).
- Coursework: include ONLY if 5+ courses are directly relevant to the JD — max 6 items. Omit if courses are generic.
- Experience: empty [] unless genuine full-time employment (internships go in internships section).
- Education: include degree + junior college + high school in the education array (most recent first).

EXPERIENCED (3+ years full-time):
- Priority order: Summary → Experience → Skills → Projects → Certifications → Education → Achievements.
- Experience is the core: 4-6 bullets per role with business impact, scale, leadership, and technology specifics.
- Drop internships if 3+ years of full-time experience exists.
- Drop coursework [] entirely — senior profiles do not list coursework.
- Education: include degree only (skip high school/junior college unless specifically relevant).
- Senior profiles (6+ years): add leadership, mentoring, architectural decisions, cross-team impact, cost savings, performance gains.

QUALITY BAR:
- Before finalizing, mentally score each bullet: does it have an action verb + technology + outcome + number? If no, rewrite it.
- The output resume must read like it was written by a professional career coach, not extracted from a raw PDF.
- Every section must be polished, specific, and targeted to the job description.`;


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
        const experienceLevel = asText(formData.get("experienceLevel")); // "fresher" | "experienced" | ""
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
            experienceLevel,
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
    experienceLevel,
}: {
    targetRole: string;
    jobDescription: string;
    extractedResumeText: string;
    templateId: string;
    templateName: string;
    fileName: string;
    experienceLevel: string;
}) {
    const profileHint =
        experienceLevel === "fresher"
            ? "CANDIDATE PROFILE: Fresher / Recent Graduate (0–2 years). Apply the FRESHER PROFILE rules from the system prompt — prioritize projects, internships, education, certifications, coursework, and achievements."
            : experienceLevel === "experienced"
                ? "CANDIDATE PROFILE: Experienced Professional (3+ years). Apply the EXPERIENCED PROFILE rules from the system prompt — prioritize experience, summary, skills, and notable projects."
                : "CANDIDATE PROFILE: Auto-detect from the resume. If the candidate has < 2 years of full-time work, apply FRESHER rules. If ≥ 3 years of full-time work, apply EXPERIENCED rules.";

    return [
        profileHint,
        `Target role: ${targetRole}`,
        `Resume format: ${templateName || templateId || "resume-builder"}`,
        `Source file: ${fileName}`,
        "",
        "=== JOB DESCRIPTION (read carefully — extract all keywords) ===",
        jobDescription,
        "",
        "=== CANDIDATE RESUME TEXT (source of all factual data) ===",
        extractedResumeText,
        "",
        "=== REQUIRED JSON SCHEMA ===",
        JSON.stringify(RESUME_JSON_SCHEMA, null, 2),
        "",
        "=== GENERATION CHECKLIST (complete every item) ===",
        "",
        "POLISHING (most important — do this first):",
        "  • REWRITE every bullet — do NOT copy-paste text from the resume. Transform raw experience into polished achievements.",
        "  • Every bullet must follow: [Strong action verb] + [technology/tool] + [what was built/improved] + [quantified outcome].",
        "  • Upgrade weak language: 'worked on' → 'Engineered', 'helped with' → 'Collaborated on', 'did testing' → 'Executed'.",
        "  • Add inferred metrics where numbers are absent — every bullet needs at least one measurable element.",
        "",
        "SUMMARY — must score 9/10:",
        "  • REWRITE the summary from scratch — do not copy original resume summary.",
        "  • Name the exact target role ('" + targetRole + "') in the first or second sentence.",
        "  • Use ≥ 4 keywords extracted directly from the job description above.",
        "  • End with a value proposition that matches the JD's stated needs.",
        "  • Do NOT write a generic profile — every sentence must connect to this specific JD.",
        "",
        "KEYWORDS & ATS VOCABULARY:",
        "  • Identify the top 15 technical keywords from the JD and distribute them across summary, skills, bullets, and tech stacks.",
        "  • Match exact spelling from the JD (e.g., 'Spring Boot' not 'Spring', 'Node.js' not 'NodeJS').",
        "  • Include proficiency hints in skills: 'Java (Expert), Python (Advanced), Go (Intermediate)'.",
        "  • Add standard ATS soft skills for this role type: Agile Methodologies, Cross-functional Collaboration, Technical Documentation, etc.",
        "  • If the candidate has related skills, infer and add companion tools from the JD that are standard with their stack.",
        "",
        "QUANTIFICATION (mandatory on every bullet):",
        "  • Use exact figures from the resume when available.",
        "  • When figures are absent, infer realistic industry-standard metrics. Examples:",
        "    - API work → 'serving X,000+ daily requests', 'reducing latency by X%'",
        "    - Frontend → 'improving page load by X%', 'supporting X concurrent users'",
        "    - Data work → 'processing X records', 'achieving X% model accuracy'",
        "    - DevOps → 'reducing deployment time by X%', 'achieving X% uptime'",
        "    - Bug fixes → 'resolving X+ issues', 'reducing error rate by X%'",
        "  • Contextual scale is the minimum: 'team of 4', 'across 6 services', '3-month sprint'.",
        "",
        "BULLETS (experience, internships, projects):",
        "  • Minimum 4 bullets per experience or internship entry. Minimum 3 bullets per project.",
        "  • Start each bullet with a DIFFERENT strong action verb — no verb repetition within one entry.",
        "  • Each bullet must incorporate at least 1 JD keyword and 1 quantified outcome.",
        "",
        "CERTIFICATIONS:",
        "  • Include ALL structured learning: professional certs, Coursera/edX/Udemy, cloud training (AWS, Google, Azure), bootcamps.",
        "  • Format: 'Certification Name — Issuer, Year'.",
        "  • Leave [] only if the resume has zero certifications or courses mentioned.",
        "",
        "EDUCATION:",
        "  • education is an ARRAY — list ALL institutions: degree (most recent) → junior college → high school.",
        "  • Output CGPA/GPA in the score field (NOT in degree): score = \"CGPA: 8.4/10\" or \"GPA: 3.8/4.0\" or \"Percentage: 92%\" or \"Marks: 961/1000\".",
        "  • For high school / junior college: show qualification + marks if available, no CGPA format.",
        "  • NEVER put educational history in customSections — always use the education array.",
        "  • Coursework: only include if courses directly match JD (max 6). Experienced candidates: leave [] empty.",
        "",
        "LINKS:",
        "  • Populate header.links.linkedin, github, portfolio with full https:// URLs from the resume.",
        "  • If the resume has profile URLs as plain text (e.g., 'linkedin.com/in/user'), convert to https://linkedin.com/in/user.",
        "",
        "GENERAL:",
        "  • Preserve all factual anchors — do not drop or alter real companies, job titles, project names, certifications, or dates.",
        "  • Empty sections: use [] or '' — never invent companies, employers, or degrees.",
        "  • The final output must read as a professionally written, polished resume — not a transcription of the uploaded PDF.",
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

function cleanContact(raw: string): string {
    return raw
        .split(/\s*[|,]\s*/)
        .filter((part) => {
            const t = part.trim();
            if (!t) return false;
            if (/^https?:\/\//i.test(t)) return false;
            if (/^(www\.)?[\w-]+\.(com|io|dev|net|org|me|app|co)\//i.test(t)) return false;
            if (/^(linkedin|github|twitter|instagram|behance|dribbble)\.com/i.test(t)) return false;
            return true;
        })
        .join(" | ");
}

function normalizeResumeJson(value: LooseRecord) {
    const header = asRecord(value.header);
    const headerLinks = asRecord(header?.links);

    return {
        header: {
            name: firstText(header, ["name", "fullName"]),
            title: firstText(header, ["title", "headline", "role"]),
            contact: cleanContact(firstText(header, ["contact", "contactInfo"])),
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

function normalizeEducation(value: unknown): Array<{ college: string; degree: string; duration: string; score: string }> {
    const items = Array.isArray(value) ? value : (value && typeof value === "object" ? [value] : []);

    return items
        .map((item) => {
            const record = asRecord(item);
            if (!record) return null;
            const college = firstText(record, ["college", "school", "university", "institution"]);
            const degree = firstText(record, ["degree", "qualification", "program"]);
            const duration = buildDuration(record);
            const score = firstText(record, ["score", "gpa", "cgpa", "percentage", "grade", "marks"]);
            return (college || degree) ? { college, degree, duration, score } : null;
        })
        .filter((e): e is { college: string; degree: string; duration: string; score: string } => Boolean(e));
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

// Placeholder values the AI sometimes generates for unknown/missing fields.
// These must be stripped — the PDF should show nothing, not a label.
const AI_PLACEHOLDER_VALUES = new Set([
    "not specified", "n/a", "na", "none", "unknown", "tbd", "to be determined",
    "not available", "not applicable", "unspecified", "no link", "no url",
    "no portfolio", "not provided", "not listed", "not mentioned", "not stated",
]);

function asText(value: unknown): string {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (AI_PLACEHOLDER_VALUES.has(trimmed.toLowerCase())) return "";
        return trimmed;
    }
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
