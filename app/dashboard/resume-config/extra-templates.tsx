/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ComponentType, ReactNode } from "react";
import {
    getCareerSupplementalSections,
    getProfileSupplementalSections,
    renderSupplementalSections,
    type ResumeSupplementalSection,
} from "./resume-sections";

type ResumeData = any;
type TemplateMode = "band" | "left-rail" | "right-rail" | "boxed" | "compact";
type HeaderLink = { label: string; url: string };

export type ExtraTemplateId =
    | "pulse-red"
    | "skyline-blue"
    | "copper-exec"
    | "column-mint"
    | "midnight-rail"
    | "amber-rail"
    | "briefing-slate"
    | "signal-indigo"
    | "vector-green"
    | "atlas-grid"
    | "quartz-frame"
    | "summit-panels"
    | "mono-ats-plus"
    | "ledger-ats"
    | "precision-ats"
    | "harbor-profile"
    | "zenith-stack"
    | "cobalt-timeline"
    | "sage-brief"
    | "linen-column"
    | "sterling-chronicle"
    | "vertex-hybrid"
    | "opal-direct"
    | "summit-signal"
    | "civic-outline"
    | "atlas-brief"
    | "northstar-ledger"
    | "meridian-profile"
    | "forged-ats"
    | "clarity-grid"
    | "quorum-compact"
    | "elevate-column"
    | "horizon-split"
    | "anchor-clean"
    | "pinnacle-flow";

export interface ExtraTemplateInfo {
    id: ExtraTemplateId;
    name: string;
    description: string;
    accent: string;
    bg: string;
    component: ComponentType<{ data: any }>;
    thumb: ReactNode;
    premium: boolean;
}

interface TemplateSpec {
    id: ExtraTemplateId;
    name: string;
    description: string;
    accent: string;
    bg: string;
    premium: boolean;
    mode: TemplateMode;
    pageBg: string;
    text: string;
    muted: string;
    panelBg?: string;
    panelText?: string;
    panelMuted?: string;
    serif?: boolean;
    summaryCard?: boolean;
    summarySide?: boolean;
}

function getHeaderLinks(data: ResumeData): HeaderLink[] {
    return [
        data?.header?.links?.linkedin ? { label: "LinkedIn", url: data.header.links.linkedin } : null,
        data?.header?.links?.github ? { label: "GitHub", url: data.header.links.github } : null,
        data?.header?.links?.portfolio ? { label: "Portfolio", url: data.header.links.portfolio } : null,
    ].filter((item): item is HeaderLink => Boolean(item));
}

function hasItems(value: unknown): value is any[] {
    return Array.isArray(value) && value.length > 0;
}

function getEduList(data: ResumeData): Array<{ college: string; degree: string; duration: string }> {
    if (Array.isArray(data?.education)) {
        return (data.education as any[]).filter((e: any) => e?.college || e?.degree);
    }
    const ed = data?.education as any;
    return (ed?.college || ed?.degree) ? [ed] : [];
}

function hasEducation(data: ResumeData) {
    return getEduList(data).length > 0;
}

function InlineLinks({ links, linkStyle, separator = " | " }: { links: HeaderLink[]; linkStyle: any; separator?: string }) {
    return (
        <>
            {links.map((link, index) => (
                <Text key={link.label}>
                    {index > 0 ? separator : ""}
                    <Link src={link.url} style={linkStyle}>{link.label}</Link>
                </Text>
            ))}
        </>
    );
}

function LinkList({ links, textStyle, linkStyle }: { links: HeaderLink[]; textStyle: any; linkStyle: any }) {
    if (links.length === 0) return null;
    return (
        <View>
            {links.map((link) => (
                <Text key={link.label} style={textStyle}>
                    {link.label}: <Link src={link.url} style={linkStyle}>{link.url}</Link>
                </Text>
            ))}
        </View>
    );
}

