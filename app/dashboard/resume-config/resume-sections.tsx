import type { ReactNode } from "react";
import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

type LooseRecord = Record<string, unknown>;
type PdfStyle = Style;

export interface ResumeSupplementalEntry {
    title: string;
    subtitle?: string;
    duration?: string;
    points: string[];
    meta?: string;
}

export type ResumeSupplementalSection =
    | { kind: "entries"; title: string; entries: ResumeSupplementalEntry[] }
    | { kind: "bullets"; title: string; items: string[] };

export interface SupplementalRenderOptions {
    sections: ResumeSupplementalSection[];
    heading: (title: string, key: string) => ReactNode;
    bullet: (item: string, key: string) => ReactNode;
    rowStyle: PdfStyle;
    titleStyle: PdfStyle;
    subtitleStyle: PdfStyle;
    durationStyle: PdfStyle;
    detailStyle: PdfStyle;
    sectionStyle?: PdfStyle;
    getEntryStyle?: (index: number) => PdfStyle;
    subtitlePlacement?: "inline" | "below";
    inlineSeparator?: string;
}

function asRecord(value: unknown): LooseRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as LooseRecord;
}

function asText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function joinNonEmpty(parts: string[], separator = " | "): string {
    return parts.filter(Boolean).join(separator);
}

function firstText(record: LooseRecord, keys: string[]): string {
    for (const key of keys) {
        const text = asText(record[key]);
        if (text) return text;
    }

    return "";
}

function normalizeListItem(value: unknown): string {
    if (typeof value === "string") return value.trim();

    const record = asRecord(value);
    if (!record) return "";

    const primary = firstText(record, ["name", "title", "label", "value", "language", "course", "item"]);
    const secondary = firstText(record, ["level", "issuer", "description"]);
    return joinNonEmpty([primary, secondary], " - ");
}

function asTextList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => normalizeListItem(item))
        .filter(Boolean);
}

function firstTextList(record: LooseRecord, keys: string[]): string[] {
    for (const key of keys) {
        const list = asTextList(record[key]);
        if (list.length > 0) return list;

        const single = asText(record[key]);
        if (single) return [single];
    }

    return [];
}

function buildDuration(record: LooseRecord): string {
    const direct = firstText(record, ["duration", "date"]);
    if (direct) return direct;

    const start = firstText(record, ["startDate", "from"]);
    const end = firstText(record, ["endDate", "to"]);
    const current = record.current === true;

    if (!start && !end && !current) return "";
    return joinNonEmpty([start, current ? "Present" : end], " - ");
}

function collectRecordEntries(data: LooseRecord, keys: string[]): LooseRecord[] {
    const collected: LooseRecord[] = [];

    for (const key of keys) {
        const value = data[key];
        if (!Array.isArray(value)) continue;

        for (const item of value) {
            const record = asRecord(item);
            if (record) collected.push(record);
        }
    }

    return collected;
}

function collectStringEntries(data: LooseRecord, keys: string[]): string[] {
    return keys.flatMap((key) => asTextList(data[key]));
}

function normalizeTimelineEntry(record: LooseRecord): ResumeSupplementalEntry | null {
    const title = firstText(record, ["role", "title", "name", "position"]);
    const subtitle = joinNonEmpty(
        [
            firstText(record, ["company", "organization", "institution"]),
            firstText(record, ["location"]),
        ],
        " | ",
    );
    const duration = buildDuration(record);
    const points = firstTextList(record, ["points", "bullets", "highlights", "items"]);
    const meta = joinNonEmpty(
        [
            firstText(record, ["techStack", "technologies", "stack"]),
            firstText(record, ["details", "link", "url"]),
        ],
        " | ",
    );

    if (!title && !subtitle && !duration && points.length === 0 && !meta) return null;

    return {
        title: title || subtitle || "Item",
        subtitle: title ? subtitle : "",
        duration,
        points,
        meta,
    };
}

function normalizeCertificationEntry(record: LooseRecord): ResumeSupplementalEntry | null {
    const title = firstText(record, ["name", "title", "certification", "certificate"]);
    const subtitle = joinNonEmpty(
        [
            firstText(record, ["issuer", "organization", "platform"]),
            firstText(record, ["credentialId"]),
        ],
        " | ",
    );
    const duration = buildDuration(record);
    const points = firstTextList(record, ["points", "details", "highlights"]);
    const meta = firstText(record, ["link", "url"]);

    if (!title && !subtitle && !duration && points.length === 0 && !meta) return null;

    return {
        title: title || "Certification",
        subtitle,
        duration,
        points,
        meta,
    };
}

