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

function getExpList(data: any) {
    return Array.isArray(data.experience) ? data.experience : [];
}

function getInternList(data: any) {
    return Array.isArray(data.internships) ? data.internships : [];
}

function getProjList(data: any) {
    return Array.isArray(data.projects) ? data.projects : [];
}

function getCertList(data: any) {
    return Array.isArray(data.certifications) ? data.certifications : [];
}

function getSkillList(data: any) {
    return Array.isArray(data.skills) ? data.skills : [];
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — FORMAL PROFESSIONAL CV
// Clean Times serif. Centered header, small-caps sections, two-column skills.
// ─────────────────────────────────────────────────────────────────────────────

const s1 = StyleSheet.create({
    page:       { padding: "22 30", backgroundColor: "#fff", fontFamily: "Times-Roman" },
    // Header
    hName:      { fontSize: 26, fontFamily: "Times-Bold", textAlign: "center", textTransform: "uppercase", letterSpacing: 2, color: "#111" },
    hTitle:     { fontSize: 11, fontFamily: "Times-Italic", textAlign: "center", color: "#444", marginTop: 3 },
    hRule:      { height: 1.5, backgroundColor: "#222", marginTop: 5, marginBottom: 3 },
    hContact:   { fontSize: 9, fontFamily: "Times-Roman", textAlign: "center", color: "#555", lineHeight: 1.6 },
    hLinks:     { fontSize: 9, fontFamily: "Times-Roman", textAlign: "center", color: "#1a56a0", marginTop: 2, lineHeight: 1.6 },
    // Section
    sHead:      { fontSize: 10, fontFamily: "Times-Bold", textTransform: "uppercase", letterSpacing: 2, color: "#111", marginTop: 12, marginBottom: 1 },
    sRule:      { height: 0.75, backgroundColor: "#888", marginBottom: 5 },
    // Career entry
    entryRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    entryTitle: { fontSize: 10.5, fontFamily: "Times-Bold", color: "#111", flex: 1 },
    entryDate:  { fontSize: 9.5, fontFamily: "Times-Italic", color: "#555", flexShrink: 0 },
    entryCo:    { fontSize: 10, fontFamily: "Times-Italic", color: "#333", marginTop: 1 },
    bullet:     { flexDirection: "row", marginTop: 2.5, paddingLeft: 4 },
    bulletDot:  { width: 10, fontSize: 10, color: "#111" },
    bulletText: { flex: 1, fontSize: 9.5, fontFamily: "Times-Roman", color: "#222", lineHeight: 1.45 },
    stack:      { fontSize: 9, fontFamily: "Times-Italic", color: "#555", marginTop: 2, paddingLeft: 4 },
    // Skills two-column
    skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 0 },
    skillItem:  { width: "50%", flexDirection: "row", marginTop: 3 },
    skillLabel: { fontSize: 9.5, fontFamily: "Times-Bold", color: "#111" },
    skillValue: { fontSize: 9.5, fontFamily: "Times-Roman", color: "#333", flex: 1, lineHeight: 1.4 },
    // Summary
    summary:    { fontSize: 10, fontFamily: "Times-Roman", color: "#222", lineHeight: 1.6, textAlign: "justify" },
    // Edu
    eduRow:     { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    eduDeg:     { fontSize: 10, fontFamily: "Times-Bold", color: "#111" },
    eduDate:    { fontSize: 9.5, fontFamily: "Times-Italic", color: "#555" },
    eduColl:    { fontSize: 10, fontFamily: "Times-Italic", color: "#333", marginTop: 1 },
    eduScore:   { fontSize: 9.5, fontFamily: "Times-Roman", color: "#555", marginTop: 1 },
    // Cert
    certText:   { fontSize: 9.5, fontFamily: "Times-Roman", color: "#333", marginTop: 3, lineHeight: 1.4 },
    lnk:        { color: "#1a56a0", textDecoration: "underline" },
});

function FormalCvSection({ title }: { title: string }) {
    return (
        <View>
            <Text style={s1.sHead}>{title}</Text>
            <View style={s1.sRule} />
        </View>
    );
}

export function ClassicCvTemplate({ data }: { data: any }) {
    const exp = getExpList(data);
    const intern = getInternList(data);
    const proj = getProjList(data);
    const edu = getEduList(data);
    const certs = getCertList(data);
    const skills = getSkillList(data);
    const { linkedin, github, portfolio } = data.header?.links ?? {};

    const Bullet = ({ t }: { t: string }) => (
        <View style={s1.bullet}>
            <Text style={s1.bulletDot}>▸</Text>
            <Text style={s1.bulletText}>{t}</Text>
        </View>
    );

    const EntryBlock = ({ role, company, duration, points, techStack }: any) => (
        <View style={{ marginTop: 6 }} wrap={false}>
            <View style={s1.entryRow}>
                <Text style={s1.entryTitle}>{role}</Text>
                <Text style={s1.entryDate}>{duration}</Text>
            </View>
            <Text style={s1.entryCo}>{company}</Text>
            {(points ?? []).map((p: string, i: number) => p ? <Bullet key={i} t={p} /> : null)}
            {techStack ? <Text style={s1.stack}>Technologies: {techStack}</Text> : null}
        </View>
    );

    return (
        <Document>
            <Page size="A4" style={s1.page}>

                {/* ── Header ── */}
                <Text style={s1.hName}>{data.header?.name}</Text>
                {data.header?.title ? <Text style={s1.hTitle}>{data.header.title}</Text> : null}
                <View style={s1.hRule} />
                {data.header?.contact ? <Text style={s1.hContact}>{data.header.contact}</Text> : null}
                {(linkedin || github || portfolio) ? (
                    <Text style={s1.hLinks}>
                        {linkedin ? <Link src={linkedin} style={s1.lnk}>{shortUrl(linkedin)}</Link> : null}
                        {linkedin && github ? <Text>  •  </Text> : null}
                        {github ? <Link src={github} style={s1.lnk}>{shortUrl(github)}</Link> : null}
                        {(linkedin || github) && portfolio ? <Text>  •  </Text> : null}
                        {portfolio ? <Link src={portfolio} style={s1.lnk}>{shortUrl(portfolio)}</Link> : null}
                    </Text>
                ) : null}

                {/* ── Professional Profile ── */}
                {data.summary?.trim() ? (
                    <View>
                        <FormalCvSection title="Professional Profile" />
                        <Text style={s1.summary}>{data.summary}</Text>
                    </View>
                ) : null}

                {/* ── Career History ── */}
                {exp.length > 0 ? (
                    <View>
                        <FormalCvSection title="Career History" />
                        {exp.map((e: any, i: number) => <EntryBlock key={i} role={e.role} company={e.company} duration={e.duration} points={e.points} techStack={e.techStack} />)}
                    </View>
                ) : null}

                {/* ── Internships ── */}
                {intern.length > 0 ? (
                    <View>
                        <FormalCvSection title="Internships & Training" />
                        {intern.map((e: any, i: number) => <EntryBlock key={i} role={e.role} company={e.company} duration={e.duration} points={e.points} techStack={e.techStack} />)}
                    </View>
                ) : null}

                {/* ── Projects ── */}
                {proj.length > 0 ? (
                    <View>
                        <FormalCvSection title="Projects & Contributions" />
                        {proj.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: 6 }} wrap={false}>
                                <View style={s1.entryRow}>
                                    <Text style={s1.entryTitle}>
                                        {p.link ? <Link src={p.link} style={s1.lnk}>{p.name}</Link> : p.name}
                                        {p.role ? <Text style={{ fontFamily: "Times-Italic", color: "#444" }}> · {p.role}</Text> : null}
                                    </Text>
                                    <Text style={s1.entryDate}>{p.duration}</Text>
                                </View>
                                {(p.points ?? []).map((pt: string, j: number) => pt ? <Bullet key={j} t={pt} /> : null)}
                                {p.techStack ? <Text style={s1.stack}>Technologies: {p.techStack}</Text> : null}
                            </View>
                        ))}
                    </View>
                ) : null}

                {/* ── Core Competencies ── */}
                {skills.length > 0 ? (
                    <View>
                        <FormalCvSection title="Core Competencies" />
                        <View style={s1.skillsWrap}>
                            {skills.map((sk: any, i: number) => (
                                <View key={i} style={s1.skillItem}>
                                    <Text style={s1.skillLabel}>{sk.label}:  </Text>
                                    <Text style={s1.skillValue}>{sk.value}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* ── Education ── */}
                {edu.length > 0 ? (
                    <View>
                        <FormalCvSection title="Education & Qualifications" />
                        {edu.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 6 : 0 }} wrap={false}>
                                <View style={s1.eduRow}>
                                    <Text style={s1.eduDeg}>{e.degree}</Text>
                                    <Text style={s1.eduDate}>{e.duration}</Text>
                                </View>
                                <Text style={s1.eduColl}>{e.college}</Text>
                                {e.score ? <Text style={s1.eduScore}>{e.score}</Text> : null}
                            </View>
                        ))}
                    </View>
                ) : null}

                {/* ── Certifications ── */}
                {certs.length > 0 ? (
                    <View>
                        <FormalCvSection title="Certifications & Professional Development" />
                        {certs.map((c: any, i: number) => (
                            <Text key={i} style={s1.certText}>
                                {typeof c === "string" ? c : [c.name, c.issuer, c.date].filter(Boolean).join(" — ")}
                            </Text>
                        ))}
                    </View>
                ) : null}

            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — EXECUTIVE TWO-COLUMN CV