function createThumb(layout: TemplateMode, accent: string, bg: string, panel = accent) {
    if (layout === "band") {
        return (
            <div className="w-full h-full flex flex-col" style={{ backgroundColor: bg }}>
                <div className="h-2 w-full" style={{ backgroundColor: accent }} />
                <div className="px-2 pt-2 flex flex-col gap-0.5">
                    <div className="h-2 w-20 rounded-sm" style={{ backgroundColor: accent }} />
                    <div className="h-1 w-24 rounded-sm bg-gray-400" />
                    <div className="h-1 w-full rounded-sm bg-gray-200" />
                    <div className="h-5 rounded-md mt-1" style={{ backgroundColor: `${accent}18` }} />
                    <div className="h-1 w-12 rounded-sm mt-1" style={{ backgroundColor: accent }} />
                    <div className="h-px w-full bg-gray-200" />
                    <div className="h-1 w-full rounded-sm bg-gray-300" />
                </div>
            </div>
        );
    }

    if (layout === "left-rail") {
        return (
            <div className="w-full h-full flex" style={{ backgroundColor: bg }}>
                <div className="w-[34%] px-1.5 py-2 flex flex-col gap-0.5" style={{ backgroundColor: panel }}>
                    <div className="h-2 w-10 rounded-sm bg-white/85" />
                    <div className="h-1 w-12 rounded-sm bg-white/55" />
                    <div className="h-px w-full bg-white/25 mt-1" />
                    <div className="h-1 w-full rounded-sm bg-white/25" />
                </div>
                <div className="flex-1 px-1.5 py-2 flex flex-col gap-0.5 bg-white">
                    <div className="h-1 w-14 rounded-sm" style={{ backgroundColor: accent }} />
                    <div className="h-px w-full" style={{ backgroundColor: `${accent}33` }} />
                    <div className="h-1 w-full rounded-sm bg-gray-300" />
                    <div className="h-1 w-4/5 rounded-sm bg-gray-300" />
                </div>
            </div>
        );
    }

    if (layout === "right-rail") {
        return (
            <div className="w-full h-full flex" style={{ backgroundColor: bg }}>
                <div className="flex-1 px-1.5 py-2 flex flex-col gap-0.5 bg-white">
                    <div className="h-2 w-16 rounded-sm bg-gray-900" />
                    <div className="h-1 w-20 rounded-sm" style={{ backgroundColor: accent }} />
                    <div className="h-px w-full" style={{ backgroundColor: `${accent}33` }} />
                    <div className="h-5 rounded-md mt-1" style={{ backgroundColor: `${accent}18` }} />
                </div>
                <div className="w-[33%] px-1.5 py-2 flex flex-col gap-0.5" style={{ backgroundColor: panel }}>
                    <div className="h-1 w-10 rounded-sm bg-white/85" />
                    <div className="h-px w-full bg-white/25" />
                    <div className="h-1 w-full rounded-sm bg-white/30" />
                </div>
            </div>
        );
    }

    if (layout === "boxed") {
        return (
            <div className="w-full h-full px-2 py-2 flex flex-col gap-1" style={{ backgroundColor: bg }}>
                <div className="h-2 w-18 rounded-sm bg-gray-900" />
                <div className="h-1 w-24 rounded-sm" style={{ backgroundColor: accent }} />
                <div className="h-5 rounded-md" style={{ backgroundColor: `${accent}16` }} />
                <div className="rounded-md border p-1" style={{ borderColor: `${accent}40`, backgroundColor: "#fff" }}>
                    <div className="h-1 w-10 rounded-sm" style={{ backgroundColor: accent }} />
                    <div className="h-1 w-full rounded-sm bg-gray-300 mt-1" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full px-2 py-2 flex flex-col gap-0.5 bg-white">
            <div className="flex flex-col gap-0.5">
                <div className="h-2 w-16 rounded-sm bg-gray-950" />
                <div className="h-1 w-20 rounded-sm" style={{ backgroundColor: accent }} />
                <div className="h-1 w-24 rounded-sm bg-gray-300" />
            </div>
            <div className="h-px w-full mt-0.5" style={{ backgroundColor: accent }} />
            <div className="h-1 w-10 rounded-sm mt-0.5" style={{ backgroundColor: accent }} />
            <div className="h-1 w-full rounded-sm bg-gray-300" />
            <div className="h-1 w-full rounded-sm bg-gray-300" />
        </div>
    );
}

function createTemplate(spec: TemplateSpec): ComponentType<{ data: any }> {
    const titleFont = spec.serif ? "Times-Bold" : "Helvetica-Bold";
    const bodyFont = spec.serif ? "Times-Roman" : "Helvetica";
    const metaFont = spec.serif ? "Times-Italic" : "Helvetica-Oblique";
    const sideBg = spec.panelBg || spec.accent;
    const sideText = spec.panelText || "#ffffff";
    const sideMuted = spec.panelMuted || "#e5e7eb";
    const soft = `${spec.accent}20`;

    const styles = StyleSheet.create({
        page: { backgroundColor: spec.pageBg, padding: 0 },
        topBar: { height: 10, backgroundColor: spec.accent },
        wrap: { padding: "20 24 20 24" },
        headerCard: { backgroundColor: spec.mode === "band" ? soft : "transparent", borderRadius: 6, padding: spec.mode === "band" ? "12 14 10 14" : 0 },
        name: { fontSize: spec.mode === "compact" ? 20 : 22, fontFamily: titleFont, color: spec.text },
        title: { fontSize: 10.5, fontFamily: bodyFont, color: spec.accent, marginTop: 3 },
        contact: { fontSize: 9.0, fontFamily: bodyFont, color: spec.muted, marginTop: 4, lineHeight: 1.5 },
        link: { color: spec.accent, textDecoration: "underline" },
        sectionTitle: { fontSize: 10, fontFamily: titleFont, color: spec.accent, textTransform: "uppercase", letterSpacing: 0.9, marginTop: 10 },
        sectionLine: { height: 0.75, backgroundColor: spec.accent, marginTop: 2, marginBottom: 5 },
        body: { fontSize: spec.mode === "compact" ? 9.0 : 9.5, fontFamily: bodyFont, color: spec.text, lineHeight: 1.5 },
        strong: { fontSize: spec.mode === "compact" ? 9.2 : 9.7, fontFamily: titleFont, color: spec.text },
        meta: { fontSize: 8.5, fontFamily: metaFont, color: spec.muted },
        row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4 },
        bulletRow: { flexDirection: "row", marginTop: spec.mode === "compact" ? 2 : 2.5 },
        bullet: { width: 10, fontSize: spec.mode === "compact" ? 9.0 : 9.2, fontFamily: titleFont, color: spec.accent },
        bulletText: { flex: 1, fontSize: spec.mode === "compact" ? 9.0 : 9.4, fontFamily: bodyFont, color: spec.text, lineHeight: 1.45 },
        stack: { fontSize: 8.5, fontFamily: metaFont, color: spec.muted, marginTop: 2 },
        summary: { backgroundColor: spec.summaryCard ? soft : "transparent", borderLeftWidth: spec.summaryCard ? 3 : 0, borderLeftColor: spec.accent, borderRadius: 4, padding: spec.summaryCard ? "8 10 8 10" : "2 0 2 0", marginTop: 2 },
        shell: { flexDirection: "row" },
        rail: { width: "33%", backgroundColor: sideBg, padding: "20 14 20 16" },
        railTitle: { fontSize: 9.3, fontFamily: titleFont, color: sideText, textTransform: "uppercase", letterSpacing: 0.9, marginTop: 10 },
        railLine: { height: 0.75, backgroundColor: "rgba(255,255,255,0.45)", marginTop: 2, marginBottom: 5 },
        railName: { fontSize: 19, fontFamily: titleFont, color: sideText },
        railRole: { fontSize: 9.5, fontFamily: bodyFont, color: sideMuted, marginTop: 3, lineHeight: 1.4 },
        railBody: { fontSize: 9.0, fontFamily: bodyFont, color: sideText, lineHeight: 1.45 },
        railLabel: { fontSize: 9.1, fontFamily: titleFont, color: sideText },
        railLinkText: { fontSize: 8.4, fontFamily: bodyFont, color: sideMuted, lineHeight: 1.4, marginTop: 2 },
        railLink: { color: sideText, textDecoration: "underline" },
        main: { flex: 1, padding: spec.mode === "left-rail" ? "20 20 20 18" : "20 20 20 20", backgroundColor: spec.pageBg },
        box: { marginTop: 9, borderWidth: 1, borderColor: `${spec.accent}55`, borderRadius: 6, backgroundColor: "#fff", padding: "10 12 10 12" },
        tag: { alignSelf: "flex-start", backgroundColor: `${spec.accent}25`, color: spec.accent, fontSize: 9.0, fontFamily: titleFont, textTransform: "uppercase", letterSpacing: 0.7, padding: "3 8 3 8", borderRadius: 999, marginBottom: 7 },
        compactHeader: { flexDirection: "column" },
        compactRule: { height: 1.1, backgroundColor: spec.accent, marginTop: 7, marginBottom: 6 },
    });

    return function Template({ data }: { data: any }) {
        const links = getHeaderLinks(data);
        const railSummary = !!data.summary?.trim() && <Text style={styles.railBody}>{data.summary}</Text>;
        const careerSections: ResumeSupplementalSection[] = getCareerSupplementalSections(data);
        const profileSections: ResumeSupplementalSection[] = getProfileSupplementalSections(data);
        const skills = hasItems(data.skills) && data.skills.map((skill: any, i: number) => (
            <Text key={i} style={spec.mode === "left-rail" || spec.mode === "right-rail" ? styles.railBody : styles.body}>
                <Text style={spec.mode === "left-rail" || spec.mode === "right-rail" ? styles.railLabel : styles.strong}>{skill.label}: </Text>
                {skill.value}
            </Text>
        ));
        const eduList = getEduList(data);
        const isRail = spec.mode === "left-rail" || spec.mode === "right-rail";
        const education = eduList.length > 0 && (
            <View>
                {eduList.map((edu: any, i: number) => (
                    <View key={i} style={{ marginTop: i > 0 ? 6 : 0 }} wrap={false}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={isRail ? styles.railLabel : styles.strong}>{edu.college}</Text>
                                <Text style={isRail ? styles.railBody : styles.body}>{edu.degree}</Text>
                            </View>
                            {!isRail && <Text style={[styles.meta, { flexShrink: 0, marginLeft: 8 }]}>{edu.duration}</Text>}
                        </View>
                        {isRail && <Text style={styles.railBody}>{edu.duration}</Text>}
                        {edu.score ? <Text style={styles.meta}>{edu.score}</Text> : null}
                    </View>
                ))}
            </View>
        );

        const mainSection = (label: string, content: ReactNode) => {
            if (!content) return null;
            if (spec.mode === "boxed") return <View style={styles.box}><Text style={styles.tag}>{label}</Text>{content}</View>;
            return <><Text style={styles.sectionTitle}>{label}</Text><View style={styles.sectionLine} />{content}</>;
        };

        const sideSection = (label: string, content: ReactNode) => {
            if (!content) return null;
            return <><Text style={styles.railTitle}>{label}</Text><View style={styles.railLine} />{content}</>;
        };

        // Summary with proper section heading for ATS — defined after mainSection
        const summarySection = data.summary?.trim()
            ? mainSection("Summary", <View style={styles.summary}><Text style={styles.body}>{data.summary}</Text></View>)
            : null;

        const renderItems = (label: string, items: any[], leftKey: "role" | "name", rightKey: "company" | "role") => {
            if (!hasItems(items)) return null;
            return mainSection(label, (
                <>
                    {items.map((item: any, index: number) => {
                        const left = item[leftKey] || "";
                        const right = item[rightKey] || "";
                        const title = left && right ? `${left} | ${right}` : left || right;
                        return (
                        <View key={`${label}-${index}`} style={{ marginTop: index > 0 ? 8 : 0 }} wrap={false}>
                            <View style={styles.row}>
                                <Text style={[styles.strong, { flex: 1 }]}>{title}</Text>
                                <Text style={[styles.meta, { flexShrink: 0, marginLeft: 8 }]}>{item.duration || ""}</Text>
                            </View>
                            {item.points?.map((point: string, pointIndex: number) => point ? (
                                <View key={pointIndex} style={styles.bulletRow}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{point}</Text>
                                </View>
                            ) : null)}
                            {item.techStack ? <Text style={styles.stack}>{item.techStack}</Text> : null}
                        </View>
                        );
                    })}
                </>
            ));
        };

        const renderSupplementalMainSections = (sections: ResumeSupplementalSection[]) => renderSupplementalSections({
            sections,
            heading: (title, _key) => (
                spec.mode === "boxed"
                    ? <Text style={styles.tag}>{title}</Text>
                    : <><Text style={styles.sectionTitle}>{title}</Text><View style={styles.sectionLine} /></>
            ),
            bullet: (item, key) => (
                <View key={key} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                </View>
            ),
            rowStyle: styles.row,
            titleStyle: styles.strong,
            subtitleStyle: styles.meta,
            durationStyle: styles.meta,
            detailStyle: styles.stack,
            sectionStyle: spec.mode === "boxed" ? styles.box : undefined,
            getEntryStyle: (index) => ({ marginTop: index > 0 ? 8 : 0 }),
            subtitlePlacement: spec.mode === "left-rail" || spec.mode === "right-rail" ? "below" : "inline",
        });

        if (spec.mode === "band") {
            return (
                <Document>
                    <Page size="A4" style={styles.page}>
                        <View style={styles.topBar} />
                        <View style={styles.wrap}>
                            <View style={styles.headerCard}>
                                <Text style={styles.name}>{data.header?.name}</Text>
                                <Text style={styles.title}>{data.header?.title}</Text>
                                <Text style={styles.contact}>
                                    {data.header?.contact}
                                    {links.length > 0 && <Text>{" | "}<InlineLinks links={links} linkStyle={styles.link} /></Text>}
                                </Text>
                            </View>
                            {summarySection}
                            {mainSection("Skills", skills)}
                            {renderItems("Experience", data.experience, "role", "company")}
                            {renderSupplementalMainSections(careerSections)}
                            {renderItems("Projects", data.projects, "name", "role")}
                            {mainSection("Education", education)}
                            {renderSupplementalMainSections(profileSections)}
                        </View>
                    </Page>
                </Document>
            );
        }

        if (spec.mode === "left-rail") {
            return (
                <Document>
                    <Page size="A4" style={styles.page}>
                        <View style={styles.shell}>
                            <View style={styles.rail}>
                                <Text style={styles.railName}>{data.header?.name}</Text>
                                <Text style={styles.railRole}>{data.header?.title}</Text>
                                <Text style={styles.railBody}>{data.header?.contact}</Text>
                                <LinkList links={links} textStyle={styles.railLinkText} linkStyle={styles.railLink} />
                                {spec.summarySide && sideSection("Summary", railSummary)}
                                {sideSection("Skills", skills)}
                                {sideSection("Education", education)}
                            </View>
                            <View style={styles.main}>
                                {!spec.summarySide && summarySection}
                                {renderItems("Experience", data.experience, "role", "company")}
                                {renderSupplementalMainSections(careerSections)}
                                {renderItems("Projects", data.projects, "name", "role")}
                                {renderSupplementalMainSections(profileSections)}
                            </View>
                        </View>
                    </Page>
                </Document>
            );
        }

        if (spec.mode === "right-rail") {
            return (
                <Document>
                    <Page size="A4" style={styles.page}>
                        <View style={styles.shell}>
                            <View style={styles.main}>
                                <Text style={styles.name}>{data.header?.name}</Text>
                                <Text style={styles.title}>{data.header?.title}</Text>
                                <Text style={styles.contact}>{data.header?.contact}</Text>
                                {summarySection}
                                {renderItems("Experience", data.experience, "role", "company")}
                                {renderSupplementalMainSections(careerSections)}
                                {renderItems("Projects", data.projects, "name", "role")}
                                {renderSupplementalMainSections(profileSections)}
                            </View>
                            <View style={styles.rail}>
                                {sideSection("Links", links.length > 0 ? <LinkList links={links} textStyle={styles.railLinkText} linkStyle={styles.railLink} /> : null)}
                                {sideSection("Skills", skills)}
                                {sideSection("Education", education)}
                            </View>
                        </View>
                    </Page>
                </Document>
            );
        }

        if (spec.mode === "boxed") {
            return (
                <Document>
                    <Page size="A4" style={styles.page}>
                        <View style={styles.wrap}>
                            <Text style={styles.name}>{data.header?.name}</Text>
                            <Text style={styles.title}>{data.header?.title}</Text>
                            <Text style={styles.contact}>
                                {data.header?.contact}
                                {links.length > 0 && <Text>{" | "}<InlineLinks links={links} linkStyle={styles.link} /></Text>}
                            </Text>
                            {summarySection}
                            {mainSection("Skills", skills)}
                            {renderItems("Experience", data.experience, "role", "company")}
                            {renderSupplementalMainSections(careerSections)}
                            {renderItems("Projects", data.projects, "name", "role")}
                            {mainSection("Education", education)}
                            {renderSupplementalMainSections(profileSections)}
                        </View>
                    </Page>
                </Document>
            );
        }

        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.wrap}>
                        <View style={styles.compactHeader}>
                            <Text style={styles.name}>{data.header?.name}</Text>
                            <Text style={styles.title}>{data.header?.title}</Text>
                            <Text style={styles.contact}>{data.header?.contact}</Text>
                            {links.length > 0 && <Text style={styles.contact}><InlineLinks links={links} linkStyle={styles.link} /></Text>}
                        </View>
                        <View style={styles.compactRule} />
                        {summarySection}
                        {mainSection("Skills", skills)}
                        {renderItems("Experience", data.experience, "role", "company")}
                        {renderSupplementalMainSections(careerSections)}
                        {renderItems("Projects", data.projects, "name", "role")}
                        {mainSection("Education", education)}
                        {renderSupplementalMainSections(profileSections)}
                    </View>
                </Page>
            </Document>
        );
    };
}