function entriesSection(title: string, entries: ResumeSupplementalEntry[]): ResumeSupplementalSection | null {
    return entries.length > 0 ? { kind: "entries", title, entries } : null;
}

function bulletsSection(title: string, items: string[]): ResumeSupplementalSection | null {
    return items.length > 0 ? { kind: "bullets", title, items } : null;
}

function customSections(data: LooseRecord): ResumeSupplementalSection[] {
    const value = data.customSections;
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            const record = asRecord(item);
            if (!record) return null;

            const title = firstText(record, ["title", "label", "heading", "name"]);
            const items = firstTextList(record, ["items", "points", "values"]);
            return title && items.length > 0 ? bulletsSection(title, items) : null;
        })
        .filter((section): section is ResumeSupplementalSection => Boolean(section));
}

export function getCareerSupplementalSections(data: unknown): ResumeSupplementalSection[] {
    const record = asRecord(data);
    if (!record) return [];

    const internships = collectRecordEntries(record, ["internships"])
        .map(normalizeTimelineEntry)
        .filter((entry): entry is ResumeSupplementalEntry => Boolean(entry));
    const positions = collectRecordEntries(record, ["positions", "leadership", "responsibilities"])
        .map(normalizeTimelineEntry)
        .filter((entry): entry is ResumeSupplementalEntry => Boolean(entry));
    const volunteering = collectRecordEntries(record, ["volunteering", "volunteerExperience"])
        .map(normalizeTimelineEntry)
        .filter((entry): entry is ResumeSupplementalEntry => Boolean(entry));

    return [
        entriesSection("Internships", internships),
        entriesSection("Leadership", positions),
        entriesSection("Volunteering", volunteering),
    ].filter((section): section is ResumeSupplementalSection => Boolean(section));
}

export function getProfileSupplementalSections(data: unknown): ResumeSupplementalSection[] {
    const record = asRecord(data);
    if (!record) return [];

    const certifications = collectRecordEntries(record, ["certifications"])
        .map(normalizeCertificationEntry)
        .filter((entry): entry is ResumeSupplementalEntry => Boolean(entry));
    const achievements = collectStringEntries(record, ["achievements"]);
    const awards = collectStringEntries(record, ["awards"]);
    const coursework = collectStringEntries(record, ["coursework", "relevantCoursework"]);
    const languages = collectStringEntries(record, ["languages"]);
    const publications = collectStringEntries(record, ["publications"]);

    return [
        entriesSection("Certifications", certifications),
        bulletsSection("Achievements", achievements),
        bulletsSection("Awards", awards),
        bulletsSection("Coursework", coursework),
        bulletsSection("Languages", languages),
        bulletsSection("Publications", publications),
        ...customSections(record),
    ].filter((section): section is ResumeSupplementalSection => Boolean(section));
}

export function renderSupplementalSections({
    sections,
    heading,
    bullet,
    rowStyle,
    titleStyle,
    subtitleStyle,
    durationStyle,
    detailStyle,
    sectionStyle,
    getEntryStyle,
    subtitlePlacement = "inline",
    inlineSeparator = " | ",
}: SupplementalRenderOptions): ReactNode[] {
    return sections.map((section, sectionIndex) => {
        const key = `${section.title}-${sectionIndex}`;

        const content = (
            <>
                {heading(section.title, key)}
                {section.kind === "entries"
                    ? section.entries.map((entry, entryIndex) => {
                        const leftTitle = subtitlePlacement === "inline" && entry.subtitle
                            ? `${entry.title}${inlineSeparator}${entry.subtitle}`
                            : entry.title;

                        return (
                            <View
                                key={`${key}-entry-${entryIndex}`}
                                style={getEntryStyle ? getEntryStyle(entryIndex) : { marginTop: entryIndex > 0 ? 6 : 0 }}
                            >
                                <View style={rowStyle}>
                                    <Text style={titleStyle}>{leftTitle}</Text>
                                    {entry.duration ? <Text style={durationStyle}>{entry.duration}</Text> : null}
                                </View>
                                {subtitlePlacement === "below" && entry.subtitle ? (
                                    <Text style={subtitleStyle}>{entry.subtitle}</Text>
                                ) : null}
                                {entry.points.map((point, pointIndex) => bullet(point, `${key}-entry-${entryIndex}-point-${pointIndex}`))}
                                {entry.meta ? <Text style={detailStyle}>{entry.meta}</Text> : null}
                            </View>
                        );
                    })
                    : section.items.map((item, itemIndex) => bullet(item, `${key}-item-${itemIndex}`))}
            </>
        );

        return sectionStyle ? (
            <View key={key} style={sectionStyle}>
                {content}
            </View>
        ) : (
            <View key={key}>
                {content}
            </View>
        );
    });
}
