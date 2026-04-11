/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ComponentType, ReactNode } from "react";

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
    | "precision-ats";

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

function hasEducation(data: ResumeData) {
    return Boolean(data?.education?.college || data?.education?.degree);
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
        wrap: { padding: "18 22 18 22" },
        headerCard: { backgroundColor: spec.mode === "band" ? soft : "transparent", borderRadius: 6, padding: spec.mode === "band" ? "12 14 10 14" : 0 },
        name: { fontSize: spec.mode === "compact" ? 18 : 20, fontFamily: titleFont, color: spec.text },
        title: { fontSize: 9.5, fontFamily: bodyFont, color: spec.accent, marginTop: 3 },
        contact: { fontSize: 8.8, fontFamily: bodyFont, color: spec.muted, marginTop: 4, lineHeight: 1.45 },
        link: { color: spec.accent, textDecoration: "underline" },
        sectionTitle: { fontSize: 9.6, fontFamily: titleFont, color: spec.accent, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 8 },
        sectionLine: { height: 1, backgroundColor: soft, marginTop: 2, marginBottom: 4 },
        body: { fontSize: spec.mode === "compact" ? 8.7 : 9.2, fontFamily: bodyFont, color: spec.text, lineHeight: 1.45 },
        strong: { fontSize: spec.mode === "compact" ? 8.8 : 9.4, fontFamily: titleFont, color: spec.text },
        meta: { fontSize: 8.2, fontFamily: metaFont, color: spec.muted },
        row: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
        bulletRow: { flexDirection: "row", marginTop: spec.mode === "compact" ? 1.5 : 2 },
        bullet: { width: 10, fontSize: spec.mode === "compact" ? 8.8 : 9, fontFamily: titleFont, color: spec.accent },
        bulletText: { flex: 1, fontSize: spec.mode === "compact" ? 8.7 : 9.1, fontFamily: bodyFont, color: spec.text, lineHeight: 1.4 },
        stack: { fontSize: 8.2, fontFamily: metaFont, color: spec.muted, marginTop: 2 },
        summary: { backgroundColor: spec.summaryCard ? soft : "transparent", borderLeftWidth: spec.summaryCard ? 3 : 0, borderLeftColor: spec.accent, borderRadius: 4, padding: spec.summaryCard ? "8 10 8 10" : 0, marginTop: 4 },
        shell: { flexDirection: "row" },
        rail: { width: "33%", backgroundColor: sideBg, padding: "18 14 18 16" },
        railTitle: { fontSize: 9, fontFamily: titleFont, color: sideText, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 8 },
        railLine: { height: 1, backgroundColor: "rgba(255,255,255,0.22)", marginTop: 2, marginBottom: 4 },
        railName: { fontSize: 18, fontFamily: titleFont, color: sideText },
        railRole: { fontSize: 9, fontFamily: bodyFont, color: sideMuted, marginTop: 3, lineHeight: 1.35 },
        railBody: { fontSize: 8.6, fontFamily: bodyFont, color: sideText, lineHeight: 1.42 },
        railLabel: { fontSize: 8.7, fontFamily: titleFont, color: sideText },
        railLinkText: { fontSize: 8.1, fontFamily: bodyFont, color: sideMuted, lineHeight: 1.35, marginTop: 2 },
        railLink: { color: sideText, textDecoration: "underline" },
        main: { flex: 1, padding: spec.mode === "left-rail" ? "18 20 18 18" : "18 20 18 20", backgroundColor: spec.pageBg },
        box: { marginTop: 8, borderWidth: 1, borderColor: soft, borderRadius: 6, backgroundColor: "#fff", padding: "10 12 10 12" },
        tag: { alignSelf: "flex-start", backgroundColor: soft, color: spec.accent, fontSize: 8.4, fontFamily: titleFont, textTransform: "uppercase", letterSpacing: 0.7, padding: "3 7 3 7", borderRadius: 999, marginBottom: 6 },
        compactHeader: { flexDirection: "column" },
        compactRule: { height: 1.1, backgroundColor: spec.accent, marginTop: 6, marginBottom: 5 },
    });

    return function Template({ data }: { data: any }) {
        const links = getHeaderLinks(data);
        const summary = !!data.summary?.trim() && <View style={styles.summary}><Text style={styles.body}>{data.summary}</Text></View>;
        const railSummary = !!data.summary?.trim() && <Text style={styles.railBody}>{data.summary}</Text>;
        const skills = hasItems(data.skills) && data.skills.map((skill: any, i: number) => (
            <Text key={i} style={spec.mode === "left-rail" || spec.mode === "right-rail" ? styles.railBody : styles.body}>
                <Text style={spec.mode === "left-rail" || spec.mode === "right-rail" ? styles.railLabel : styles.strong}>{skill.label}: </Text>
                {skill.value}
            </Text>
        ));
        const education = hasEducation(data) && (
            <View style={spec.mode === "boxed" ? styles.box : undefined}>
                {spec.mode === "boxed" && <Text style={styles.tag}>Education</Text>}
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={spec.mode === "left-rail" || spec.mode === "right-rail" ? styles.railLabel : styles.strong}>{data.education.college}</Text>
                        <Text style={spec.mode === "left-rail" || spec.mode === "right-rail" ? styles.railBody : styles.body}>{data.education.degree}</Text>
                    </View>
                    {spec.mode !== "left-rail" && spec.mode !== "right-rail" && <Text style={styles.meta}>{data.education.duration}</Text>}
                </View>
                {(spec.mode === "left-rail" || spec.mode === "right-rail") && <Text style={styles.railBody}>{data.education.duration}</Text>}
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

        const renderItems = (label: string, items: any[], leftKey: "role" | "name", rightKey: "company" | "role") => {
            if (!hasItems(items)) return null;
            return mainSection(label, (
                <>
                    {items.map((item: any, index: number) => (
                        <View key={`${label}-${index}`} style={{ marginTop: index > 0 ? 6 : 0 }}>
                            <View style={styles.row}>
                                <Text style={styles.strong}>{item[leftKey]} | {item[rightKey]}</Text>
                                <Text style={styles.meta}>{item.duration}</Text>
                            </View>
                            {item.points?.map((point: string, pointIndex: number) => point && (
                                <View key={pointIndex} style={styles.bulletRow}>
                                    <Text style={styles.bullet}>-</Text>
                                    <Text style={styles.bulletText}>{point}</Text>
                                </View>
                            ))}
                            {item.techStack && <Text style={styles.stack}>Stack: {item.techStack}</Text>}
                        </View>
                    ))}
                </>
            ));
        };

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
                            {summary}
                            {mainSection("Skills", skills)}
                            {renderItems("Experience", data.experience, "role", "company")}
                            {renderItems("Projects", data.projects, "name", "role")}
                            {mainSection("Education", education)}
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
                                {!spec.summarySide && summary}
                                {renderItems("Experience", data.experience, "role", "company")}
                                {renderItems("Projects", data.projects, "name", "role")}
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
                                {summary}
                                {renderItems("Experience", data.experience, "role", "company")}
                                {renderItems("Projects", data.projects, "name", "role")}
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
                            {summary}
                            {mainSection("Skills", skills)}
                            {renderItems("Experience", data.experience, "role", "company")}
                            {renderItems("Projects", data.projects, "name", "role")}
                            {education}
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
                        {summary}
                        {mainSection("Skills", skills)}
                        {renderItems("Experience", data.experience, "role", "company")}
                        {renderItems("Projects", data.projects, "name", "role")}
                        {mainSection("Education", education)}
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
];

export const EXTRA_TEMPLATES: ExtraTemplateInfo[] = EXTRA_TEMPLATE_SPECS.map((spec) => ({
    ...spec,
    component: createTemplate(spec),
    thumb: createThumb(spec.mode, spec.accent, spec.bg, spec.panelBg || spec.accent),
}));