const EXTRA_TEMPLATE_SPECS: TemplateSpec[] = [
    { id: "pulse-red", name: "Pulse Red", description: "Strong band header, impact-first, ATS-safe", accent: "#dc2626", bg: "#fff1f2", pageBg: "#fff7f7", text: "#1f2937", muted: "#6b7280", mode: "band", summaryCard: true, premium: true },
    { id: "skyline-blue", name: "Skyline Blue", description: "Crisp top band with fast recruiter scan", accent: "#0284c7", bg: "#f0f9ff", pageBg: "#ffffff", text: "#0f172a", muted: "#64748b", mode: "band", premium: true },
    { id: "copper-exec", name: "Copper Exec", description: "Warm serif band with executive ATS flow", accent: "#b45309", bg: "#fffbeb", pageBg: "#ffffff", text: "#292524", muted: "#78716c", mode: "band", serif: true, summaryCard: true, premium: true },
    { id: "column-mint", name: "Column Mint", description: "Mint sidebar, skills-first and ATS-safe", accent: "#0f766e", bg: "#f0fdfa", pageBg: "#f8fffd", text: "#134e4a", muted: "#0f766e", mode: "left-rail", panelBg: "#115e59", panelText: "#f0fdfa", panelMuted: "#ccfbf1", summarySide: true, premium: true },
    { id: "midnight-rail", name: "Midnight Rail", description: "Dark rail with strong hierarchy and clarity", accent: "#2563eb", bg: "#eff6ff", pageBg: "#ffffff", text: "#111827", muted: "#64748b", mode: "left-rail", panelBg: "#0f172a", panelText: "#f8fafc", panelMuted: "#cbd5e1", premium: true },
    { id: "amber-rail", name: "Amber Rail", description: "Warm leadership layout that stays parsable", accent: "#d97706", bg: "#fffbeb", pageBg: "#fffbeb", text: "#451a03", muted: "#92400e", mode: "left-rail", panelBg: "#78350f", panelText: "#fff7ed", panelMuted: "#fed7aa", serif: true, summarySide: true, premium: true },
    { id: "briefing-slate", name: "Briefing Slate", description: "Right-side briefing panel, clean ATS rhythm", accent: "#475569", bg: "#f8fafc", pageBg: "#ffffff", text: "#0f172a", muted: "#64748b", mode: "right-rail", panelBg: "#334155", panelText: "#f8fafc", panelMuted: "#cbd5e1", premium: true },
    { id: "signal-indigo", name: "Signal Indigo", description: "Indigo panel with summary-led ATS structure", accent: "#4f46e5", bg: "#eef2ff", pageBg: "#ffffff", text: "#111827", muted: "#6b7280", mode: "right-rail", panelBg: "#312e81", panelText: "#eef2ff", panelMuted: "#c7d2fe", summaryCard: true, premium: true },
    { id: "vector-green", name: "Vector Green", description: "Green rail tuned for concise technical resumes", accent: "#15803d", bg: "#ecfdf5", pageBg: "#ffffff", text: "#14532d", muted: "#4b5563", mode: "right-rail", panelBg: "#bbf7d0", panelText: "#14532d", panelMuted: "#166534", summaryCard: true, premium: true },
    { id: "atlas-grid", name: "Atlas Grid", description: "Boxed sections with structured ATS grouping", accent: "#2563eb", bg: "#eff6ff", pageBg: "#ffffff", text: "#111827", muted: "#64748b", mode: "boxed", summaryCard: true, premium: true },
    { id: "quartz-frame", name: "Quartz Frame", description: "Subtle frames with calm, easy parsing", accent: "#52525b", bg: "#fafafa", pageBg: "#ffffff", text: "#18181b", muted: "#71717a", mode: "boxed", premium: true },
    { id: "summit-panels", name: "Summit Panels", description: "Panel cards for impact-focused achievements", accent: "#047857", bg: "#ecfdf5", pageBg: "#ffffff", text: "#064e3b", muted: "#6b7280", mode: "boxed", summaryCard: true, premium: true },
    { id: "mono-ats-plus", name: "Mono ATS Plus", description: "Monochrome density for maximum ATS readability", accent: "#111827", bg: "#f9fafb", pageBg: "#ffffff", text: "#111827", muted: "#4b5563", mode: "compact", premium: true },
    { id: "ledger-ats", name: "Ledger ATS", description: "Compact ledger lines with scan-first density", accent: "#334155", bg: "#f8fafc", pageBg: "#ffffff", text: "#0f172a", muted: "#475569", mode: "compact", premium: true },
    { id: "precision-ats", name: "Precision ATS", description: "Blue-gray compact layout with tight structure", accent: "#1d4ed8", bg: "#eff6ff", pageBg: "#ffffff", text: "#111827", muted: "#64748b", mode: "compact", premium: true },
    { id: "harbor-profile", name: "Harbor Profile", description: "Split-header inspired ATS profile with polished hierarchy", accent: "#0f766e", bg: "#f0fdfa", pageBg: "#ffffff", text: "#0f172a", muted: "#64748b", mode: "band", summaryCard: true, premium: true },
    { id: "zenith-stack", name: "Zenith Stack", description: "Centered one-page stack designed for ATS clarity", accent: "#4f46e5", bg: "#eef2ff", pageBg: "#ffffff", text: "#111827", muted: "#6b7280", mode: "compact", premium: true },
    { id: "cobalt-timeline", name: "Cobalt Timeline", description: "Chronology-led ATS format with crisp blue scan lines", accent: "#1d4ed8", bg: "#eff6ff", pageBg: "#ffffff", text: "#0f172a", muted: "#64748b", mode: "compact", premium: true },
    { id: "sage-brief", name: "Sage Brief", description: "Summary-first ATS brief with calm spacing", accent: "#15803d", bg: "#f0fdf4", pageBg: "#ffffff", text: "#14532d", muted: "#4b5563", mode: "band", summaryCard: true, premium: true },
    { id: "linen-column", name: "Linen Column", description: "Warm minimal single-column layout for clean parsing", accent: "#a16207", bg: "#fefce8", pageBg: "#ffffff", text: "#292524", muted: "#78716c", mode: "compact", premium: true },
    { id: "sterling-chronicle", name: "Sterling Chronicle", description: "Structured boxed format for chronological ATS scans", accent: "#475569", bg: "#f8fafc", pageBg: "#ffffff", text: "#0f172a", muted: "#64748b", mode: "boxed", premium: true },
    { id: "vertex-hybrid", name: "Vertex Hybrid", description: "Balanced hybrid resume with ATS-safe right rail", accent: "#0f766e", bg: "#ecfeff", pageBg: "#ffffff", text: "#0f172a", muted: "#64748b", mode: "right-rail", panelBg: "#134e4a", panelText: "#ecfeff", panelMuted: "#a7f3d0", summaryCard: true, premium: true },
    { id: "opal-direct", name: "Opal Direct", description: "Direct monochrome-forward ATS format for concise resumes", accent: "#1f2937", bg: "#f9fafb", pageBg: "#ffffff", text: "#111827", muted: "#4b5563", mode: "compact", premium: true },
    { id: "summit-signal", name: "Summit Signal", description: "Leadership-style rail layout with strong ATS readability", accent: "#7c2d12", bg: "#fff7ed", pageBg: "#ffffff", text: "#431407", muted: "#9a3412", mode: "left-rail", panelBg: "#7c2d12", panelText: "#fff7ed", panelMuted: "#fdba74", summarySide: true, premium: true },
    { id: "civic-outline", name: "Civic Outline", description: "Outlined boxed sections for operations and generalist roles", accent: "#334155", bg: "#f8fafc", pageBg: "#ffffff", text: "#0f172a", muted: "#64748b", mode: "boxed", premium: true },
    { id: "atlas-brief", name: "Atlas Brief", description: "Polished ATS brief with centered visual rhythm", accent: "#0ea5e9", bg: "#f0f9ff", pageBg: "#ffffff", text: "#0f172a", muted: "#64748b", mode: "band", summaryCard: true, premium: true },
    { id: "northstar-ledger", name: "Northstar Ledger", description: "Finance-friendly compact ATS format with firm structure", accent: "#4338ca", bg: "#eef2ff", pageBg: "#ffffff", text: "#111827", muted: "#6b7280", mode: "compact", premium: true },
    { id: "meridian-profile", name: "Meridian Profile", description: "Profile-led hybrid layout with ATS-safe support rail", accent: "#0369a1", bg: "#f0f9ff", pageBg: "#ffffff", text: "#0f172a", muted: "#64748b", mode: "right-rail", panelBg: "#0c4a6e", panelText: "#f0f9ff", panelMuted: "#bae6fd", summaryCard: true, premium: true },
    { id: "forged-ats", name: "Forged ATS", description: "Dense monochrome build tuned for high ATS compatibility", accent: "#111827", bg: "#f9fafb", pageBg: "#ffffff", text: "#111827", muted: "#4b5563", mode: "compact", premium: true },
    { id: "clarity-grid", name: "Clarity Grid", description: "Boxed clarity format for fast recruiter and ATS review", accent: "#2563eb", bg: "#eff6ff", pageBg: "#ffffff", text: "#111827", muted: "#64748b", mode: "boxed", summaryCard: true, premium: true },
    { id: "quorum-compact", name: "Quorum Compact", description: "High-signal compact layout for concise ATS targeting", accent: "#be123c", bg: "#fff1f2", pageBg: "#ffffff", text: "#1f2937", muted: "#6b7280", mode: "compact", premium: true },
    { id: "elevate-column", name: "Elevate Column", description: "Skills-forward column layout that stays ATS-safe", accent: "#166534", bg: "#f0fdf4", pageBg: "#ffffff", text: "#14532d", muted: "#4b5563", mode: "left-rail", panelBg: "#14532d", panelText: "#f0fdf4", panelMuted: "#bbf7d0", premium: true },
    { id: "horizon-split", name: "Horizon Split", description: "Executive split-style resume with ATS-friendly flow", accent: "#0f766e", bg: "#f0fdfa", pageBg: "#ffffff", text: "#0f172a", muted: "#64748b", mode: "band", premium: true },
    { id: "anchor-clean", name: "Anchor Clean", description: "Calm boxed structure with steady ATS whitespace", accent: "#4b5563", bg: "#f9fafb", pageBg: "#ffffff", text: "#111827", muted: "#6b7280", mode: "boxed", premium: true },
    { id: "pinnacle-flow", name: "Pinnacle Flow", description: "Executive-friendly ATS flow balancing summary and impact", accent: "#9a3412", bg: "#fff7ed", pageBg: "#ffffff", text: "#431407", muted: "#9a3412", mode: "band", serif: true, summaryCard: true, premium: true },
];

export const EXTRA_TEMPLATES: ExtraTemplateInfo[] = EXTRA_TEMPLATE_SPECS.map((spec) => ({
    ...spec,
    component: createTemplate(spec),
    thumb: createThumb(spec.mode, spec.accent, spec.bg, spec.panelBg || spec.accent),
}));