// Dark left sidebar (contact + skills), white right main (profile + history).
// ─────────────────────────────────────────────────────────────────────────────

const SIDEBAR_W = 175;
const MAIN_W    = 370;
const ACCENT    = "#1e3a5f";
const ACCENT2   = "#2563eb";

const s2 = StyleSheet.create({
    page:       { padding: 0, backgroundColor: "#fff", flexDirection: "row" },
    // Sidebar
    sidebar:    { width: SIDEBAR_W, backgroundColor: ACCENT, padding: "26 16", minHeight: "100%" },
    sbName:     { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#fff", lineHeight: 1.2 },
    sbTitle:    { fontSize: 9.5, fontFamily: "Helvetica-Oblique", color: "#b0c4de", marginTop: 4, lineHeight: 1.5 },
    sbDivider:  { height: 1, backgroundColor: "#3a5a8a", marginTop: 14, marginBottom: 10 },
    sbSHead:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#7ba7d8", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 },
    sbItem:     { fontSize: 9, fontFamily: "Helvetica", color: "#cdd8e8", lineHeight: 1.6, marginBottom: 2 },
    sbLabel:    { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#7ba7d8" },
    sbSkCat:    { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#cdd8e8", marginTop: 6 },
    sbSkVal:    { fontSize: 9, fontFamily: "Helvetica", color: "#a0b8d4", lineHeight: 1.5, marginTop: 1 },
    sbLnk:      { color: "#7ba7d8", textDecoration: "underline", fontSize: 9 },
    // Main
    main:       { flex: 1, padding: "22 20 22 18", backgroundColor: "#fff" },
    mSHead:     { fontSize: 10, fontFamily: "Helvetica-Bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 12, marginBottom: 2 },
    mSLine:     { height: 1.5, backgroundColor: ACCENT2, marginBottom: 6 },
    mSummary:   { fontSize: 9.5, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.65, textAlign: "justify" },
    mEntryRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 7 },
    mRole:      { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827", flex: 1 },
    mDate:      { fontSize: 9, fontFamily: "Helvetica-Oblique", color: "#6b7280", flexShrink: 0, paddingLeft: 4 },
    mCompany:   { fontSize: 9.5, fontFamily: "Helvetica-Oblique", color: ACCENT2, marginTop: 1 },
    mBullet:    { flexDirection: "row", marginTop: 2.5 },
    mBulletDot: { width: 10, fontSize: 9.5, color: ACCENT2 },
    mBulletTxt: { flex: 1, fontSize: 9, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.45 },
    mStack:     { fontSize: 8.5, fontFamily: "Helvetica-Oblique", color: "#6b7280", marginTop: 2 },
    mEduRow:    { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    mEduDeg:    { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#111827", flex: 1 },
    mEduDate:   { fontSize: 9, fontFamily: "Helvetica-Oblique", color: "#6b7280" },
    mEduColl:   { fontSize: 9, fontFamily: "Helvetica", color: "#374151", marginTop: 1 },
    mEduScore:  { fontSize: 8.5, fontFamily: "Helvetica-Oblique", color: "#6b7280", marginTop: 1 },
    mCert:      { fontSize: 9, fontFamily: "Helvetica", color: "#374151", marginTop: 3, lineHeight: 1.4 },
    mProjName:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
    mLnk:       { color: ACCENT2, textDecoration: "underline" },
});

export function ModernCvTemplate({ data }: { data: any }) {
    const exp    = getExpList(data);
    const intern = getInternList(data);
    const proj   = getProjList(data);
    const edu    = getEduList(data);
    const certs  = getCertList(data);
    const skills = getSkillList(data);
    const { linkedin, github, portfolio } = data.header?.links ?? {};

    const MBullet = ({ t }: { t: string }) => (
        <View style={s2.mBullet}>
            <Text style={s2.mBulletDot}>›</Text>
            <Text style={s2.mBulletTxt}>{t}</Text>
        </View>
    );

    const MSection = ({ title }: { title: string }) => (
        <View>
            <Text style={s2.mSHead}>{title}</Text>
            <View style={s2.mSLine} />
        </View>
    );

    const EntryBlock = ({ role, company, duration, points, techStack }: any) => (
        <View wrap={false}>
            <View style={s2.mEntryRow}>
                <Text style={s2.mRole}>{role}</Text>
                <Text style={s2.mDate}>{duration}</Text>
            </View>
            {company ? <Text style={s2.mCompany}>{company}</Text> : null}
            {(points ?? []).map((p: string, i: number) => p ? <MBullet key={i} t={p} /> : null)}
            {techStack ? <Text style={s2.mStack}>Stack: {techStack}</Text> : null}
        </View>
    );

    return (
        <Document>
            <Page size="A4" style={s2.page}>

                {/* ── Left Sidebar ── */}
                <View style={s2.sidebar} fixed>
                    <Text style={s2.sbName}>{data.header?.name}</Text>
                    {data.header?.title ? <Text style={s2.sbTitle}>{data.header.title}</Text> : null}

                    <View style={s2.sbDivider} />
                    <Text style={s2.sbSHead}>Contact</Text>
                    {data.header?.contact ? (
                        data.header.contact.split("|").map((part: string, i: number) => (
                            <Text key={i} style={s2.sbItem}>{part.trim()}</Text>
                        ))
                    ) : null}
                    {linkedin ? <Link src={linkedin} style={s2.sbLnk}>{shortUrl(linkedin)}</Link> : null}
                    {github ? <Link src={github} style={s2.sbLnk}>{shortUrl(github)}</Link> : null}
                    {portfolio ? <Link src={portfolio} style={s2.sbLnk}>{shortUrl(portfolio)}</Link> : null}

                    {skills.length > 0 ? (
                        <View>
                            <View style={s2.sbDivider} />
                            <Text style={s2.sbSHead}>Technical Skills</Text>
                            {skills.map((sk: any, i: number) => (
                                <View key={i} style={{ marginTop: 5 }}>
                                    <Text style={s2.sbSkCat}>{sk.label}</Text>
                                    <Text style={s2.sbSkVal}>{sk.value}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {certs.length > 0 ? (
                        <View>
                            <View style={s2.sbDivider} />
                            <Text style={s2.sbSHead}>Certifications</Text>
                            {certs.map((c: any, i: number) => (
                                <Text key={i} style={{ ...s2.sbItem, marginTop: 4 }}>
                                    {typeof c === "string" ? c : c.name || ""}
                                </Text>
                            ))}
                        </View>
                    ) : null}
                </View>

                {/* ── Right Main ── */}
                <View style={s2.main}>
                    {data.summary?.trim() ? (
                        <View>
                            <MSection title="Professional Profile" />
                            <Text style={s2.mSummary}>{data.summary}</Text>
                        </View>
                    ) : null}

                    {exp.length > 0 ? (
                        <View>
                            <MSection title="Career History" />
                            {exp.map((e: any, i: number) => (
                                <EntryBlock key={i} role={e.role} company={e.company} duration={e.duration} points={e.points} techStack={e.techStack} />
                            ))}
                        </View>
                    ) : null}

                    {intern.length > 0 ? (
                        <View>
                            <MSection title="Internships" />
                            {intern.map((e: any, i: number) => (
                                <EntryBlock key={i} role={e.role} company={e.company} duration={e.duration} points={e.points} techStack={e.techStack} />
                            ))}
                        </View>
                    ) : null}

                    {proj.length > 0 ? (
                        <View>
                            <MSection title="Key Projects" />
                            {proj.map((p: any, i: number) => (
                                <View key={i} style={{ marginTop: i > 0 ? 6 : 0 }} wrap={false}>
                                    <View style={s2.mEntryRow}>
                                        <Text style={s2.mProjName}>
                                            {p.link ? <Link src={p.link} style={s2.mLnk}>{p.name}</Link> : p.name}
                                        </Text>
                                        <Text style={s2.mDate}>{p.duration}</Text>
                                    </View>
                                    {(p.points ?? []).map((pt: string, j: number) => pt ? <MBullet key={j} t={pt} /> : null)}
                                    {p.techStack ? <Text style={s2.mStack}>Stack: {p.techStack}</Text> : null}
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {edu.length > 0 ? (
                        <View>
                            <MSection title="Education" />
                            {edu.map((e: any, i: number) => (
                                <View key={i} wrap={false}>
                                    <View style={s2.mEduRow}>
                                        <Text style={s2.mEduDeg}>{e.degree}</Text>
                                        <Text style={s2.mEduDate}>{e.duration}</Text>
                                    </View>
                                    <Text style={s2.mEduColl}>{e.college}</Text>
                                    {e.score ? <Text style={s2.mEduScore}>{e.score}</Text> : null}
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>

            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — CONTEMPORARY MINIMAL CV
// Accent header band, clean Helvetica, bold role lines, timeline dates.
// ─────────────────────────────────────────────────────────────────────────────

const PRI = "#0f172a";
const ACC = "#6d28d9";

const s3 = StyleSheet.create({
    page:      { padding: 0, backgroundColor: "#fff" },
    // Top band
    band:      { backgroundColor: PRI, padding: "20 28 16 28" },
    bName:     { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: 0.5 },
    bTitle:    { fontSize: 11, fontFamily: "Helvetica", color: "#94a3b8", marginTop: 3 },
    bContact:  { fontSize: 9, fontFamily: "Helvetica", color: "#64748b", marginTop: 6, lineHeight: 1.6 },
    bLinks:    { fontSize: 9, fontFamily: "Helvetica", color: "#7c86a8", marginTop: 2, lineHeight: 1.6 },
    bLnk:      { color: "#818cf8", textDecoration: "underline" },
    // Accent strip
    strip:     { height: 4, backgroundColor: ACC },
    // Body
    body:      { padding: "14 28" },
    // Section header
    sHead:     { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 6 },
    sHeadLine: { width: 3, height: 14, backgroundColor: ACC, marginRight: 7, borderRadius: 2 },
    sHeadText: { fontSize: 11, fontFamily: "Helvetica-Bold", color: PRI, textTransform: "uppercase", letterSpacing: 1 },
    sRule:     { height: 0.5, backgroundColor: "#e2e8f0", marginTop: 3, marginBottom: 4 },
    // Summary
    summary:   { fontSize: 9.5, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.7, textAlign: "justify" },
    // Entry card
    card:      { marginTop: 8, paddingLeft: 10, borderLeft: 2, borderLeftColor: "#e2e8f0" } as any,
    cardRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardRole:  { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: PRI, flex: 1 },
    cardDate:  { fontSize: 9, fontFamily: "Helvetica", color: ACC, backgroundColor: "#ede9fe", paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 } as any,
    cardCo:    { fontSize: 9.5, fontFamily: "Helvetica-Oblique", color: "#6b7280", marginTop: 2 },
    bullet:    { flexDirection: "row", marginTop: 3 },
    bulletDot: { width: 10, fontSize: 9, color: ACC },
    bulletTxt: { flex: 1, fontSize: 9, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.45 },
    stack:     { fontSize: 8.5, fontFamily: "Helvetica", color: "#9ca3af", marginTop: 2 },
    // Skills
    skillRow:  { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 } as any,
    skillTag:  { fontSize: 8.5, fontFamily: "Helvetica", color: "#374151", backgroundColor: "#f1f5f9", paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 4, marginBottom: 3 } as any,
    skillCat:  { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#374151", marginTop: 5, marginBottom: 1 },
    // Edu
    eduBlock:  { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingLeft: 10, borderLeft: 2, borderLeftColor: "#e2e8f0" } as any,
    eduLeft:   { flex: 1 },
    eduDeg:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: PRI },
    eduColl:   { fontSize: 9, fontFamily: "Helvetica", color: "#6b7280", marginTop: 1 },
    eduScore:  { fontSize: 8.5, fontFamily: "Helvetica-Oblique", color: "#9ca3af", marginTop: 1 },
    eduDate:   { fontSize: 9, fontFamily: "Helvetica", color: ACC },
    // Cert
    certItem:  { fontSize: 9, fontFamily: "Helvetica", color: "#374151", marginTop: 4, lineHeight: 1.4 },
    certBullet:{ color: ACC, marginRight: 4 },
    lnk:       { color: "#818cf8", textDecoration: "underline" },
});

export function MinimalCvTemplate({ data }: { data: any }) {
    const exp    = getExpList(data);
    const intern = getInternList(data);
    const proj   = getProjList(data);
    const edu    = getEduList(data);
    const certs  = getCertList(data);
    const skills = getSkillList(data);
    const { linkedin, github, portfolio } = data.header?.links ?? {};

    const Bullet = ({ t }: { t: string }) => (
        <View style={s3.bullet}>
            <Text style={s3.bulletDot}>•</Text>
            <Text style={s3.bulletTxt}>{t}</Text>
        </View>
    );

    const Section = ({ title }: { title: string }) => (
        <View style={s3.sHead}>
            <View style={s3.sHeadLine} />
            <Text style={s3.sHeadText}>{title}</Text>
        </View>
    );

    const EntryCard = ({ role, company, duration, points, techStack }: any) => (
        <View style={s3.card} wrap={false}>
            <View style={s3.cardRow}>
                <Text style={s3.cardRole}>{role}</Text>
                {duration ? <Text style={s3.cardDate}>{duration}</Text> : null}
            </View>
            {company ? <Text style={s3.cardCo}>{company}</Text> : null}
            {(points ?? []).map((p: string, i: number) => p ? <Bullet key={i} t={p} /> : null)}
            {techStack ? <Text style={s3.stack}>Stack: {techStack}</Text> : null}
        </View>
    );

    return (
        <Document>
            <Page size="A4" style={s3.page}>

                {/* ── Top band ── */}
                <View style={s3.band}>
                    <Text style={s3.bName}>{data.header?.name}</Text>
                    {data.header?.title ? <Text style={s3.bTitle}>{data.header.title}</Text> : null}
                    {data.header?.contact ? <Text style={s3.bContact}>{data.header.contact}</Text> : null}
                    {(linkedin || github || portfolio) ? (
                        <Text style={s3.bLinks}>
                            {linkedin ? <Link src={linkedin} style={s3.bLnk}>{shortUrl(linkedin)}</Link> : null}
                            {linkedin && github ? <Text>  ·  </Text> : null}
                            {github ? <Link src={github} style={s3.bLnk}>{shortUrl(github)}</Link> : null}
                            {(linkedin || github) && portfolio ? <Text>  ·  </Text> : null}
                            {portfolio ? <Link src={portfolio} style={s3.bLnk}>{shortUrl(portfolio)}</Link> : null}
                        </Text>
                    ) : null}
                </View>
                <View style={s3.strip} />

                <View style={s3.body}>

                    {/* ── Profile ── */}
                    {data.summary?.trim() ? (
                        <View>
                            <Section title="Professional Profile" />
                            <Text style={s3.summary}>{data.summary}</Text>
                        </View>
                    ) : null}

                    {/* ── Career History ── */}
                    {exp.length > 0 ? (
                        <View>
                            <Section title="Career History" />
                            {exp.map((e: any, i: number) => (
                                <EntryCard key={i} role={e.role} company={e.company} duration={e.duration} points={e.points} techStack={e.techStack} />
                            ))}
                        </View>
                    ) : null}

                    {/* ── Internships ── */}
                    {intern.length > 0 ? (
                        <View>
                            <Section title="Internships" />
                            {intern.map((e: any, i: number) => (
                                <EntryCard key={i} role={e.role} company={e.company} duration={e.duration} points={e.points} techStack={e.techStack} />
                            ))}
                        </View>
                    ) : null}

                    {/* ── Projects ── */}
                    {proj.length > 0 ? (
                        <View>
                            <Section title="Featured Projects" />
                            {proj.map((p: any, i: number) => (
                                <View key={i} style={s3.card} wrap={false}>
                                    <View style={s3.cardRow}>
                                        <Text style={s3.cardRole}>
                                            {p.link ? <Link src={p.link} style={s3.lnk}>{p.name}</Link> : p.name}
                                            {p.role ? <Text style={{ ...s3.cardCo }}> · {p.role}</Text> : null}
                                        </Text>
                                        {p.duration ? <Text style={s3.cardDate}>{p.duration}</Text> : null}
                                    </View>
                                    {(p.points ?? []).map((pt: string, j: number) => pt ? <Bullet key={j} t={pt} /> : null)}
                                    {p.techStack ? <Text style={s3.stack}>Stack: {p.techStack}</Text> : null}
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {/* ── Skills ── */}
                    {skills.length > 0 ? (
                        <View>
                            <Section title="Technical Expertise" />
                            {skills.map((sk: any, i: number) => (
                                <View key={i}>
                                    <Text style={s3.skillCat}>{sk.label}</Text>
                                    <View style={s3.skillRow}>
                                        {(sk.value || "").split(",").map((v: string, j: number) => v.trim() ? (
                                            <Text key={j} style={s3.skillTag}>{v.trim()}</Text>
                                        ) : null)}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {/* ── Education ── */}
                    {edu.length > 0 ? (
                        <View>
                            <Section title="Education" />
                            {edu.map((e: any, i: number) => (
                                <View key={i} style={s3.eduBlock} wrap={false}>
                                    <View style={s3.eduLeft}>
                                        <Text style={s3.eduDeg}>{e.degree}</Text>
                                        <Text style={s3.eduColl}>{e.college}</Text>
                                        {e.score ? <Text style={s3.eduScore}>{e.score}</Text> : null}
                                    </View>
                                    <Text style={s3.eduDate}>{e.duration}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {/* ── Certifications ── */}
                    {certs.length > 0 ? (
                        <View>
                            <Section title="Certifications" />
                            {certs.map((c: any, i: number) => (
                                <Text key={i} style={s3.certItem}>
                                    <Text style={s3.certBullet}>◆  </Text>
                                    {typeof c === "string" ? c : [c.name, c.issuer, c.date].filter(Boolean).join(" — ")}
                                </Text>
                            ))}
                        </View>
                    ) : null}

                </View>
            </Page>
        </Document>
    );
}

// ─── Template registry ────────────────────────────────────────────────────────

export const CV_TEMPLATES = [
    {
        id:          "classic",
        name:        "Formal",
        description: "Traditional Times serif — centered header, two-column competencies",
        component:   ClassicCvTemplate,
    },
    {
        id:          "modern",
        name:        "Executive",
        description: "Navy sidebar with skills + white main column — two-column CV layout",
        component:   ModernCvTemplate,
    },
    {
        id:          "minimal",
        name:        "Contemporary",
        description: "Dark header band, tag-style skills, purple accents — modern clean CV",
        component:   MinimalCvTemplate,
    },
] as const;

export type CvTemplateId = "classic" | "modern" | "minimal";
