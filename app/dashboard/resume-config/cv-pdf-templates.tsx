/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Document, Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function shortUrl(url: string): string {
    if (!url) return "";
    return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

function getEduList(data: any) {
    if (Array.isArray(data.education)) return data.education.filter((e: any) => e?.college || e?.degree);
    return (data.education?.college || data.education?.degree) ? [data.education] : [];
}
function getExpList(data: any)    { return Array.isArray(data.experience)     ? data.experience     : []; }
function getInternList(data: any) { return Array.isArray(data.internships)    ? data.internships    : []; }
function getProjList(data: any)   { return Array.isArray(data.projects)       ? data.projects       : []; }
function getCertList(data: any)   { return Array.isArray(data.certifications) ? data.certifications : []; }
function getSkillList(data: any)  { return Array.isArray(data.skills)         ? data.skills         : []; }

// =============================================================================
// TEMPLATE 1 — "LONDON CLASSIC"
// Pure black / white / gray. Name top-left + CV badge top-right. Three-column
// link grid. Uppercase letter-spaced section headings with rule. Bullet points.
// =============================================================================

const s4 = StyleSheet.create({
    page:        { padding: "38 46", backgroundColor: "#fff", fontFamily: "Helvetica" },

    // Header
    name:        { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#111", textTransform: "uppercase", letterSpacing: 1 },
    nameTitle:   { fontSize: 11, fontFamily: "Helvetica", color: "#555", marginTop: 3 },
    // Contact + info
    contact:     { marginTop: 7, fontSize: 9.5, fontFamily: "Helvetica", color: "#555", lineHeight: 1.8 },
    rule:        { height: 0.75, backgroundColor: "#ccc", marginTop: 10, marginBottom: 10 },
    thinRule:    { height: 0.35, backgroundColor: "#e0e0e0", marginTop: 7, marginBottom: 0 },

    // 3-column link grid
    infoGrid:    { flexDirection: "row", marginBottom: 2 },
    infoCol:     { flex: 1 },
    infoLabel:   { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#333" },
    infoValue:   { fontSize: 9, fontFamily: "Helvetica", color: "#555", marginTop: 2 },
    infoLnk:     { fontSize: 9, fontFamily: "Helvetica", color: "#1a56a0", textDecoration: "underline", marginTop: 2 },

    // Summary (no heading)
    summary:     { fontSize: 10, fontFamily: "Helvetica", color: "#333", lineHeight: 1.7, textAlign: "justify" },

    // Section heading
    secWrap:     { marginTop: 16 },
    secHead:     { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111", textTransform: "uppercase", letterSpacing: 2.5 },
    secRule:     { height: 1, backgroundColor: "#bbb", marginTop: 5, marginBottom: 9 },

    // Entry
    entryWrap:   { marginTop: 9 },
    entryTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    entryTitle:  { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: "#111", flex: 1 },
    entryDate:   { fontSize: 9.5, fontFamily: "Helvetica", color: "#666", flexShrink: 0, paddingLeft: 10 },
    entrySub:    { fontSize: 9.5, fontFamily: "Helvetica-Oblique", color: "#555", marginTop: 2 },
    entryDesc:   { fontSize: 9.5, fontFamily: "Helvetica", color: "#444", marginTop: 4, lineHeight: 1.65 },
    bullet:      { flexDirection: "row", marginTop: 3.5, paddingLeft: 8 },
    bulletMark:  { width: 11, fontSize: 10, color: "#444", fontFamily: "Helvetica" },
    bulletText:  { flex: 1, fontSize: 9.5, fontFamily: "Helvetica", color: "#444", lineHeight: 1.55 },
    stack:       { fontSize: 9, fontFamily: "Helvetica-Oblique", color: "#888", marginTop: 3, paddingLeft: 8 },

    // Education
    eduTop:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    degree:      { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: "#111", flex: 1 },
    eduDate:     { fontSize: 9.5, fontFamily: "Helvetica", color: "#666", flexShrink: 0, paddingLeft: 10 },
    college:     { fontSize: 9.5, fontFamily: "Helvetica-Oblique", color: "#555", marginTop: 2 },
    score:       { fontSize: 9.5, fontFamily: "Helvetica", color: "#666", marginTop: 2, lineHeight: 1.6 },

    // Skills table
    skillRow:    { flexDirection: "row", marginTop: 6 },
    skillLabel:  { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#333", width: 130 },
    skillValue:  { fontSize: 9.5, fontFamily: "Helvetica", color: "#555", flex: 1 },

    // Certs
    certItem:    { fontSize: 9.5, fontFamily: "Helvetica", color: "#444", marginTop: 5, lineHeight: 1.5 },
    lnk:         { color: "#1a56a0", textDecoration: "underline" },
});

function C4Section({ title }: { title: string }) {
    return (
        <View style={s4.secWrap}>
            <Text style={s4.secHead}>{title}</Text>
            <View style={s4.secRule} />
        </View>
    );
}

export function LondonClassicTemplate({ data }: { data: any }) {
    const exp    = getExpList(data);
    const intern = getInternList(data);
    const proj   = getProjList(data);
    const edu    = getEduList(data);
    const certs  = getCertList(data);
    const skills = getSkillList(data);
    const { linkedin, github, portfolio } = data.header?.links ?? {};

    const Bullet = ({ t }: { t: string }) => (
        <View style={s4.bullet}>
            <Text style={s4.bulletMark}>-</Text>
            <Text style={s4.bulletText}>{t}</Text>
        </View>
    );

    const Entry = ({ title, sub, duration, points, techStack }: any) => (
        <View style={s4.entryWrap} wrap={false}>
            <View style={s4.entryTop}>
                <Text style={s4.entryTitle}>{title}</Text>
                {duration ? <Text style={s4.entryDate}>{duration}</Text> : null}
            </View>
            {sub ? <Text style={s4.entrySub}>{sub}</Text> : null}
            {(points ?? []).map((p: string, i: number) => p ? <Bullet key={i} t={p} /> : null)}
            {techStack ? <Text style={s4.stack}>Technologies: {techStack}</Text> : null}
        </View>
    );

    // Build 3-column info grid from available links
    const infoCols = [
        portfolio ? { label: "Website",  value: portfolio  } : null,
        linkedin  ? { label: "LinkedIn", value: linkedin   } : null,
        github    ? { label: "GitHub",   value: github     } : null,
    ].filter(Boolean) as { label: string; value: string }[];

    return (
        <Document>
            <Page size="A4" style={s4.page}>

                {/* Header */}
                <View>
                    <Text style={s4.name}>{data.header?.name}</Text>
                    {data.header?.title ? <Text style={s4.nameTitle}>{data.header.title}</Text> : null}
                </View>

                {/* Contact */}
                {data.header?.contact ? <Text style={s4.contact}>{data.header.contact}</Text> : null}

                <View style={s4.rule} />

                {/* Info grid */}
                {infoCols.length > 0 && (
                    <View>
                        <View style={s4.infoGrid}>
                            {infoCols.map((col, i) => (
                                <View key={i} style={s4.infoCol}>
                                    <Text style={s4.infoLabel}>{col.label}</Text>
                                    <Link src={col.value} style={s4.infoLnk}>{shortUrl(col.value)}</Link>
                                </View>
                            ))}
                        </View>
                        <View style={s4.rule} />
                    </View>
                )}

                {/* Summary */}
                {data.summary?.trim() ? <Text style={s4.summary}>{data.summary}</Text> : null}

                {/* Work Experience */}
                {exp.length > 0 && (
                    <View>
                        <C4Section title="Work Experience" />
                        {exp.map((e: any, i: number) => (
                            <Entry key={i} title={e.role} sub={e.company} duration={e.duration} points={e.points} techStack={e.techStack} />
                        ))}
                    </View>
                )}

                {/* Internships */}
                {intern.length > 0 && (
                    <View>
                        <C4Section title="Internships and Training" />
                        {intern.map((e: any, i: number) => (
                            <Entry key={i} title={e.role} sub={e.company} duration={e.duration} points={e.points} techStack={e.techStack} />
                        ))}
                    </View>
                )}

                {/* Projects */}
                {proj.length > 0 && (
                    <View>
                        <C4Section title="Projects and Contributions" />
                        {proj.map((p: any, i: number) => (
                            <Entry key={i} title={p.name} sub={p.role} duration={p.duration} points={p.points} techStack={p.techStack} />
                        ))}
                    </View>
                )}

                {/* Education */}
                {edu.length > 0 && (
                    <View>
                        <C4Section title="Education and Qualifications" />
                        {edu.map((e: any, i: number) => (
                            <View key={i} style={[s4.entryWrap]} wrap={false}>
                                <View style={s4.eduTop}>
                                    <Text style={s4.degree}>{e.degree}</Text>
                                    {e.duration ? <Text style={s4.eduDate}>{e.duration}</Text> : null}
                                </View>
                                {e.college ? <Text style={s4.college}>{e.college}</Text> : null}
                                {e.score   ? <Text style={s4.score}>{e.score}</Text>     : null}
                            </View>
                        ))}
                    </View>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                    <View>
                        <C4Section title="Skills" />
                        {skills.map((sk: any, i: number) => (
                            <View key={i} style={s4.skillRow}>
                                <Text style={s4.skillLabel}>{sk.label}</Text>
                                <Text style={s4.skillValue}>{sk.value}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Certifications */}
                {certs.length > 0 && (
                    <View>
                        <C4Section title="Certifications" />
                        {certs.map((c: any, i: number) => (
                            <Text key={i} style={s4.certItem}>
                                {typeof c === "string" ? c : [c.name, c.issuer, c.date].filter(Boolean).join("  -  ")}
                            </Text>
                        ))}
                    </View>
                )}

            </Page>
        </Document>
    );
}

// =============================================================================
// TEMPLATE 2 — "MODERN STRUCTURED"
// Light-gray section bars with left accent stripe. Personal details table.
// Name + summary header. Helvetica throughout. Clean entry separators.
// =============================================================================

const S5_BAR_BG  = "#f0f0f0";
const S5_ACCENT  = "#2c2c2c";
const S5_DRK     = "#1a1a1a";
const S5_MID     = "#555";
const S5_LIT     = "#888";

const s5 = StyleSheet.create({
    page:        { padding: "34 44", backgroundColor: "#fff", fontFamily: "Helvetica" },

    // Header
    name:        { fontSize: 22, fontFamily: "Helvetica-Bold", color: S5_DRK },
    nameTitle:   { fontSize: 11, fontFamily: "Helvetica-Oblique", color: S5_MID, marginTop: 3 },
    summary:     { fontSize: 10, fontFamily: "Helvetica", color: "#333", lineHeight: 1.72, marginTop: 10, textAlign: "justify" },
    headerRule:  { height: 0.5, backgroundColor: "#d5d5d5", marginTop: 13, marginBottom: 0 },

    // Section bar — gray background with left accent stripe
    secOuter:    { marginTop: 14 },
    secBar:      { flexDirection: "row", alignItems: "stretch", backgroundColor: S5_BAR_BG, marginBottom: 7 },
    secStripe:   { width: 4, backgroundColor: S5_ACCENT },
    secLabel:    { fontSize: 11, fontFamily: "Helvetica-Bold", color: S5_DRK, paddingVertical: 6, paddingHorizontal: 10 },

    // Personal details table
    detailRow:   { flexDirection: "row", alignItems: "flex-start", marginTop: 5 },
    detailKey:   { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: S5_MID, width: 120 },
    detailVal:   { fontSize: 9.5, fontFamily: "Helvetica", color: S5_DRK, flex: 1, lineHeight: 1.55 },
    detailLnk:   { fontSize: 9.5, fontFamily: "Helvetica", color: "#1a56a0", textDecoration: "underline", flex: 1 },

    // Entry
    entryWrap:   { marginTop: 9 },
    entryTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    entryTitle:  { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: S5_DRK, flex: 1 },
    entryDate:   { fontSize: 9.5, fontFamily: "Helvetica", color: S5_LIT, flexShrink: 0, paddingLeft: 10 },
    entrySub:    { fontSize: 9.5, fontFamily: "Helvetica-Oblique", color: S5_MID, marginTop: 2 },
    bullet:      { flexDirection: "row", marginTop: 3.5, paddingLeft: 8 },
    bulletMark:  { width: 11, fontSize: 10, color: "#444", fontFamily: "Helvetica" },
    bulletText:  { flex: 1, fontSize: 9.5, fontFamily: "Helvetica", color: "#444", lineHeight: 1.55 },
    stack:       { fontSize: 9, fontFamily: "Helvetica-Oblique", color: S5_LIT, marginTop: 3, paddingLeft: 8 },
    entryDivider:{ height: 0.35, backgroundColor: "#e0e0e0", marginTop: 9 },

    // Education
    eduTop:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    degree:      { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: S5_DRK, flex: 1 },
    eduDate:     { fontSize: 9.5, fontFamily: "Helvetica", color: S5_LIT, flexShrink: 0, paddingLeft: 10 },
    college:     { fontSize: 9.5, fontFamily: "Helvetica-Oblique", color: S5_MID, marginTop: 2 },
    score:       { fontSize: 9.5, fontFamily: "Helvetica", color: S5_LIT, marginTop: 2, lineHeight: 1.6 },

    // Skills
    skillRow:    { flexDirection: "row", marginTop: 6 },
    skillLabel:  { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#444", width: 130 },
    skillValue:  { fontSize: 9.5, fontFamily: "Helvetica", color: S5_MID, flex: 1 },

    // Certs
    certItem:    { fontSize: 9.5, fontFamily: "Helvetica", color: "#444", marginTop: 5, lineHeight: 1.5 },
    lnk:         { color: "#1a56a0", textDecoration: "underline" },
});

function S5Section({ title }: { title: string }) {
    return (
        <View style={s5.secOuter}>
            <View style={s5.secBar}>
                <View style={s5.secStripe} />
                <Text style={s5.secLabel}>{title}</Text>
            </View>
        </View>
    );
}

export function ModernStructuredTemplate({ data }: { data: any }) {
    const exp    = getExpList(data);
    const intern = getInternList(data);
    const proj   = getProjList(data);
    const edu    = getEduList(data);
    const certs  = getCertList(data);
    const skills = getSkillList(data);
    const { linkedin, github, portfolio } = data.header?.links ?? {};

    const contactParts = (data.header?.contact || "")
        .split("|")
        .map((s: string) => s.trim())
        .filter(Boolean);

    const Bullet = ({ t }: { t: string }) => (
        <View style={s5.bullet}>
            <Text style={s5.bulletMark}>-</Text>
            <Text style={s5.bulletText}>{t}</Text>
        </View>
    );

    const Entry = ({ title, sub, duration, points, techStack, showDivider }: any) => (
        <View style={s5.entryWrap} wrap={false}>
            <View style={s5.entryTop}>
                <Text style={s5.entryTitle}>{title}</Text>
                {duration ? <Text style={s5.entryDate}>{duration}</Text> : null}
            </View>
            {sub ? <Text style={s5.entrySub}>{sub}</Text> : null}
            {(points ?? []).map((p: string, i: number) => p ? <Bullet key={i} t={p} /> : null)}
            {techStack ? <Text style={s5.stack}>Technologies: {techStack}</Text> : null}
            {showDivider ? <View style={s5.entryDivider} /> : null}
        </View>
    );

    return (
        <Document>
            <Page size="A4" style={s5.page}>

                {/* Header */}
                <Text style={s5.name}>{data.header?.name}</Text>
                {data.header?.title ? <Text style={s5.nameTitle}>{data.header.title}</Text> : null}
                {data.summary?.trim() ? <Text style={s5.summary}>{data.summary}</Text> : null}
                <View style={s5.headerRule} />

                {/* Personal Details */}
                <S5Section title="Personal Details" />
                {data.header?.name ? (
                    <View style={s5.detailRow}>
                        <Text style={s5.detailKey}>Name</Text>
                        <Text style={s5.detailVal}>{data.header.name}</Text>
                    </View>
                ) : null}
                {contactParts.map((part: string, i: number) => (
                    <View key={i} style={s5.detailRow}>
                        <Text style={s5.detailKey}>{i === 0 ? "Address / Email" : i === 1 ? "Phone" : `Contact ${i + 1}`}</Text>
                        <Text style={s5.detailVal}>{part}</Text>
                    </View>
                ))}
                {linkedin ? (
                    <View style={s5.detailRow}>
                        <Text style={s5.detailKey}>LinkedIn</Text>
                        <Link src={linkedin} style={s5.detailLnk}>{shortUrl(linkedin)}</Link>
                    </View>
                ) : null}
                {github ? (
                    <View style={s5.detailRow}>
                        <Text style={s5.detailKey}>GitHub</Text>
                        <Link src={github} style={s5.detailLnk}>{shortUrl(github)}</Link>
                    </View>
                ) : null}
                {portfolio ? (
                    <View style={s5.detailRow}>
                        <Text style={s5.detailKey}>Portfolio / Website</Text>
                        <Link src={portfolio} style={s5.detailLnk}>{shortUrl(portfolio)}</Link>
                    </View>
                ) : null}

                {/* Work Experience */}
                {exp.length > 0 && (
                    <View>
                        <S5Section title="Work Experience" />
                        {exp.map((e: any, i: number) => (
                            <Entry key={i} title={e.role} sub={e.company} duration={e.duration}
                                points={e.points} techStack={e.techStack} showDivider={i < exp.length - 1} />
                        ))}
                    </View>
                )}

                {/* Internships */}
                {intern.length > 0 && (
                    <View>
                        <S5Section title="Internships and Training" />
                        {intern.map((e: any, i: number) => (
                            <Entry key={i} title={e.role} sub={e.company} duration={e.duration}
                                points={e.points} techStack={e.techStack} showDivider={i < intern.length - 1} />
                        ))}
                    </View>
                )}

                {/* Projects */}
                {proj.length > 0 && (
                    <View>
                        <S5Section title="Projects and Contributions" />
                        {proj.map((p: any, i: number) => (
                            <Entry key={i} title={p.name} sub={p.role} duration={p.duration}
                                points={p.points} techStack={p.techStack} showDivider={i < proj.length - 1} />
                        ))}
                    </View>
                )}

                {/* Education */}
                {edu.length > 0 && (
                    <View>
                        <S5Section title="Education and Qualifications" />
                        {edu.map((e: any, i: number) => (
                            <View key={i} style={s5.entryWrap} wrap={false}>
                                <View style={s5.eduTop}>
                                    <Text style={s5.degree}>{e.degree}</Text>
                                    {e.duration ? <Text style={s5.eduDate}>{e.duration}</Text> : null}
                                </View>
                                {e.college ? <Text style={s5.college}>{e.college}</Text> : null}
                                {e.score   ? <Text style={s5.score}>{e.score}</Text>     : null}
                                {i < edu.length - 1 ? <View style={s5.entryDivider} /> : null}
                            </View>
                        ))}
                    </View>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                    <View>
                        <S5Section title="Skills" />
                        {skills.map((sk: any, i: number) => (
                            <View key={i} style={s5.skillRow}>
                                <Text style={s5.skillLabel}>{sk.label}</Text>
                                <Text style={s5.skillValue}>{sk.value}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Certifications */}
                {certs.length > 0 && (
                    <View>
                        <S5Section title="Certifications" />
                        {certs.map((c: any, i: number) => (
                            <Text key={i} style={s5.certItem}>
                                {typeof c === "string" ? c : [c.name, c.issuer, c.date].filter(Boolean).join("  -  ")}
                            </Text>
                        ))}
                    </View>
                )}

            </Page>
        </Document>
    );
}

// ─── Template registry ────────────────────────────────────────────────────────

export const CV_TEMPLATES = [
    {
        id:          "london",
        name:        "London Classic",
        description: "Black & white - CV badge - Info grid - Uppercase section headings",
        component:   LondonClassicTemplate,
    },
    {
        id:          "structured",
        name:        "Modern Structured",
        description: "Gray section bars - Personal details table - Clean dividers - Helvetica",
        component:   ModernStructuredTemplate,
    },
] as const;

export type CvTemplateId = "london" | "structured";
