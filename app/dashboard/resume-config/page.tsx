"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Link,
} from "@react-pdf/renderer";
import dynamic from "next/dynamic";
import {
    FiFileText, FiCode, FiEye, FiCheckCircle, FiAlertCircle, FiDownload, FiLayers, FiLock,
} from "react-icons/fi";
import { getStoredToken } from "@/app/utils/token";
import { useToast } from "@/components/ui/toast";
import { EXTRA_TEMPLATES, type ExtraTemplateId } from "./extra-templates";

// ── Lazy PDF components ───────────────────────────────────────────────────────

/* BlobProvider — used for PDF preview + download on both desktop and mobile */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BlobProvider = dynamic(
    () => import("@react-pdf/renderer").then((m) => ({ default: m.BlobProvider as any })),
    { ssr: false }
) as any;

// ── Mobile PDF canvas renderer ────────────────────────────────────────────────
// PDF.js renders each page to a <canvas>, then we show them as <img> elements.
// This is the only reliable approach for inline PDF preview on Android Chrome.

function MobilePDFCanvas({ url }: { url: string }) {
    const [pages, setPages] = useState<string[]>([]);
    const [rendering, setRendering] = useState(true);

    useEffect(() => {
        if (!url) return;
        let cancelled = false;

        (async () => {
            try {
                // Lazy-import pdfjs-dist so it never runs on the server
                const pdfjsLib = await import("pdfjs-dist");
                // Use unpkg CDN for the worker — no webpack config needed
                pdfjsLib.GlobalWorkerOptions.workerSrc =
                    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

                const pdf = await pdfjsLib.getDocument(url).promise;
                const scale = Math.min(window.devicePixelRatio || 1, 2);
                const dataUrls: string[] = [];

                for (let n = 1; n <= pdf.numPages; n++) {
                    if (cancelled) return;
                    const page = await pdf.getPage(n);
                    const vp = page.getViewport({ scale });
                    const canvas = document.createElement("canvas");
                    canvas.width  = vp.width;
                    canvas.height = vp.height;
                    // pdfjs-dist v5: pass canvas directly (canvasContext is legacy)
                    await page.render({ canvas, viewport: vp }).promise;
                    dataUrls.push(canvas.toDataURL("image/png"));
                }

                if (!cancelled) { setPages(dataUrls); setRendering(false); }
            } catch {
                if (!cancelled) setRendering(false);
            }
        })();

        return () => { cancelled = true; };
    }, [url]);

    if (rendering) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-50">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Rendering preview…</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto bg-gray-200 flex flex-col items-center gap-3 p-3"
            style={{ scrollbarWidth: "thin" }}
        >
            {pages.map((src, i) => (
                <img key={i} src={src} alt={`Page ${i + 1}`}
                    className="w-full max-w-full shadow-md rounded bg-white"
                />
            ))}
        </div>
    );
}

function PDFLoader() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-50">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading PDF viewer…</p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — CLASSIC  (Times, centered header, all-caps sections)
// ─────────────────────────────────────────────────────────────────────────────

const s1 = StyleSheet.create({
    page:  { padding: "20 26", backgroundColor: "#fff" },
    hdr:   { alignItems: "center" },
    name:  { fontSize: 18, fontFamily: "Times-Bold", textAlign: "center", textTransform: "uppercase", letterSpacing: 1.5 },
    sep:   { height: 0.6, backgroundColor: "#b0b0b0", marginTop: 5, marginBottom: 2 },
    ht:    { fontSize: 11, fontFamily: "Times-Roman", textAlign: "center", color: "#444", marginTop: 3 },
    hc:    { fontSize: 10, fontFamily: "Times-Roman", textAlign: "center", color: "#555", marginTop: 2 },
    sh:    { fontSize: 11, fontFamily: "Times-Bold", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 8, marginBottom: 1 },
    row:   { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    bold:  { fontSize: 10, fontFamily: "Times-Bold" },
    body:  { fontSize: 10, fontFamily: "Times-Roman", color: "#333", lineHeight: 1.4 },
    ital:  { fontSize: 10, fontFamily: "Times-Italic", color: "#555" },
    br:    { flexDirection: "row", marginTop: 2 },
    bd:    { width: 10, fontSize: 10 },
    bt:    { flex: 1, fontSize: 10, fontFamily: "Times-Roman", color: "#333", lineHeight: 1.4 },
    lnk:   { color: "#1d4ed8", textDecoration: "underline" },
});

function T1({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s1.br}><Text style={s1.bd}>•</Text><Text style={s1.bt}>{t}</Text></View>;
    const S = ({ v }: { v: string }) => <><Text style={s1.sh}>{v}</Text><View style={s1.sep} /></>;
    return (
        <Document>
            <Page size="A4" style={s1.page}>
                <View style={s1.hdr}>
                    <Text style={s1.name}>{data.header?.name}</Text>
                    <View style={s1.sep} />
                    <Text style={s1.ht}>{data.header?.title}</Text>
                    <Text style={s1.hc}>
                        {data.header?.contact}
                        {data.header?.links?.linkedin && <Text>{" | "}<Link src={data.header.links.linkedin} style={s1.lnk}>LinkedIn</Link></Text>}
                        {data.header?.links?.github && <Text>{" | "}<Link src={data.header.links.github} style={s1.lnk}>GitHub</Link></Text>}
                        {data.header?.links?.portfolio && <Text>{" | "}<Link src={data.header.links.portfolio} style={s1.lnk}>Portfolio</Link></Text>}
                    </Text>
                </View>
                {!!data.summary?.trim() && (<View style={{ marginTop: 4 }}><S v="SUMMARY" /><Text style={s1.body}>{data.summary}</Text></View>)}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                    <View style={{ marginTop: 4 }}><S v="SKILLS" />
                        {data.skills.map((sk: any, i: number) => <Text key={i} style={s1.bold}>{sk.label}: <Text style={s1.body}>{sk.value}</Text></Text>)}
                    </View>
                )}
                {Array.isArray(data.experience) && data.experience.length > 0 && (
                    <View style={{ marginTop: 4 }}><S v="EXPERIENCE" />
                        {data.experience.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 6 : 0 }}>
                                <View style={s1.row}><Text style={s1.bold}>{e.role} | {e.company}</Text><Text style={s1.body}>{e.duration}</Text></View>
                                {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                {e.techStack && <Text style={s1.bold}>Tech Stack: <Text style={s1.ital}>{e.techStack}</Text></Text>}
                            </View>
                        ))}
                    </View>
                )}
                {Array.isArray(data.projects) && data.projects.length > 0 && (
                    <View style={{ marginTop: 4 }}><S v="PROJECTS" />
                        {data.projects.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 5 : 0 }}>
                                <View style={s1.row}><Text style={s1.bold}>{p.name} | {p.role}</Text><Text style={s1.body}>{p.duration}</Text></View>
                                {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                {p.techStack && <Text style={s1.bold}>Tech Stack: <Text style={s1.ital}>{p.techStack}</Text></Text>}
                            </View>
                        ))}
                    </View>
                )}
                {data.education && (data.education.college || data.education.degree) && (
                    <View style={{ marginTop: 4 }}><S v="EDUCATION" />
                        <View style={s1.row}>
                            <View style={{ flex: 1 }}><Text style={s1.bold}>{data.education.college}</Text><Text style={s1.body}>{data.education.degree}</Text></View>
                            <Text style={s1.body}>{data.education.duration}</Text>
                        </View>
                    </View>
                )}
            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — MODERN TEAL  (Helvetica, top accent bar, teal section headers)
// ─────────────────────────────────────────────────────────────────────────────

const s2 = StyleSheet.create({
    page:  { padding: "0", backgroundColor: "#fff" },
    bar:   { height: 5, backgroundColor: "#0d9488" },
    wrap:  { padding: "14 26" },
    name:  { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0d9488", letterSpacing: 0.3 },
    ht:    { fontSize: 10, fontFamily: "Helvetica", color: "#374151", marginTop: 2 },
    hc:    { fontSize: 9, fontFamily: "Helvetica", color: "#6b7280", marginTop: 4, lineHeight: 1.5 },
    sh:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0d9488", textTransform: "uppercase", letterSpacing: 1, marginTop: 10 },
    sl:    { height: 1, backgroundColor: "#ccfbf1", marginTop: 2, marginBottom: 3 },
    row:   { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    bold:  { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#111827" },
    body:  { fontSize: 9.5, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.45 },
    meta:  { fontSize: 9, fontFamily: "Helvetica-Oblique", color: "#6b7280" },
    br:    { flexDirection: "row", marginTop: 2 },
    bd:    { width: 10, fontSize: 9.5, color: "#0d9488" },
    bt:    { flex: 1, fontSize: 9.5, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.45 },
    lnk:   { color: "#0d9488", textDecoration: "underline" },
});

function T2({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s2.br}><Text style={s2.bd}>-</Text><Text style={s2.bt}>{t}</Text></View>;
    const S = ({ v }: { v: string }) => <><Text style={s2.sh}>{v}</Text><View style={s2.sl} /></>;
    return (
        <Document>
            <Page size="A4" style={s2.page}>
                <View style={s2.bar} />
                <View style={s2.wrap}>
                    <Text style={s2.name}>{data.header?.name}</Text>
                    <Text style={s2.ht}>{data.header?.title}</Text>
                    <Text style={s2.hc}>
                        {data.header?.contact}
                        {data.header?.links?.linkedin && <Text>{"  ·  "}<Link src={data.header.links.linkedin} style={s2.lnk}>LinkedIn</Link></Text>}
                        {data.header?.links?.github && <Text>{"  ·  "}<Link src={data.header.links.github} style={s2.lnk}>GitHub</Link></Text>}
                        {data.header?.links?.portfolio && <Text>{"  ·  "}<Link src={data.header.links.portfolio} style={s2.lnk}>Portfolio</Link></Text>}
                    </Text>
                    {!!data.summary?.trim() && (<><S v="PROFILE" /><Text style={s2.body}>{data.summary}</Text></>)}
                    {Array.isArray(data.skills) && data.skills.length > 0 && (
                        <><S v="SKILLS" />
                            {data.skills.map((sk: any, i: number) => (
                                <Text key={i} style={s2.body}><Text style={s2.bold}>{sk.label}: </Text>{sk.value}</Text>
                            ))}
                        </>
                    )}
                    {Array.isArray(data.experience) && data.experience.length > 0 && (
                        <><S v="EXPERIENCE" />
                            {data.experience.map((e: any, i: number) => (
                                <View key={i} style={{ marginTop: i > 0 ? 6 : 0 }}>
                                    <View style={s2.row}><Text style={s2.bold}>{e.role} — {e.company}</Text><Text style={s2.meta}>{e.duration}</Text></View>
                                    {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                    {e.techStack && <Text style={[s2.meta, { marginTop: 3 }]}>Stack: {e.techStack}</Text>}
                                </View>
                            ))}
                        </>
                    )}
                    {Array.isArray(data.projects) && data.projects.length > 0 && (
                        <><S v="PROJECTS" />
                            {data.projects.map((p: any, i: number) => (
                                <View key={i} style={{ marginTop: i > 0 ? 5 : 0 }}>
                                    <View style={s2.row}><Text style={s2.bold}>{p.name} <Text style={s2.meta}>({p.role})</Text></Text><Text style={s2.meta}>{p.duration}</Text></View>
                                    {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                    {p.techStack && <Text style={[s2.meta, { marginTop: 3 }]}>Stack: {p.techStack}</Text>}
                                </View>
                            ))}
                        </>
                    )}
                    {data.education && (data.education.college || data.education.degree) && (
                        <><S v="EDUCATION" />
                            <View style={s2.row}>
                                <View style={{ flex: 1 }}><Text style={s2.bold}>{data.education.college}</Text><Text style={s2.body}>{data.education.degree}</Text></View>
                                <Text style={s2.meta}>{data.education.duration}</Text>
                            </View>
                        </>
                    )}
                </View>
            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — PROFESSIONAL BLUE  (dark navy header band)
// ─────────────────────────────────────────────────────────────────────────────

const s3 = StyleSheet.create({
    page:  { padding: "0", backgroundColor: "#fff" },
    band:  { backgroundColor: "#1e3a5f", padding: "20 26 14 26" },
    name:  { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: 0.8 },
    ht:    { fontSize: 10, fontFamily: "Helvetica", color: "#93c5fd", marginTop: 3 },
    hc:    { fontSize: 9, fontFamily: "Helvetica", color: "#bfdbfe", marginTop: 4 },
    body:  { padding: "10 26" },
    sh:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 1, marginTop: 8, borderBottomWidth: 1, borderBottomColor: "#1e3a5f", paddingBottom: 2 },
    row:   { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
    bold:  { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#1e3a5f" },
    btext: { fontSize: 9.5, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.4 },
    meta:  { fontSize: 9, fontFamily: "Helvetica-Oblique", color: "#6b7280" },
    br:    { flexDirection: "row", marginTop: 2 },
    bd:    { width: 12, fontSize: 9.5, color: "#1e3a5f", fontFamily: "Helvetica-Bold" },
    bt:    { flex: 1, fontSize: 9.5, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.4 },
    lnk:   { color: "#93c5fd", textDecoration: "underline" },
});

function T3({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s3.br}><Text style={s3.bd}>•</Text><Text style={s3.bt}>{t}</Text></View>;
    return (
        <Document>
            <Page size="A4" style={s3.page}>
                <View style={s3.band}>
                    <Text style={s3.name}>{data.header?.name}</Text>
                    <Text style={s3.ht}>{data.header?.title}</Text>
                    <Text style={s3.hc}>
                        {data.header?.contact}
                        {data.header?.links?.linkedin && <Text>{" | "}<Link src={data.header.links.linkedin} style={s3.lnk}>LinkedIn</Link></Text>}
                        {data.header?.links?.github && <Text>{" | "}<Link src={data.header.links.github} style={s3.lnk}>GitHub</Link></Text>}
                        {data.header?.links?.portfolio && <Text>{" | "}<Link src={data.header.links.portfolio} style={s3.lnk}>Portfolio</Link></Text>}
                    </Text>
                </View>
                <View style={s3.body}>
                    {!!data.summary?.trim() && (<><Text style={s3.sh}>PROFESSIONAL SUMMARY</Text><Text style={[s3.btext, { marginTop: 4 }]}>{data.summary}</Text></>)}
                    {Array.isArray(data.skills) && data.skills.length > 0 && (
                        <><Text style={s3.sh}>TECHNICAL SKILLS</Text>
                            <View style={{ marginTop: 4 }}>{data.skills.map((sk: any, i: number) => <Text key={i} style={s3.bold}>{sk.label}: <Text style={s3.btext}>{sk.value}</Text></Text>)}</View>
                        </>
                    )}
                    {Array.isArray(data.experience) && data.experience.length > 0 && (
                        <><Text style={s3.sh}>PROFESSIONAL EXPERIENCE</Text>
                            {data.experience.map((e: any, i: number) => (
                                <View key={i} style={{ marginTop: i > 0 ? 7 : 4 }}>
                                    <View style={s3.row}><Text style={s3.bold}>{e.role} | {e.company}</Text><Text style={s3.meta}>{e.duration}</Text></View>
                                    {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                    {e.techStack && <Text style={[s3.meta, { marginTop: 2 }]}>Technologies: {e.techStack}</Text>}
                                </View>
                            ))}
                        </>
                    )}
                    {Array.isArray(data.projects) && data.projects.length > 0 && (
                        <><Text style={s3.sh}>KEY PROJECTS</Text>
                            {data.projects.map((p: any, i: number) => (
                                <View key={i} style={{ marginTop: i > 0 ? 5 : 4 }}>
                                    <View style={s3.row}><Text style={s3.bold}>{p.name} | {p.role}</Text><Text style={s3.meta}>{p.duration}</Text></View>
                                    {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                    {p.techStack && <Text style={[s3.meta, { marginTop: 2 }]}>Technologies: {p.techStack}</Text>}
                                </View>
                            ))}
                        </>
                    )}
                    {data.education && (data.education.college || data.education.degree) && (
                        <><Text style={s3.sh}>EDUCATION</Text>
                            <View style={[s3.row, { marginTop: 4 }]}>
                                <View style={{ flex: 1 }}><Text style={s3.bold}>{data.education.college}</Text><Text style={s3.btext}>{data.education.degree}</Text></View>
                                <Text style={s3.meta}>{data.education.duration}</Text>
                            </View>
                        </>
                    )}
                </View>
            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4 — MINIMAL  (Helvetica, ultra-clean, generous whitespace)
// ─────────────────────────────────────────────────────────────────────────────

const s4 = StyleSheet.create({
    page:  { padding: "22 30", backgroundColor: "#fff" },
    name:  { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#0a0a0a", letterSpacing: 0 },
    ht:    { fontSize: 10, fontFamily: "Helvetica", color: "#6b7280", marginTop: 3 },
    hc:    { fontSize: 9, fontFamily: "Helvetica", color: "#9ca3af", marginTop: 4 },
    sep:   { height: 0.5, backgroundColor: "#e5e7eb", marginTop: 10, marginBottom: 4 },
    sh:    { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 12, marginBottom: 3 },
    row:   { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    bold:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
    body:  { fontSize: 9.5, fontFamily: "Helvetica", color: "#4b5563", lineHeight: 1.55 },
    meta:  { fontSize: 9, fontFamily: "Helvetica", color: "#9ca3af" },
    br:    { flexDirection: "row", marginTop: 3 },
    bd:    { width: 12, fontSize: 9.5, color: "#d1d5db" },
    bt:    { flex: 1, fontSize: 9.5, fontFamily: "Helvetica", color: "#4b5563", lineHeight: 1.55 },
    lnk:   { color: "#6b7280", textDecoration: "underline" },
});

function T4({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s4.br}><Text style={s4.bd}>—</Text><Text style={s4.bt}>{t}</Text></View>;
    return (
        <Document>
            <Page size="A4" style={s4.page}>
                <Text style={s4.name}>{data.header?.name}</Text>
                <Text style={s4.ht}>{data.header?.title}</Text>
                <Text style={s4.hc}>
                    {data.header?.contact}
                    {data.header?.links?.linkedin && <Text>{" · "}<Link src={data.header.links.linkedin} style={s4.lnk}>LinkedIn</Link></Text>}
                    {data.header?.links?.github && <Text>{" · "}<Link src={data.header.links.github} style={s4.lnk}>GitHub</Link></Text>}
                    {data.header?.links?.portfolio && <Text>{" · "}<Link src={data.header.links.portfolio} style={s4.lnk}>Portfolio</Link></Text>}
                </Text>
                <View style={s4.sep} />
                {!!data.summary?.trim() && (<><Text style={s4.sh}>ABOUT</Text><Text style={s4.body}>{data.summary}</Text></>)}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                    <><Text style={s4.sh}>EXPERTISE</Text>
                        {data.skills.map((sk: any, i: number) => <Text key={i} style={s4.body}><Text style={s4.bold}>{sk.label}: </Text>{sk.value}</Text>)}
                    </>
                )}
                {Array.isArray(data.experience) && data.experience.length > 0 && (
                    <><Text style={s4.sh}>EXPERIENCE</Text>
                        {data.experience.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 8 : 0 }}>
                                <View style={s4.row}><Text style={s4.bold}>{e.role}, {e.company}</Text><Text style={s4.meta}>{e.duration}</Text></View>
                                {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                {e.techStack && <Text style={[s4.meta, { marginTop: 4 }]}>{e.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {Array.isArray(data.projects) && data.projects.length > 0 && (
                    <><Text style={s4.sh}>PROJECTS</Text>
                        {data.projects.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 7 : 0 }}>
                                <View style={s4.row}><Text style={s4.bold}>{p.name}</Text><Text style={s4.meta}>{p.duration}</Text></View>
                                <Text style={[s4.meta, { marginTop: 1 }]}>{p.role}</Text>
                                {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                {p.techStack && <Text style={[s4.meta, { marginTop: 4 }]}>{p.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {data.education && (data.education.college || data.education.degree) && (
                    <><Text style={s4.sh}>EDUCATION</Text>
                        <View style={s4.row}>
                            <View style={{ flex: 1 }}><Text style={s4.bold}>{data.education.college}</Text><Text style={s4.body}>{data.education.degree}</Text></View>
                            <Text style={s4.meta}>{data.education.duration}</Text>
                        </View>
                    </>
                )}
            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 5 — EXECUTIVE  (Times, warm stone tones, amber accent)
// ─────────────────────────────────────────────────────────────────────────────

const s5 = StyleSheet.create({
    page:   { padding: "26 30", backgroundColor: "#fafaf9" },
    hdr:    { borderBottomWidth: 2, borderBottomColor: "#92400e", paddingBottom: 10, alignItems: "center" },
    name:   { fontSize: 26, fontFamily: "Times-Bold", color: "#1c1917", letterSpacing: 0.5, textAlign: "center" },
    accent: { height: 2, backgroundColor: "#b45309", width: 60, marginTop: 5 },
    ht:     { fontSize: 11, fontFamily: "Times-Italic", color: "#78350f", textAlign: "center", marginTop: 5 },
    hc:     { fontSize: 9.5, fontFamily: "Times-Roman", color: "#57534e", textAlign: "center", marginTop: 3 },
    sh:     { fontSize: 12, fontFamily: "Times-Bold", color: "#1c1917", marginTop: 10, marginBottom: 1, borderBottomWidth: 0.5, borderBottomColor: "#d6d3d1", paddingBottom: 2 },
    row:    { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
    bold:   { fontSize: 10, fontFamily: "Times-Bold", color: "#1c1917" },
    body:   { fontSize: 10, fontFamily: "Times-Roman", color: "#44403c", lineHeight: 1.4 },
    meta:   { fontSize: 9.5, fontFamily: "Times-Italic", color: "#78716c" },
    br:     { flexDirection: "row", marginTop: 2 },
    bd:     { width: 10, fontSize: 10, color: "#b45309" },
    bt:     { flex: 1, fontSize: 10, fontFamily: "Times-Roman", color: "#44403c", lineHeight: 1.4 },
    lnk:    { color: "#b45309", textDecoration: "underline" },
});

function T5({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s5.br}><Text style={s5.bd}>•</Text><Text style={s5.bt}>{t}</Text></View>;
    return (
        <Document>
            <Page size="A4" style={s5.page}>
                <View style={s5.hdr}>
                    <Text style={s5.name}>{data.header?.name}</Text>
                    <View style={s5.accent} />
                    <Text style={s5.ht}>{data.header?.title}</Text>
                    <Text style={s5.hc}>
                        {data.header?.contact}
                        {data.header?.links?.linkedin && <Text>{" | "}<Link src={data.header.links.linkedin} style={s5.lnk}>LinkedIn</Link></Text>}
                        {data.header?.links?.github && <Text>{" | "}<Link src={data.header.links.github} style={s5.lnk}>GitHub</Link></Text>}
                        {data.header?.links?.portfolio && <Text>{" | "}<Link src={data.header.links.portfolio} style={s5.lnk}>Portfolio</Link></Text>}
                    </Text>
                </View>
                {!!data.summary?.trim() && (<><Text style={s5.sh}>EXECUTIVE SUMMARY</Text><Text style={[s5.body, { marginTop: 4 }]}>{data.summary}</Text></>)}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                    <><Text style={s5.sh}>CORE COMPETENCIES</Text>
                        <View style={{ marginTop: 4 }}>{data.skills.map((sk: any, i: number) => <Text key={i} style={s5.bold}>{sk.label}: <Text style={s5.body}>{sk.value}</Text></Text>)}</View>
                    </>
                )}
                {Array.isArray(data.experience) && data.experience.length > 0 && (
                    <><Text style={s5.sh}>PROFESSIONAL EXPERIENCE</Text>
                        {data.experience.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 7 : 4 }}>
                                <View style={s5.row}><Text style={s5.bold}>{e.role} | {e.company}</Text><Text style={s5.meta}>{e.duration}</Text></View>
                                {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                {e.techStack && <Text style={[s5.meta, { marginTop: 3 }]}>Technologies: {e.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {Array.isArray(data.projects) && data.projects.length > 0 && (
                    <><Text style={s5.sh}>SELECTED PROJECTS</Text>
                        {data.projects.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 5 : 4 }}>
                                <View style={s5.row}><Text style={s5.bold}>{p.name} | {p.role}</Text><Text style={s5.meta}>{p.duration}</Text></View>
                                {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                {p.techStack && <Text style={[s5.meta, { marginTop: 3 }]}>Technologies: {p.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {data.education && (data.education.college || data.education.degree) && (
                    <><Text style={s5.sh}>EDUCATION</Text>
                        <View style={[s5.row, { marginTop: 4 }]}>
                            <View style={{ flex: 1 }}><Text style={s5.bold}>{data.education.college}</Text><Text style={s5.body}>{data.education.degree}</Text></View>
                            <Text style={s5.meta}>{data.education.duration}</Text>
                        </View>
                    </>
                )}
            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 6 — TECH / ATS  (violet left-bar accent, Helvetica, ATS-optimised)
// ─────────────────────────────────────────────────────────────────────────────

const s6 = StyleSheet.create({
    page:  { padding: "18 24", backgroundColor: "#fff" },
    nw:    { flexDirection: "row", alignItems: "center" },
    vbar:  { width: 4, height: 36, backgroundColor: "#7c3aed", marginRight: 10 },
    name:  { fontSize: 17, fontFamily: "Helvetica-Bold", color: "#0f172a", letterSpacing: 0.2 },
    ht:    { fontSize: 9.5, fontFamily: "Helvetica", color: "#7c3aed", marginTop: 1 },
    hc:    { fontSize: 9, fontFamily: "Helvetica", color: "#475569", marginTop: 4 },
    div:   { height: 1, backgroundColor: "#e2e8f0", marginTop: 6, marginBottom: 2 },
    sw:    { flexDirection: "row", alignItems: "center", marginTop: 9, marginBottom: 3 },
    sbar:  { width: 3, height: 13, backgroundColor: "#7c3aed", marginRight: 6 },
    sh:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.8 },
    row:   { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
    bold:  { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#0f172a" },
    body:  { fontSize: 9.5, fontFamily: "Helvetica", color: "#334155", lineHeight: 1.45 },
    meta:  { fontSize: 9, fontFamily: "Helvetica-Oblique", color: "#64748b" },
    br:    { flexDirection: "row", marginTop: 2 },
    bd:    { width: 10, fontSize: 9.5, color: "#7c3aed" },
    bt:    { flex: 1, fontSize: 9.5, fontFamily: "Helvetica", color: "#334155", lineHeight: 1.45 },
    lnk:   { color: "#7c3aed", textDecoration: "underline" },
});

function T6({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s6.br}><Text style={s6.bd}>{">"}</Text><Text style={s6.bt}>{t}</Text></View>;
    const S = ({ v }: { v: string }) => <View style={s6.sw}><View style={s6.sbar} /><Text style={s6.sh}>{v}</Text></View>;
    return (
        <Document>
            <Page size="A4" style={s6.page}>
                <View style={s6.nw}>
                    <View style={s6.vbar} />
                    <View><Text style={s6.name}>{data.header?.name}</Text><Text style={s6.ht}>{data.header?.title}</Text></View>
                </View>
                <Text style={s6.hc}>
                    {data.header?.contact}
                    {data.header?.links?.linkedin && <Text>{" | "}<Link src={data.header.links.linkedin} style={s6.lnk}>LinkedIn</Link></Text>}
                    {data.header?.links?.github && <Text>{" | "}<Link src={data.header.links.github} style={s6.lnk}>GitHub</Link></Text>}
                    {data.header?.links?.portfolio && <Text>{" | "}<Link src={data.header.links.portfolio} style={s6.lnk}>Portfolio</Link></Text>}
                </Text>
                <View style={s6.div} />
                {!!data.summary?.trim() && (<><S v="SUMMARY" /><Text style={s6.body}>{data.summary}</Text></>)}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                    <><S v="SKILLS" />
                        {data.skills.map((sk: any, i: number) => <Text key={i} style={s6.bold}>{sk.label}: <Text style={s6.body}>{sk.value}</Text></Text>)}
                    </>
                )}
                {Array.isArray(data.experience) && data.experience.length > 0 && (
                    <><S v="EXPERIENCE" />
                        {data.experience.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 7 : 0 }}>
                                <View style={s6.row}><Text style={s6.bold}>{e.role} @ {e.company}</Text><Text style={s6.meta}>{e.duration}</Text></View>
                                {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                {e.techStack && <Text style={[s6.meta, { marginTop: 2 }]}>Stack: {e.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {Array.isArray(data.projects) && data.projects.length > 0 && (
                    <><S v="PROJECTS" />
                        {data.projects.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 5 : 0 }}>
                                <View style={s6.row}><Text style={s6.bold}>{p.name} <Text style={s6.meta}>— {p.role}</Text></Text><Text style={s6.meta}>{p.duration}</Text></View>
                                {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                {p.techStack && <Text style={[s6.meta, { marginTop: 2 }]}>Stack: {p.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {data.education && (data.education.college || data.education.degree) && (
                    <><S v="EDUCATION" />
                        <View style={s6.row}>
                            <View style={{ flex: 1 }}><Text style={s6.bold}>{data.education.college}</Text><Text style={s6.body}>{data.education.degree}</Text></View>
                            <Text style={s6.meta}>{data.education.duration}</Text>
                        </View>
                    </>
                )}
            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 7 — SIDEBAR TEAL  (two-column: teal left sidebar + white right)
// ─────────────────────────────────────────────────────────────────────────────

const s7 = StyleSheet.create({
    page:   { flexDirection: "row", backgroundColor: "#fff" },
    side:   { width: 175, backgroundColor: "#0f766e", padding: "22 13" },
    main:   { flex: 1, padding: "20 16", backgroundColor: "#fff" },
    // sidebar
    sname:  { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 0.2, marginBottom: 2 },
    sht:    { fontSize: 8.5, fontFamily: "Helvetica-Oblique", color: "#99f6e4", marginBottom: 10 },
    shr:    { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#ccfbf1", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 9, marginBottom: 3, borderBottomWidth: 0.5, borderBottomColor: "#14b8a6", paddingBottom: 2 },
    sbody:  { fontSize: 8, fontFamily: "Helvetica", color: "#d1fae5", lineHeight: 1.5 },
    slink:  { fontSize: 8, fontFamily: "Helvetica", color: "#a7f3d0", textDecoration: "underline" },
    slabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#a7f3d0", marginTop: 3 },
    // main
    msh:    { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#0f766e", textTransform: "uppercase", letterSpacing: 1, marginTop: 8, borderBottomWidth: 1, borderBottomColor: "#ccfbf1", paddingBottom: 2, marginBottom: 3 },
    mbold:  { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#111827" },
    mbody:  { fontSize: 9, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.45 },
    mmeta:  { fontSize: 8.5, fontFamily: "Helvetica-Oblique", color: "#6b7280" },
    mrow:   { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    mbr:    { flexDirection: "row", marginTop: 2 },
    mbd:    { width: 10, fontSize: 9, color: "#0f766e" },
    mbt:    { flex: 1, fontSize: 9, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.45 },
});

function T7({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s7.mbr}><Text style={s7.mbd}>•</Text><Text style={s7.mbt}>{t}</Text></View>;
    const contact = (data.header?.contact ?? "").split(" | ").join("\n");
    return (
        <Document>
            <Page size="A4" style={s7.page}>
                {/* Sidebar */}
                <View style={s7.side}>
                    <Text style={s7.sname}>{data.header?.name}</Text>
                    <Text style={s7.sht}>{data.header?.title}</Text>
                    <Text style={s7.shr}>CONTACT</Text>
                    <Text style={s7.sbody}>{contact}</Text>
                    {data.header?.links?.linkedin && <Text style={[s7.sbody, { marginTop: 3 }]}><Link src={data.header.links.linkedin} style={s7.slink}>LinkedIn</Link></Text>}
                    {data.header?.links?.github && <Text style={s7.sbody}><Link src={data.header.links.github} style={s7.slink}>GitHub</Link></Text>}
                    {data.header?.links?.portfolio && <Text style={s7.sbody}><Link src={data.header.links.portfolio} style={s7.slink}>Portfolio</Link></Text>}
                    {Array.isArray(data.skills) && data.skills.length > 0 && (<>
                        <Text style={s7.shr}>SKILLS</Text>
                        {data.skills.map((sk: any, i: number) => (
                            <Text key={i} style={{ marginTop: i > 0 ? 3 : 0 }}>
                                <Text style={s7.slabel}>{sk.label}: </Text>
                                <Text style={s7.sbody}>{sk.value}</Text>
                            </Text>
                        ))}
                    </>)}
                    {data.education && (data.education.college || data.education.degree) && (<>
                        <Text style={s7.shr}>EDUCATION</Text>
                        <Text style={s7.slabel}>{data.education.college}</Text>
                        <Text style={s7.sbody}>{data.education.degree}</Text>
                        <Text style={s7.sbody}>{data.education.duration}</Text>
                    </>)}
                </View>
                {/* Main */}
                <View style={s7.main}>
                    {!!data.summary?.trim() && (<><Text style={s7.msh}>PROFILE</Text><Text style={s7.mbody}>{data.summary}</Text></>)}
                    {Array.isArray(data.experience) && data.experience.length > 0 && (
                        <><Text style={s7.msh}>EXPERIENCE</Text>
                            {data.experience.map((e: any, i: number) => (
                                <View key={i} style={{ marginTop: i > 0 ? 6 : 0 }}>
                                    <View style={s7.mrow}><Text style={s7.mbold}>{e.role}</Text><Text style={s7.mmeta}>{e.duration}</Text></View>
                                    <Text style={s7.mmeta}>{e.company}</Text>
                                    {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                    {e.techStack && <Text style={[s7.mmeta, { marginTop: 2 }]}>Stack: {e.techStack}</Text>}
                                </View>
                            ))}
                        </>
                    )}
                    {Array.isArray(data.projects) && data.projects.length > 0 && (
                        <><Text style={s7.msh}>PROJECTS</Text>
                            {data.projects.map((p: any, i: number) => (
                                <View key={i} style={{ marginTop: i > 0 ? 5 : 0 }}>
                                    <View style={s7.mrow}><Text style={s7.mbold}>{p.name}</Text><Text style={s7.mmeta}>{p.duration}</Text></View>
                                    <Text style={s7.mmeta}>{p.role}</Text>
                                    {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                    {p.techStack && <Text style={[s7.mmeta, { marginTop: 2 }]}>Stack: {p.techStack}</Text>}
                                </View>
                            ))}
                        </>
                    )}
                </View>
            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 8 — SIDEBAR NAVY  (two-column: dark navy sidebar + indigo headers)
// ─────────────────────────────────────────────────────────────────────────────

const s8 = StyleSheet.create({
    page:   { flexDirection: "row", backgroundColor: "#fff" },
    side:   { width: 160, backgroundColor: "#1e293b", padding: "22 11" },
    main:   { flex: 1, padding: "22 18", backgroundColor: "#fff" },
    // sidebar
    sname:  { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#f8fafc", letterSpacing: 0.2, marginBottom: 2 },
    sht:    { fontSize: 8, fontFamily: "Helvetica-Oblique", color: "#94a3b8", marginBottom: 12 },
    shr:    { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 9, marginBottom: 2 },
    sdiv:   { height: 0.5, backgroundColor: "#334155", marginBottom: 4 },
    sbody:  { fontSize: 8, fontFamily: "Helvetica", color: "#94a3b8", lineHeight: 1.5 },
    slabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#cbd5e1", marginTop: 3 },
    slink:  { fontSize: 8, fontFamily: "Helvetica", color: "#818cf8", textDecoration: "underline" },
    // main
    msh:    { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 9, borderBottomWidth: 1.5, borderBottomColor: "#6366f1", paddingBottom: 3, marginBottom: 4 },
    mbold:  { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#0f172a" },
    mbody:  { fontSize: 9, fontFamily: "Helvetica", color: "#475569", lineHeight: 1.45 },
    mmeta:  { fontSize: 8.5, fontFamily: "Helvetica-Oblique", color: "#94a3b8" },
    mrow:   { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    mbr:    { flexDirection: "row", marginTop: 2 },
    mbd:    { width: 10, fontSize: 9, color: "#6366f1" },
    mbt:    { flex: 1, fontSize: 9, fontFamily: "Helvetica", color: "#475569", lineHeight: 1.45 },
});

function T8({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s8.mbr}><Text style={s8.mbd}>•</Text><Text style={s8.mbt}>{t}</Text></View>;
    const contact = (data.header?.contact ?? "").split(" | ").join("\n");
    return (
        <Document>
            <Page size="A4" style={s8.page}>
                {/* Sidebar */}
                <View style={s8.side}>
                    <Text style={s8.sname}>{data.header?.name}</Text>
                    <Text style={s8.sht}>{data.header?.title}</Text>
                    <Text style={s8.shr}>CONTACT</Text>
                    <View style={s8.sdiv} />
                    <Text style={s8.sbody}>{contact}</Text>
                    {data.header?.links?.linkedin && <Text style={[s8.sbody, { marginTop: 3 }]}><Link src={data.header.links.linkedin} style={s8.slink}>LinkedIn</Link></Text>}
                    {data.header?.links?.github && <Text style={s8.sbody}><Link src={data.header.links.github} style={s8.slink}>GitHub</Link></Text>}
                    {data.header?.links?.portfolio && <Text style={s8.sbody}><Link src={data.header.links.portfolio} style={s8.slink}>Portfolio</Link></Text>}
                    {Array.isArray(data.skills) && data.skills.length > 0 && (<>
                        <Text style={s8.shr}>SKILLS</Text>
                        <View style={s8.sdiv} />
                        {data.skills.map((sk: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 4 : 0 }}>
                                <Text style={s8.slabel}>{sk.label}</Text>
                                <Text style={s8.sbody}>{sk.value}</Text>
                            </View>
                        ))}
                    </>)}
                    {data.education && (data.education.college || data.education.degree) && (<>
                        <Text style={s8.shr}>EDUCATION</Text>
                        <View style={s8.sdiv} />
                        <Text style={s8.slabel}>{data.education.college}</Text>
                        <Text style={s8.sbody}>{data.education.degree}</Text>
                        <Text style={s8.sbody}>{data.education.duration}</Text>
                    </>)}
                </View>
                {/* Main */}
                <View style={s8.main}>
                    {!!data.summary?.trim() && (<><Text style={s8.msh}>PROFESSIONAL SUMMARY</Text><Text style={s8.mbody}>{data.summary}</Text></>)}
                    {Array.isArray(data.experience) && data.experience.length > 0 && (
                        <><Text style={s8.msh}>WORK EXPERIENCE</Text>
                            {data.experience.map((e: any, i: number) => (
                                <View key={i} style={{ marginTop: i > 0 ? 7 : 0 }}>
                                    <View style={s8.mrow}><Text style={s8.mbold}>{e.role}</Text><Text style={s8.mmeta}>{e.duration}</Text></View>
                                    <Text style={s8.mmeta}>{e.company}</Text>
                                    {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                    {e.techStack && <Text style={[s8.mmeta, { marginTop: 2 }]}>Stack: {e.techStack}</Text>}
                                </View>
                            ))}
                        </>
                    )}
                    {Array.isArray(data.projects) && data.projects.length > 0 && (
                        <><Text style={s8.msh}>PROJECTS</Text>
                            {data.projects.map((p: any, i: number) => (
                                <View key={i} style={{ marginTop: i > 0 ? 5 : 0 }}>
                                    <View style={s8.mrow}><Text style={s8.mbold}>{p.name} <Text style={s8.mmeta}>({p.role})</Text></Text><Text style={s8.mmeta}>{p.duration}</Text></View>
                                    {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                    {p.techStack && <Text style={[s8.mmeta, { marginTop: 2 }]}>Stack: {p.techStack}</Text>}
                                </View>
                            ))}
                        </>
                    )}
                </View>
            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 9 — EMERALD CLEAN  (single-col, deep green accent, premium)
// ─────────────────────────────────────────────────────────────────────────────

const s9 = StyleSheet.create({
    page:  { padding: "22 28", backgroundColor: "#fff" },
    name:  { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#064e3b", letterSpacing: 0.2 },
    ht:    { fontSize: 10, fontFamily: "Helvetica", color: "#059669", marginTop: 2 },
    hc:    { fontSize: 9, fontFamily: "Helvetica", color: "#6b7280", marginTop: 4 },
    dbar:  { height: 2, backgroundColor: "#064e3b", marginTop: 8, marginBottom: 1 },
    dthin: { height: 0.5, backgroundColor: "#d1fae5" },
    sh:    { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#064e3b", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 10, marginBottom: 2 },
    row:   { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    bold:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
    body:  { fontSize: 9.5, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.5 },
    meta:  { fontSize: 9, fontFamily: "Helvetica-Oblique", color: "#6b7280" },
    br:    { flexDirection: "row", marginTop: 2 },
    bd:    { width: 10, fontSize: 9.5, color: "#059669" },
    bt:    { flex: 1, fontSize: 9.5, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.45 },
    lnk:   { color: "#059669", textDecoration: "underline" },
});

function T9({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s9.br}><Text style={s9.bd}>•</Text><Text style={s9.bt}>{t}</Text></View>;
    const S = ({ v }: { v: string }) => <><Text style={s9.sh}>{v}</Text><View style={s9.dthin} /></>;
    return (
        <Document>
            <Page size="A4" style={s9.page}>
                <Text style={s9.name}>{data.header?.name}</Text>
                <Text style={s9.ht}>{data.header?.title}</Text>
                <Text style={s9.hc}>
                    {data.header?.contact}
                    {data.header?.links?.linkedin && <Text>{" | "}<Link src={data.header.links.linkedin} style={s9.lnk}>LinkedIn</Link></Text>}
                    {data.header?.links?.github && <Text>{" | "}<Link src={data.header.links.github} style={s9.lnk}>GitHub</Link></Text>}
                    {data.header?.links?.portfolio && <Text>{" | "}<Link src={data.header.links.portfolio} style={s9.lnk}>Portfolio</Link></Text>}
                </Text>
                <View style={s9.dbar} />
                {!!data.summary?.trim() && (<><S v="PROFILE" /><Text style={s9.body}>{data.summary}</Text></>)}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                    <><S v="TECHNICAL SKILLS" />
                        {data.skills.map((sk: any, i: number) => <Text key={i} style={s9.body}><Text style={s9.bold}>{sk.label}: </Text>{sk.value}</Text>)}
                    </>
                )}
                {Array.isArray(data.experience) && data.experience.length > 0 && (
                    <><S v="EXPERIENCE" />
                        {data.experience.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 7 : 0 }}>
                                <View style={s9.row}><Text style={s9.bold}>{e.role} | {e.company}</Text><Text style={s9.meta}>{e.duration}</Text></View>
                                {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                {e.techStack && <Text style={[s9.meta, { marginTop: 2 }]}>Technologies: {e.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {Array.isArray(data.projects) && data.projects.length > 0 && (
                    <><S v="PROJECTS" />
                        {data.projects.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 6 : 0 }}>
                                <View style={s9.row}><Text style={s9.bold}>{p.name} <Text style={s9.meta}>({p.role})</Text></Text><Text style={s9.meta}>{p.duration}</Text></View>
                                {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                {p.techStack && <Text style={[s9.meta, { marginTop: 2 }]}>Stack: {p.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {data.education && (data.education.college || data.education.degree) && (
                    <><S v="EDUCATION" />
                        <View style={s9.row}>
                            <View style={{ flex: 1 }}><Text style={s9.bold}>{data.education.college}</Text><Text style={s9.body}>{data.education.degree}</Text></View>
                            <Text style={s9.meta}>{data.education.duration}</Text>
                        </View>
                    </>
                )}
            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 10 — PURE ATS  (B&W, compact, maximum keyword density)
// ─────────────────────────────────────────────────────────────────────────────

const s10 = StyleSheet.create({
    page:  { padding: "16 24", backgroundColor: "#fff" },
    name:  { fontSize: 17, fontFamily: "Helvetica-Bold", color: "#000", textTransform: "uppercase", letterSpacing: 1.5 },
    ht:    { fontSize: 9.5, fontFamily: "Helvetica", color: "#374151", marginTop: 2 },
    hc:    { fontSize: 8.5, fontFamily: "Helvetica", color: "#6b7280", marginTop: 2 },
    hbar:  { height: 1.5, backgroundColor: "#000", marginTop: 5, marginBottom: 1 },
    sh:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#000", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 7, marginBottom: 0 },
    shbar: { height: 0.5, backgroundColor: "#000", marginTop: 1, marginBottom: 3 },
    row:   { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
    bold:  { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#000" },
    body:  { fontSize: 9, fontFamily: "Helvetica", color: "#1f2937", lineHeight: 1.4 },
    meta:  { fontSize: 8.5, fontFamily: "Helvetica-Oblique", color: "#4b5563" },
    br:    { flexDirection: "row", marginTop: 1.5 },
    bd:    { width: 10, fontSize: 9 },
    bt:    { flex: 1, fontSize: 9, fontFamily: "Helvetica", color: "#1f2937", lineHeight: 1.4 },
    lnk:   { color: "#1d4ed8", textDecoration: "underline" },
});

function T10({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s10.br}><Text style={s10.bd}>•</Text><Text style={s10.bt}>{t}</Text></View>;
    const S = ({ v }: { v: string }) => <><Text style={s10.sh}>{v}</Text><View style={s10.shbar} /></>;
    return (
        <Document>
            <Page size="A4" style={s10.page}>
                <Text style={s10.name}>{data.header?.name}</Text>
                <Text style={s10.ht}>{data.header?.title}</Text>
                <Text style={s10.hc}>
                    {data.header?.contact}
                    {data.header?.links?.linkedin && <Text>{" | "}<Link src={data.header.links.linkedin} style={s10.lnk}>LinkedIn</Link></Text>}
                    {data.header?.links?.github && <Text>{" | "}<Link src={data.header.links.github} style={s10.lnk}>GitHub</Link></Text>}
                    {data.header?.links?.portfolio && <Text>{" | "}<Link src={data.header.links.portfolio} style={s10.lnk}>Portfolio</Link></Text>}
                </Text>
                <View style={s10.hbar} />
                {!!data.summary?.trim() && (<><S v="SUMMARY" /><Text style={s10.body}>{data.summary}</Text></>)}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                    <><S v="SKILLS" />
                        {data.skills.map((sk: any, i: number) => <Text key={i} style={s10.body}><Text style={s10.bold}>{sk.label}: </Text>{sk.value}</Text>)}
                    </>
                )}
                {Array.isArray(data.experience) && data.experience.length > 0 && (
                    <><S v="EXPERIENCE" />
                        {data.experience.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 5 : 0 }}>
                                <View style={s10.row}><Text style={s10.bold}>{e.role}, {e.company}</Text><Text style={s10.meta}>{e.duration}</Text></View>
                                {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                {e.techStack && <Text style={[s10.meta, { marginTop: 2 }]}>Technologies: {e.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {Array.isArray(data.projects) && data.projects.length > 0 && (
                    <><S v="PROJECTS" />
                        {data.projects.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 4 : 0 }}>
                                <View style={s10.row}><Text style={s10.bold}>{p.name} ({p.role})</Text><Text style={s10.meta}>{p.duration}</Text></View>
                                {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                {p.techStack && <Text style={[s10.meta, { marginTop: 2 }]}>Technologies: {p.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {data.education && (data.education.college || data.education.degree) && (
                    <><S v="EDUCATION" />
                        <View style={s10.row}>
                            <View style={{ flex: 1 }}><Text style={s10.bold}>{data.education.college}</Text><Text style={s10.body}>{data.education.degree}</Text></View>
                            <Text style={s10.meta}>{data.education.duration}</Text>
                        </View>
                    </>
                )}
            </Page>
        </Document>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 11 - FAANG FOCUS (single-column, recruiter-first, strong blue scan line)
const s11 = StyleSheet.create({
    page:  { padding: "18 24", backgroundColor: "#fff" },
    head:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    left:  { flex: 1, paddingRight: 12 },
    name:  { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0f172a", letterSpacing: 0.2 },
    ht:    { fontSize: 9.5, fontFamily: "Helvetica", color: "#2563eb", marginTop: 2 },
    hc:    { fontSize: 8.5, fontFamily: "Helvetica", color: "#475569", textAlign: "right", lineHeight: 1.45, width: 180 },
    bar:   { height: 1.5, backgroundColor: "#2563eb", marginTop: 7 },
    thin:  { height: 0.5, backgroundColor: "#bfdbfe", marginBottom: 2 },
    sh:    { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#2563eb", textTransform: "uppercase", letterSpacing: 0.9, marginTop: 8 },
    sl:    { height: 0.5, backgroundColor: "#bfdbfe", marginTop: 2, marginBottom: 3 },
    row:   { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    bold:  { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#0f172a" },
    body:  { fontSize: 9.2, fontFamily: "Helvetica", color: "#334155", lineHeight: 1.45 },
    meta:  { fontSize: 8.6, fontFamily: "Helvetica-Oblique", color: "#64748b" },
    br:    { flexDirection: "row", marginTop: 2 },
    bd:    { width: 10, fontSize: 9.2, color: "#2563eb" },
    bt:    { flex: 1, fontSize: 9.2, fontFamily: "Helvetica", color: "#334155", lineHeight: 1.45 },
    lnk:   { color: "#2563eb", textDecoration: "underline" },
});

function T11({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s11.br}><Text style={s11.bd}>-</Text><Text style={s11.bt}>{t}</Text></View>;
    const S = ({ v }: { v: string }) => <><Text style={s11.sh}>{v}</Text><View style={s11.sl} /></>;
    return (
        <Document>
            <Page size="A4" style={s11.page}>
                <View style={s11.head}>
                    <View style={s11.left}>
                        <Text style={s11.name}>{data.header?.name}</Text>
                        <Text style={s11.ht}>{data.header?.title}</Text>
                    </View>
                    <Text style={s11.hc}>
                        {data.header?.contact}
                        {data.header?.links?.linkedin && <Text>{" | "}<Link src={data.header.links.linkedin} style={s11.lnk}>LinkedIn</Link></Text>}
                        {data.header?.links?.github && <Text>{" | "}<Link src={data.header.links.github} style={s11.lnk}>GitHub</Link></Text>}
                        {data.header?.links?.portfolio && <Text>{" | "}<Link src={data.header.links.portfolio} style={s11.lnk}>Portfolio</Link></Text>}
                    </Text>
                </View>
                <View style={s11.bar} />
                <View style={s11.thin} />
                {!!data.summary?.trim() && (<><S v="Professional Summary" /><Text style={s11.body}>{data.summary}</Text></>)}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                    <><S v="Core Stack" />
                        {data.skills.map((sk: any, i: number) => (
                            <Text key={i} style={s11.body}><Text style={s11.bold}>{sk.label}: </Text>{sk.value}</Text>
                        ))}
                    </>
                )}
                {Array.isArray(data.experience) && data.experience.length > 0 && (
                    <><S v="Professional Experience" />
                        {data.experience.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 6 : 0 }}>
                                <View style={s11.row}><Text style={s11.bold}>{e.role}</Text><Text style={s11.meta}>{e.duration}</Text></View>
                                <Text style={s11.body}>{e.company}</Text>
                                {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                {e.techStack && <Text style={[s11.meta, { marginTop: 2 }]}>Tech: {e.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {Array.isArray(data.projects) && data.projects.length > 0 && (
                    <><S v="Projects" />
                        {data.projects.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 5 : 0 }}>
                                <View style={s11.row}><Text style={s11.bold}>{p.name}</Text><Text style={s11.meta}>{p.duration}</Text></View>
                                <Text style={s11.meta}>{p.role}</Text>
                                {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                {p.techStack && <Text style={[s11.meta, { marginTop: 2 }]}>Tech: {p.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {data.education && (data.education.college || data.education.degree) && (
                    <><S v="Education" />
                        <View style={s11.row}>
                            <View style={{ flex: 1 }}><Text style={s11.bold}>{data.education.college}</Text><Text style={s11.body}>{data.education.degree}</Text></View>
                            <Text style={s11.meta}>{data.education.duration}</Text>
                        </View>
                    </>
                )}
            </Page>
        </Document>
    );
}

// TEMPLATE 12 - MAANG SLATE (centered header, calm slate-green accents, clean spacing)
const s12 = StyleSheet.create({
    page:  { padding: "20 28", backgroundColor: "#fff" },
    hdr:   { alignItems: "center", borderBottomWidth: 0.8, borderBottomColor: "#d1d5db", paddingBottom: 8 },
    name:  { fontSize: 21, fontFamily: "Helvetica-Bold", color: "#111827", letterSpacing: 0.4 },
    ht:    { fontSize: 9.8, fontFamily: "Helvetica", color: "#0f766e", marginTop: 2 },
    hc:    { fontSize: 8.7, fontFamily: "Helvetica", color: "#6b7280", marginTop: 4, textAlign: "center", lineHeight: 1.4 },
    accent:{ width: 62, height: 2, backgroundColor: "#0f766e", marginTop: 6 },
    srow:  { flexDirection: "row", alignItems: "center", marginTop: 9, marginBottom: 3 },
    dot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: "#0f766e", marginRight: 6 },
    sh:    { fontSize: 9.3, fontFamily: "Helvetica-Bold", color: "#0f172a", textTransform: "uppercase", letterSpacing: 1.1 },
    row:   { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    bold:  { fontSize: 9.4, fontFamily: "Helvetica-Bold", color: "#111827" },
    body:  { fontSize: 9.3, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.5 },
    meta:  { fontSize: 8.7, fontFamily: "Helvetica-Oblique", color: "#6b7280" },
    br:    { flexDirection: "row", marginTop: 2 },
    bd:    { width: 10, fontSize: 9.3, color: "#0f766e" },
    bt:    { flex: 1, fontSize: 9.3, fontFamily: "Helvetica", color: "#374151", lineHeight: 1.5 },
    lnk:   { color: "#0f766e", textDecoration: "underline" },
});

function T12({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s12.br}><Text style={s12.bd}>{">"}</Text><Text style={s12.bt}>{t}</Text></View>;
    const S = ({ v }: { v: string }) => <View style={s12.srow}><View style={s12.dot} /><Text style={s12.sh}>{v}</Text></View>;
    return (
        <Document>
            <Page size="A4" style={s12.page}>
                <View style={s12.hdr}>
                    <Text style={s12.name}>{data.header?.name}</Text>
                    <Text style={s12.ht}>{data.header?.title}</Text>
                    <Text style={s12.hc}>
                        {data.header?.contact}
                        {data.header?.links?.linkedin && <Text>{" | "}<Link src={data.header.links.linkedin} style={s12.lnk}>LinkedIn</Link></Text>}
                        {data.header?.links?.github && <Text>{" | "}<Link src={data.header.links.github} style={s12.lnk}>GitHub</Link></Text>}
                        {data.header?.links?.portfolio && <Text>{" | "}<Link src={data.header.links.portfolio} style={s12.lnk}>Portfolio</Link></Text>}
                    </Text>
                    <View style={s12.accent} />
                </View>
                {!!data.summary?.trim() && (<><S v="Summary" /><Text style={s12.body}>{data.summary}</Text></>)}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                    <><S v="Technical Skills" />
                        {data.skills.map((sk: any, i: number) => (
                            <Text key={i} style={s12.body}><Text style={s12.bold}>{sk.label}: </Text>{sk.value}</Text>
                        ))}
                    </>
                )}
                {Array.isArray(data.experience) && data.experience.length > 0 && (
                    <><S v="Experience" />
                        {data.experience.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 6 : 0 }}>
                                <View style={s12.row}><Text style={s12.bold}>{e.role} | {e.company}</Text><Text style={s12.meta}>{e.duration}</Text></View>
                                {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                {e.techStack && <Text style={[s12.meta, { marginTop: 2 }]}>Technologies: {e.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {Array.isArray(data.projects) && data.projects.length > 0 && (
                    <><S v="Projects" />
                        {data.projects.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 5 : 0 }}>
                                <View style={s12.row}><Text style={s12.bold}>{p.name} ({p.role})</Text><Text style={s12.meta}>{p.duration}</Text></View>
                                {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                {p.techStack && <Text style={[s12.meta, { marginTop: 2 }]}>Stack: {p.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {data.education && (data.education.college || data.education.degree) && (
                    <><S v="Education" />
                        <View style={s12.row}>
                            <View style={{ flex: 1 }}><Text style={s12.bold}>{data.education.college}</Text><Text style={s12.body}>{data.education.degree}</Text></View>
                            <Text style={s12.meta}>{data.education.duration}</Text>
                        </View>
                    </>
                )}
            </Page>
        </Document>
    );
}

// TEMPLATE 13 - PLATFORM PRIME (section-band layout for systems and backend resumes)
const s13 = StyleSheet.create({
    page:  { padding: "20 24", backgroundColor: "#fff" },
    name:  { fontSize: 21, fontFamily: "Helvetica-Bold", color: "#0f172a" },
    ht:    { fontSize: 9.5, fontFamily: "Helvetica", color: "#475569", marginTop: 2 },
    hc:    { fontSize: 8.6, fontFamily: "Helvetica", color: "#64748b", marginTop: 4, lineHeight: 1.45 },
    top:   { height: 2.5, backgroundColor: "#475569", marginTop: 7, marginBottom: 5 },
    sw:    { backgroundColor: "#f1f5f9", padding: "4 6", marginTop: 8, marginBottom: 3, borderLeftWidth: 2, borderLeftColor: "#475569" },
    sh:    { fontSize: 9.2, fontFamily: "Helvetica-Bold", color: "#1e293b", textTransform: "uppercase", letterSpacing: 0.9 },
    row:   { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    bold:  { fontSize: 9.4, fontFamily: "Helvetica-Bold", color: "#0f172a" },
    body:  { fontSize: 9.2, fontFamily: "Helvetica", color: "#334155", lineHeight: 1.45 },
    meta:  { fontSize: 8.6, fontFamily: "Helvetica-Oblique", color: "#64748b" },
    br:    { flexDirection: "row", marginTop: 2 },
    bd:    { width: 10, fontSize: 9.2, color: "#475569" },
    bt:    { flex: 1, fontSize: 9.2, fontFamily: "Helvetica", color: "#334155", lineHeight: 1.45 },
    lnk:   { color: "#334155", textDecoration: "underline" },
});

function T13({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s13.br}><Text style={s13.bd}>-</Text><Text style={s13.bt}>{t}</Text></View>;
    const S = ({ v }: { v: string }) => <View style={s13.sw}><Text style={s13.sh}>{v}</Text></View>;
    return (
        <Document>
            <Page size="A4" style={s13.page}>
                <Text style={s13.name}>{data.header?.name}</Text>
                <Text style={s13.ht}>{data.header?.title}</Text>
                <Text style={s13.hc}>
                    {data.header?.contact}
                    {data.header?.links?.linkedin && <Text>{" | "}<Link src={data.header.links.linkedin} style={s13.lnk}>LinkedIn</Link></Text>}
                    {data.header?.links?.github && <Text>{" | "}<Link src={data.header.links.github} style={s13.lnk}>GitHub</Link></Text>}
                    {data.header?.links?.portfolio && <Text>{" | "}<Link src={data.header.links.portfolio} style={s13.lnk}>Portfolio</Link></Text>}
                </Text>
                <View style={s13.top} />
                {!!data.summary?.trim() && (<><S v="Summary" /><Text style={s13.body}>{data.summary}</Text></>)}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                    <><S v="Skills" />
                        {data.skills.map((sk: any, i: number) => (
                            <Text key={i} style={s13.body}><Text style={s13.bold}>{sk.label}: </Text>{sk.value}</Text>
                        ))}
                    </>
                )}
                {Array.isArray(data.experience) && data.experience.length > 0 && (
                    <><S v="Experience" />
                        {data.experience.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 6 : 0 }}>
                                <View style={s13.row}><Text style={s13.bold}>{e.role}</Text><Text style={s13.meta}>{e.duration}</Text></View>
                                <Text style={s13.meta}>{e.company}</Text>
                                {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                {e.techStack && <Text style={[s13.meta, { marginTop: 2 }]}>Platforms: {e.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {Array.isArray(data.projects) && data.projects.length > 0 && (
                    <><S v="Projects" />
                        {data.projects.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 5 : 0 }}>
                                <View style={s13.row}><Text style={s13.bold}>{p.name}</Text><Text style={s13.meta}>{p.duration}</Text></View>
                                <Text style={s13.meta}>{p.role}</Text>
                                {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                {p.techStack && <Text style={[s13.meta, { marginTop: 2 }]}>Stack: {p.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {data.education && (data.education.college || data.education.degree) && (
                    <><S v="Education" />
                        <View style={s13.row}>
                            <View style={{ flex: 1 }}><Text style={s13.bold}>{data.education.college}</Text><Text style={s13.body}>{data.education.degree}</Text></View>
                            <Text style={s13.meta}>{data.education.duration}</Text>
                        </View>
                    </>
                )}
            </Page>
        </Document>
    );
}

// TEMPLATE 14 - RECRUITER SCAN (summary highlight box, impact-first and easy to skim)
const s14 = StyleSheet.create({
    page:   { padding: "18 24", backgroundColor: "#fff" },
    hdr:    { borderBottomWidth: 1.2, borderBottomColor: "#1d4ed8", paddingBottom: 7 },
    name:   { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0f172a" },
    ht:     { fontSize: 9.4, fontFamily: "Helvetica", color: "#1d4ed8", marginTop: 2 },
    hc:     { fontSize: 8.6, fontFamily: "Helvetica", color: "#64748b", marginTop: 4, lineHeight: 1.4 },
    box:    { borderLeftWidth: 3, borderLeftColor: "#1d4ed8", backgroundColor: "#eff6ff", padding: "6 8", marginTop: 8 },
    sh:     { fontSize: 9.2, fontFamily: "Helvetica-Bold", color: "#0f172a", textTransform: "uppercase", letterSpacing: 1, marginTop: 8, marginBottom: 2 },
    sl:     { height: 0.5, backgroundColor: "#bfdbfe", marginBottom: 3 },
    row:    { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    bold:   { fontSize: 9.4, fontFamily: "Helvetica-Bold", color: "#0f172a" },
    body:   { fontSize: 9.1, fontFamily: "Helvetica", color: "#334155", lineHeight: 1.45 },
    meta:   { fontSize: 8.5, fontFamily: "Helvetica-Oblique", color: "#64748b" },
    br:     { flexDirection: "row", marginTop: 2 },
    bd:     { width: 10, fontSize: 9.1, color: "#1d4ed8" },
    bt:     { flex: 1, fontSize: 9.1, fontFamily: "Helvetica", color: "#334155", lineHeight: 1.45 },
    lnk:    { color: "#1d4ed8", textDecoration: "underline" },
});

function T14({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s14.br}><Text style={s14.bd}>-</Text><Text style={s14.bt}>{t}</Text></View>;
    const S = ({ v }: { v: string }) => <><Text style={s14.sh}>{v}</Text><View style={s14.sl} /></>;
    return (
        <Document>
            <Page size="A4" style={s14.page}>
                <View style={s14.hdr}>
                    <Text style={s14.name}>{data.header?.name}</Text>
                    <Text style={s14.ht}>{data.header?.title}</Text>
                    <Text style={s14.hc}>
                        {data.header?.contact}
                        {data.header?.links?.linkedin && <Text>{" | "}<Link src={data.header.links.linkedin} style={s14.lnk}>LinkedIn</Link></Text>}
                        {data.header?.links?.github && <Text>{" | "}<Link src={data.header.links.github} style={s14.lnk}>GitHub</Link></Text>}
                        {data.header?.links?.portfolio && <Text>{" | "}<Link src={data.header.links.portfolio} style={s14.lnk}>Portfolio</Link></Text>}
                    </Text>
                </View>
                {!!data.summary?.trim() && (
                    <>
                        <S v="Summary" />
                        <View style={s14.box}><Text style={s14.body}>{data.summary}</Text></View>
                    </>
                )}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                    <><S v="Technical Skills" />
                        {data.skills.map((sk: any, i: number) => (
                            <Text key={i} style={s14.body}><Text style={s14.bold}>{sk.label}: </Text>{sk.value}</Text>
                        ))}
                    </>
                )}
                {Array.isArray(data.experience) && data.experience.length > 0 && (
                    <><S v="Experience" />
                        {data.experience.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 6 : 0 }}>
                                <View style={s14.row}><Text style={s14.bold}>{e.role} - {e.company}</Text><Text style={s14.meta}>{e.duration}</Text></View>
                                {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                {e.techStack && <Text style={[s14.meta, { marginTop: 2 }]}>Technologies: {e.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {Array.isArray(data.projects) && data.projects.length > 0 && (
                    <><S v="Projects" />
                        {data.projects.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 5 : 0 }}>
                                <View style={s14.row}><Text style={s14.bold}>{p.name}</Text><Text style={s14.meta}>{p.duration}</Text></View>
                                <Text style={s14.meta}>{p.role}</Text>
                                {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                {p.techStack && <Text style={[s14.meta, { marginTop: 2 }]}>Stack: {p.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {data.education && (data.education.college || data.education.degree) && (
                    <><S v="Education" />
                        <View style={s14.row}>
                            <View style={{ flex: 1 }}><Text style={s14.bold}>{data.education.college}</Text><Text style={s14.body}>{data.education.degree}</Text></View>
                            <Text style={s14.meta}>{data.education.duration}</Text>
                        </View>
                    </>
                )}
            </Page>
        </Document>
    );
}

// TEMPLATE 15 - SDE COMPACT (black-and-white, dense and ATS-maximised)
const s15 = StyleSheet.create({
    page:  { padding: "15 22", backgroundColor: "#fff" },
    name:  { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#000", textTransform: "uppercase", letterSpacing: 1.2 },
    ht:    { fontSize: 9, fontFamily: "Helvetica", color: "#1f2937", marginTop: 1.5 },
    hc:    { fontSize: 8.2, fontFamily: "Helvetica", color: "#4b5563", marginTop: 2, lineHeight: 1.35 },
    bar:   { height: 1.4, backgroundColor: "#000", marginTop: 4, marginBottom: 1 },
    sh:    { fontSize: 9.2, fontFamily: "Helvetica-Bold", color: "#000", textTransform: "uppercase", letterSpacing: 1, marginTop: 6 },
    sl:    { height: 0.5, backgroundColor: "#000", marginTop: 1, marginBottom: 2 },
    row:   { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
    bold:  { fontSize: 9.1, fontFamily: "Helvetica-Bold", color: "#000" },
    body:  { fontSize: 8.8, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.35 },
    meta:  { fontSize: 8.2, fontFamily: "Helvetica-Oblique", color: "#4b5563" },
    br:    { flexDirection: "row", marginTop: 1.5 },
    bd:    { width: 8, fontSize: 8.8, color: "#000" },
    bt:    { flex: 1, fontSize: 8.8, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.35 },
    lnk:   { color: "#1d4ed8", textDecoration: "underline" },
});

function T15({ data }: { data: any }) {
    const B = ({ t }: { t: string }) => <View style={s15.br}><Text style={s15.bd}>-</Text><Text style={s15.bt}>{t}</Text></View>;
    const S = ({ v }: { v: string }) => <><Text style={s15.sh}>{v}</Text><View style={s15.sl} /></>;
    return (
        <Document>
            <Page size="A4" style={s15.page}>
                <Text style={s15.name}>{data.header?.name}</Text>
                <Text style={s15.ht}>{data.header?.title}</Text>
                <Text style={s15.hc}>
                    {data.header?.contact}
                    {data.header?.links?.linkedin && <Text>{" | "}<Link src={data.header.links.linkedin} style={s15.lnk}>LinkedIn</Link></Text>}
                    {data.header?.links?.github && <Text>{" | "}<Link src={data.header.links.github} style={s15.lnk}>GitHub</Link></Text>}
                    {data.header?.links?.portfolio && <Text>{" | "}<Link src={data.header.links.portfolio} style={s15.lnk}>Portfolio</Link></Text>}
                </Text>
                <View style={s15.bar} />
                {!!data.summary?.trim() && (<><S v="Summary" /><Text style={s15.body}>{data.summary}</Text></>)}
                {Array.isArray(data.skills) && data.skills.length > 0 && (
                    <><S v="Skills" />
                        {data.skills.map((sk: any, i: number) => (
                            <Text key={i} style={s15.body}><Text style={s15.bold}>{sk.label}: </Text>{sk.value}</Text>
                        ))}
                    </>
                )}
                {Array.isArray(data.experience) && data.experience.length > 0 && (
                    <><S v="Experience" />
                        {data.experience.map((e: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 4 : 0 }}>
                                <View style={s15.row}><Text style={s15.bold}>{e.role}, {e.company}</Text><Text style={s15.meta}>{e.duration}</Text></View>
                                {e.points?.map((p: string, j: number) => p && <B key={j} t={p} />)}
                                {e.techStack && <Text style={[s15.meta, { marginTop: 1.5 }]}>Tech: {e.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {Array.isArray(data.projects) && data.projects.length > 0 && (
                    <><S v="Projects" />
                        {data.projects.map((p: any, i: number) => (
                            <View key={i} style={{ marginTop: i > 0 ? 3 : 0 }}>
                                <View style={s15.row}><Text style={s15.bold}>{p.name} ({p.role})</Text><Text style={s15.meta}>{p.duration}</Text></View>
                                {p.points?.map((pt: string, j: number) => pt && <B key={j} t={pt} />)}
                                {p.techStack && <Text style={[s15.meta, { marginTop: 1.5 }]}>Tech: {p.techStack}</Text>}
                            </View>
                        ))}
                    </>
                )}
                {data.education && (data.education.college || data.education.degree) && (
                    <><S v="Education" />
                        <View style={s15.row}>
                            <View style={{ flex: 1 }}><Text style={s15.bold}>{data.education.college}</Text><Text style={s15.body}>{data.education.degree}</Text></View>
                            <Text style={s15.meta}>{data.education.duration}</Text>
                        </View>
                    </>
                )}
            </Page>
        </Document>
    );
}

// TEMPLATE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

type TemplateId = "classic" | "modern" | "professional" | "minimal" | "executive" | "tech" | "sidebar-teal" | "sidebar-navy" | "emerald" | "ats" | "faang-focus" | "maang-slate" | "platform-prime" | "recruiter-scan" | "sde-compact" | ExtraTemplateId;

interface TemplateInfo {
    id:          TemplateId;
    name:        string;
    description: string;
    accent:      string;
    bg:          string;
    component:   React.ComponentType<{ data: any }>;
    thumb:       React.ReactNode;
    /** Premium templates require an active subscription to download. */
    premium:     boolean;
}

const BASE_TEMPLATES: TemplateInfo[] = [
    {
        id: "classic", name: "Classic", description: "Serif, centered — timeless ATS pick",
        accent: "#1e293b", bg: "#f8fafc", component: T1, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col items-center pt-2 px-2 gap-1">
                <div className="h-2 w-20 bg-gray-800 rounded-sm" />
                <div className="h-px w-full bg-gray-400 my-0.5" />
                <div className="h-1.5 w-28 bg-gray-500 rounded-sm" />
                <div className="h-1 w-24 bg-gray-400 rounded-sm" />
                <div className="w-full mt-1.5 flex flex-col gap-0.5">
                    <div className="h-1 w-12 bg-gray-700 rounded-sm" /><div className="h-px w-full bg-gray-300" />
                    <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                </div>
                <div className="w-full mt-1 flex flex-col gap-0.5">
                    <div className="h-1 w-14 bg-gray-700 rounded-sm" /><div className="h-px w-full bg-gray-300" />
                    <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-3/4 bg-gray-300 rounded-sm" />
                </div>
            </div>
        ),
    },
    {
        id: "modern", name: "Modern Teal", description: "Sans-serif, teal accents, clean",
        accent: "#0d9488", bg: "#f0fdfa", component: T2, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col">
                <div className="h-1.5 w-full bg-teal-500" />
                <div className="flex flex-col px-2 pt-1.5 gap-0.5">
                    <div className="h-2.5 w-20 bg-teal-600 rounded-sm" />
                    <div className="h-1 w-28 bg-gray-400 rounded-sm" /><div className="h-1 w-24 bg-gray-300 rounded-sm" />
                    <div className="h-px w-full bg-teal-200 mt-0.5" />
                    <div className="h-1 w-10 bg-teal-600 rounded-sm mt-0.5" />
                    <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                    <div className="h-px w-full bg-teal-200 mt-0.5" />
                    <div className="h-1 w-14 bg-teal-600 rounded-sm mt-0.5" />
                    <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-3/4 bg-gray-300 rounded-sm" />
                </div>
            </div>
        ),
    },
    {
        id: "professional", name: "Professional", description: "Dark header band, structured",
        accent: "#1e3a5f", bg: "#eff6ff", component: T3, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col">
                <div className="bg-blue-900 px-2 py-2 flex flex-col gap-0.5">
                    <div className="h-2 w-20 bg-white/80 rounded-sm" />
                    <div className="h-1 w-28 bg-blue-300 rounded-sm" /><div className="h-1 w-20 bg-blue-400/60 rounded-sm" />
                </div>
                <div className="flex flex-col px-2 pt-1.5 gap-0.5">
                    <div className="h-1 w-24 bg-blue-900 rounded-sm border-b border-blue-800" />
                    <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                    <div className="h-1 w-20 bg-blue-900 rounded-sm mt-0.5 border-b border-blue-800" />
                    <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-3/4 bg-gray-300 rounded-sm" />
                </div>
            </div>
        ),
    },
    {
        id: "minimal", name: "Minimal", description: "Ultra-clean, generous whitespace",
        accent: "#6b7280", bg: "#f9fafb", component: T4, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col px-3 pt-3 gap-1">
                <div className="h-3 w-24 bg-gray-900 rounded-sm" />
                <div className="h-1 w-28 bg-gray-400 rounded-sm" /><div className="h-1 w-20 bg-gray-300 rounded-sm" />
                <div className="h-px w-full bg-gray-200 mt-1.5" />
                <div className="h-0.5 w-10 bg-gray-300 rounded-sm mt-1" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                <div className="h-0.5 w-12 bg-gray-300 rounded-sm mt-1.5" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-2/3 bg-gray-300 rounded-sm" />
            </div>
        ),
    },
    {
        id: "executive", name: "Executive", description: "Bold serif, warm tones, premium",
        accent: "#b45309", bg: "#fef3c7", component: T5, premium: true,
        thumb: (
            <div className="w-full h-full bg-stone-50 flex flex-col items-center pt-2 px-2 gap-0.5">
                <div className="h-2.5 w-24 bg-stone-800 rounded-sm" />
                <div className="h-0.5 w-10 bg-amber-600 my-0.5" />
                <div className="h-1.5 w-28 bg-amber-700/60 rounded-sm" /><div className="h-1 w-20 bg-stone-400 rounded-sm" />
                <div className="h-px w-full bg-stone-300 mt-1" />
                <div className="w-full flex flex-col gap-0.5 mt-0.5">
                    <div className="h-1 w-16 bg-stone-700 rounded-sm" /><div className="h-px w-full bg-stone-300" />
                    <div className="h-1 w-full bg-stone-300 rounded-sm" /><div className="h-1 w-4/5 bg-stone-300 rounded-sm" />
                </div>
                <div className="w-full flex flex-col gap-0.5 mt-0.5">
                    <div className="h-1 w-20 bg-stone-700 rounded-sm" /><div className="h-px w-full bg-stone-300" />
                    <div className="h-1 w-full bg-stone-300 rounded-sm" />
                </div>
            </div>
        ),
    },
    {
        id: "tech", name: "Tech / ATS", description: "Violet accent bar, ATS-optimised",
        accent: "#7c3aed", bg: "#f5f3ff", component: T6, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col px-2 pt-2 gap-0.5">
                <div className="flex items-center gap-1">
                    <div className="w-1 h-6 bg-violet-600 rounded-sm shrink-0" />
                    <div className="flex flex-col gap-0.5">
                        <div className="h-2 w-20 bg-gray-900 rounded-sm" /><div className="h-1 w-24 bg-violet-500 rounded-sm" />
                    </div>
                </div>
                <div className="h-1 w-full bg-gray-300 rounded-sm" />
                <div className="h-px w-full bg-gray-200 my-0.5" />
                <div className="flex items-center gap-1"><div className="w-0.5 h-2.5 bg-violet-600 rounded-sm" /><div className="h-1 w-12 bg-gray-800 rounded-sm" /></div>
                <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                <div className="flex items-center gap-1 mt-0.5"><div className="w-0.5 h-2.5 bg-violet-600 rounded-sm" /><div className="h-1 w-16 bg-gray-800 rounded-sm" /></div>
                <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-3/4 bg-gray-300 rounded-sm" />
            </div>
        ),
    },
    {
        id: "sidebar-teal", name: "Sidebar Teal", description: "2-col teal sidebar, ATS-safe",
        accent: "#0f766e", bg: "#f0fdf4", component: T7, premium: true,
        thumb: (
            <div className="w-full h-full flex">
                <div className="w-[35%] bg-teal-700 px-1.5 py-2 flex flex-col gap-0.5">
                    <div className="h-2 w-12 bg-white/80 rounded-sm" />
                    <div className="h-1 w-14 bg-teal-300/70 rounded-sm" />
                    <div className="h-px w-full bg-teal-500/50 mt-1" />
                    <div className="h-0.5 w-8 bg-teal-300 rounded-sm mt-0.5" />
                    <div className="h-1 w-full bg-teal-400/50 rounded-sm" />
                    <div className="h-1 w-full bg-teal-400/50 rounded-sm" />
                    <div className="h-px w-full bg-teal-500/50 mt-0.5" />
                    <div className="h-0.5 w-7 bg-teal-300 rounded-sm mt-0.5" />
                    <div className="h-1 w-full bg-teal-400/50 rounded-sm" />
                    <div className="h-1 w-3/4 bg-teal-400/50 rounded-sm" />
                </div>
                <div className="flex-1 px-1.5 py-2 flex flex-col gap-0.5 bg-white">
                    <div className="h-1 w-14 bg-teal-700 rounded-sm" />
                    <div className="h-px w-full bg-teal-200" />
                    <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                    <div className="h-1 w-14 bg-teal-700 rounded-sm mt-0.5" />
                    <div className="h-px w-full bg-teal-200" />
                    <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-3/4 bg-gray-300 rounded-sm" />
                </div>
            </div>
        ),
    },
    {
        id: "sidebar-navy", name: "Sidebar Navy", description: "2-col dark sidebar, indigo accents",
        accent: "#4f46e5", bg: "#eef2ff", component: T8, premium: true,
        thumb: (
            <div className="w-full h-full flex">
                <div className="w-[32%] bg-slate-800 px-1.5 py-2 flex flex-col gap-0.5">
                    <div className="h-2 w-10 bg-white/80 rounded-sm" />
                    <div className="h-1 w-12 bg-slate-400/60 rounded-sm" />
                    <div className="h-px w-full bg-slate-600 mt-1" />
                    <div className="h-0.5 w-7 bg-slate-400 rounded-sm mt-0.5" />
                    <div className="h-1 w-full bg-slate-500/50 rounded-sm" />
                    <div className="h-1 w-4/5 bg-slate-500/50 rounded-sm" />
                    <div className="h-px w-full bg-slate-600 mt-0.5" />
                    <div className="h-0.5 w-6 bg-slate-400 rounded-sm mt-0.5" />
                    <div className="h-1 w-full bg-slate-500/50 rounded-sm" />
                    <div className="h-1 w-2/3 bg-slate-500/50 rounded-sm" />
                </div>
                <div className="flex-1 px-1.5 py-2 flex flex-col gap-0.5 bg-white">
                    <div className="h-1 w-20 bg-slate-800 rounded-sm" />
                    <div className="h-0.5 w-full bg-indigo-500 rounded-sm" />
                    <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                    <div className="h-1 w-16 bg-slate-800 rounded-sm mt-0.5" />
                    <div className="h-0.5 w-full bg-indigo-500 rounded-sm" />
                    <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-3/4 bg-gray-300 rounded-sm" />
                </div>
            </div>
        ),
    },
    {
        id: "emerald", name: "Emerald Clean", description: "Deep green accent, bold header bar",
        accent: "#059669", bg: "#ecfdf5", component: T9, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col px-2 pt-2 gap-0.5">
                <div className="h-2.5 w-24 bg-emerald-900 rounded-sm" />
                <div className="h-1 w-28 bg-emerald-600 rounded-sm" />
                <div className="h-1 w-20 bg-gray-300 rounded-sm" />
                <div className="h-0.5 w-full bg-emerald-900 mt-0.5" />
                <div className="h-0.5 w-10 bg-emerald-800 rounded-sm mt-0.5" />
                <div className="h-px w-full bg-emerald-100" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                <div className="h-0.5 w-14 bg-emerald-800 rounded-sm mt-0.5" />
                <div className="h-px w-full bg-emerald-100" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-3/4 bg-gray-300 rounded-sm" />
            </div>
        ),
    },
    {
        id: "ats", name: "Pure ATS", description: "B&W, max density, ATS-optimised",
        accent: "#111827", bg: "#f9fafb", component: T10, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col px-2 pt-2 gap-0.5">
                <div className="h-2 w-20 bg-black rounded-sm" />
                <div className="h-1 w-24 bg-gray-400 rounded-sm" /><div className="h-1 w-20 bg-gray-300 rounded-sm" />
                <div className="h-0.5 w-full bg-black mt-0.5" />
                <div className="h-0.5 w-10 bg-black rounded-sm mt-0.5" />
                <div className="h-px w-full bg-black" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                <div className="h-0.5 w-12 bg-black rounded-sm mt-0.5" />
                <div className="h-px w-full bg-black" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" /><div className="h-1 w-3/4 bg-gray-300 rounded-sm" />
            </div>
        ),
    },
    {
        id: "faang-focus", name: "FAANG Focus", description: "Single-column, recruiter-first, blue scan line",
        accent: "#2563eb", bg: "#eff6ff", component: T11, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col px-2 pt-2 gap-0.5">
                <div className="flex justify-between items-start gap-1">
                    <div className="flex flex-col gap-0.5 flex-1">
                        <div className="h-2 w-16 bg-slate-900 rounded-sm" />
                        <div className="h-1 w-20 bg-blue-600 rounded-sm" />
                    </div>
                    <div className="flex flex-col gap-0.5 w-10">
                        <div className="h-1 w-full bg-gray-300 rounded-sm" />
                        <div className="h-1 w-full bg-gray-300 rounded-sm" />
                    </div>
                </div>
                <div className="h-0.5 w-full bg-blue-600 mt-0.5" />
                <div className="h-px w-full bg-blue-200" />
                <div className="h-1 w-12 bg-blue-700 rounded-sm mt-0.5" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" />
                <div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                <div className="h-1 w-16 bg-blue-700 rounded-sm mt-0.5" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" />
                <div className="h-1 w-3/4 bg-gray-300 rounded-sm" />
            </div>
        ),
    },
    {
        id: "maang-slate", name: "MAANG Slate", description: "Centered header, calm slate-green, clean scan",
        accent: "#0f766e", bg: "#f0fdfa", component: T12, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col items-center px-2 pt-2 gap-0.5">
                <div className="h-2 w-20 bg-slate-900 rounded-sm" />
                <div className="h-1 w-24 bg-teal-700 rounded-sm" />
                <div className="h-1 w-20 bg-gray-300 rounded-sm" />
                <div className="h-0.5 w-10 bg-teal-700 mt-0.5 rounded-sm" />
                <div className="h-px w-full bg-gray-300 mt-0.5" />
                <div className="flex items-center gap-1 w-full mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-700" />
                    <div className="h-1 w-14 bg-slate-800 rounded-sm" />
                </div>
                <div className="h-1 w-full bg-gray-300 rounded-sm" />
                <div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                <div className="flex items-center gap-1 w-full mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-700" />
                    <div className="h-1 w-16 bg-slate-800 rounded-sm" />
                </div>
                <div className="h-1 w-full bg-gray-300 rounded-sm" />
            </div>
        ),
    },
    {
        id: "platform-prime", name: "Platform Prime", description: "Section bands, systems-role friendly, ATS-safe",
        accent: "#475569", bg: "#f8fafc", component: T13, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col px-2 pt-2 gap-0.5">
                <div className="h-2 w-20 bg-slate-900 rounded-sm" />
                <div className="h-1 w-24 bg-slate-500 rounded-sm" />
                <div className="h-1 w-20 bg-gray-300 rounded-sm" />
                <div className="h-0.5 w-full bg-slate-600 mt-0.5" />
                <div className="bg-slate-100 border-l-2 border-slate-600 px-1 py-0.5 mt-0.5">
                    <div className="h-1 w-12 bg-slate-800 rounded-sm" />
                </div>
                <div className="h-1 w-full bg-gray-300 rounded-sm" />
                <div className="h-1 w-4/5 bg-gray-300 rounded-sm" />
                <div className="bg-slate-100 border-l-2 border-slate-600 px-1 py-0.5 mt-0.5">
                    <div className="h-1 w-16 bg-slate-800 rounded-sm" />
                </div>
                <div className="h-1 w-full bg-gray-300 rounded-sm" />
            </div>
        ),
    },
    {
        id: "recruiter-scan", name: "Recruiter Scan", description: "Impact box + fast skim layout for hiring loops",
        accent: "#1d4ed8", bg: "#eef2ff", component: T14, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col px-2 pt-2 gap-0.5">
                <div className="h-2 w-20 bg-slate-900 rounded-sm" />
                <div className="h-1 w-24 bg-blue-700 rounded-sm" />
                <div className="h-1 w-20 bg-gray-300 rounded-sm" />
                <div className="h-px w-full bg-blue-600 mt-0.5" />
                <div className="border-l-2 border-blue-600 bg-blue-50 px-1 py-0.5 mt-0.5">
                    <div className="h-1 w-full bg-gray-300 rounded-sm" />
                    <div className="h-1 w-4/5 bg-gray-300 rounded-sm mt-0.5" />
                </div>
                <div className="h-1 w-14 bg-slate-800 rounded-sm mt-0.5" />
                <div className="h-px w-full bg-blue-200" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" />
                <div className="h-1 w-3/4 bg-gray-300 rounded-sm" />
            </div>
        ),
    },
    {
        id: "sde-compact", name: "SDE Compact", description: "Dense black-and-white ATS maximiser",
        accent: "#111827", bg: "#f9fafb", component: T15, premium: true,
        thumb: (
            <div className="w-full h-full bg-white flex flex-col px-2 pt-2 gap-0.5">
                <div className="h-2 w-20 bg-black rounded-sm" />
                <div className="h-1 w-24 bg-gray-500 rounded-sm" />
                <div className="h-1 w-20 bg-gray-400 rounded-sm" />
                <div className="h-0.5 w-full bg-black mt-0.5" />
                <div className="h-1 w-10 bg-black rounded-sm mt-0.5" />
                <div className="h-px w-full bg-black" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" />
                <div className="h-1 w-12 bg-black rounded-sm mt-0.5" />
                <div className="h-px w-full bg-black" />
                <div className="h-1 w-full bg-gray-300 rounded-sm" />
            </div>
        ),
    },
];

const TEMPLATES: TemplateInfo[] = [...BASE_TEMPLATES, ...EXTRA_TEMPLATES];

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_DATA = {
    header: {
        name: "ESWARARAO BETA",
        title: "Full Stack Developer | Spring Boot | Microservices | React | Next.js | Nest.js | AI Agents",
        contact: "Hyderabad, India | Phone: 7036285961 | Email: eswar.crypto.tech@gmail.com",
        links: {
            linkedin: "https://linkedin.com/in/eswararaobeta",
            github: "https://github.com/eswararaobeta",
            portfolio: "https://eswarb.vercel.app",
        },
    },
    summary:
        "Full Stack Developer with 2+ years of experience building scalable, secure systems using Spring Boot, NestJS, and microservices. Experienced in integrating AI-powered solutions using modern AI/LLM APIs. Proficient in React.js, Next.js, and Tailwind CSS to deliver production-ready full-stack applications in agile environments.",
    skills: [
        { label: "Programming", value: "Java, TypeScript" },
        { label: "Frameworks",  value: "Spring Boot, Nest.js, React, Next.js, Tailwind CSS, ShadCN, Apache Kafka" },
        { label: "Databases",   value: "MySQL, MongoDB, Firebase, Supabase, Vector DB" },
        { label: "Tools",       value: "Git, GitHub, Docker, Kubernetes, Postman, VS Code, IntelliJ IDEA" },
        { label: "AI/ML",       value: "OpenAI API, Gemini API, LangChain, LlamaIndex, Ollama" },
    ],
    experience: [
        {
            company: "Toucan Payments LLC",
            role: "Software Engineer",
            duration: "2023 - Present",
            link: "https://toucanpayments.com",
            points: [
                "Developed scalable microservices using Spring Boot for core Payments and Card Management systems.",
                "Implemented secure API gateways using Spring Security and Spring Cloud Gateway.",
                "Led development of the Card Management System covering card issuance, activation, and status tracking.",
            ],
            techStack: "Spring Boot, Spring Cloud Gateway, Spring Security, Microservices, MongoDB, Docker",
        },
    ],
    projects: [
        {
            name: "Resume Maker",
            role: "Next.js Project",
            duration: "Feb 2026 - Present",
            link: "https://github.com/eswararaobeta/resume-maker",
            points: [
                "Built a real-time resume builder with live PDF preview using React-PDF and Next.js.",
                "Implemented dynamic layouts and custom styling for enhanced user customization.",
                "Designed a responsive UI with a split-screen editor and preview.",
            ],
            techStack: "Next.js, React-PDF, Tailwind CSS, TypeScript",
        },
        {
            name: "AI-Powered Chat Application",
            role: "React Native Project",
            duration: "Jan 2025 - Feb 2026",
            link: "https://github.com/eswararaobeta/ai-chat-app",
            points: [
                "Developed a cross-platform mobile chat app with real-time messaging via WebSocket and Firebase.",
                "Integrated OpenAI API for smart replies and AI-driven content moderation.",
            ],
            techStack: "React Native, Firebase, Node.js, OpenAI API",
        },
        {
            name: "E-Commerce Platform",
            role: "Spring Boot Project",
            duration: "Aug 2024 - Dec 2024",
            link: "https://github.com/eswararaobeta/ecommerce-platform",
            points: [
                "Built a scalable e-commerce backend with microservices architecture.",
                "Implemented secure payment processing using Stripe API.",
                "Deployed on AWS using Docker and Kubernetes.",
            ],
            techStack: "Spring Boot, React, MySQL, Docker, AWS",
        },
    ],
    education: {
        college: "JNTUGV",
        degree: "B.Tech in Information Technology",
        duration: "2020-2023",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

type ActiveTab = "templates" | "editor" | "preview";

export default function ResumeConfigPage() {
    const { error: toastError, success: toastSuccess } = useToast();

    const [resumeData,  setResumeData]  = useState(INITIAL_DATA);
    const [jsonInput,   setJsonInput]   = useState(() => JSON.stringify(INITIAL_DATA, null, 2));
    const [jsonError,   setJsonError]   = useState<string | null>(null);
    const [templateId,  setTemplateId]  = useState<TemplateId>("classic");
    const [mobileTab,   setMobileTab]   = useState<ActiveTab>("templates");
    const [pdfReady,    setPdfReady]    = useState(false);
    const [isMobile,    setIsMobile]    = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [subStatus,   setSubStatus]   = useState<{
        hasActive: boolean;
        hasUsage:  boolean;
        remaining: number | null;
        loaded:    boolean;
    }>({ hasActive: false, hasUsage: false, remaining: null, loaded: false });
    const [restoredResume, setRestoredResume] = useState<{
        historyId: string;
        fileName: string;
        templateId: TemplateId;
        templateName: string;
        resumeName: string;
        originalPayload: string;
    } | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setPdfReady(true), 300);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const fn = () => setIsMobile(window.innerWidth < 1024);
        fn();
        window.addEventListener("resize", fn);
        return () => window.removeEventListener("resize", fn);
    }, []);

    // Fetch active subscription status once on mount
    useEffect(() => {
        const token = getStoredToken();
        fetch("/api/v1/private/subscriptions/active", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => {
                if (d.success && d.data) {
                    setSubStatus({ hasActive: true, hasUsage: d.data.hasUsage, remaining: d.data.remaining, loaded: true });
                } else {
                    setSubStatus({ hasActive: false, hasUsage: false, remaining: null, loaded: true });
                }
            })
            .catch(() => setSubStatus({ hasActive: false, hasUsage: false, remaining: null, loaded: true }));
    }, []);

    useEffect(() => {
        const resumeHistoryId = new URLSearchParams(window.location.search).get("resumeHistoryId");
        if (!resumeHistoryId) return;

        const token = getStoredToken();
        let active = true;

        fetch(`/api/v1/private/my-resumes/${resumeHistoryId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Failed to restore saved resume.");
                }
                return data;
            })
            .then((data) => {
                if (!active) return;

                const snapshot = data.data?.resumePayload;
                const restoredTemplateId = data.data?.templateId as string;
                const matchedTemplate = TEMPLATES.find((template) => template.id === restoredTemplateId);

                if (!snapshot || !matchedTemplate) {
                    throw new Error("Saved resume format is unavailable.");
                }

                setResumeData(snapshot);
                setJsonInput(JSON.stringify(snapshot, null, 2));
                setJsonError(null);
                setTemplateId(matchedTemplate.id);
                setMobileTab("preview");
                setPdfReady(true);
                setRestoredResume({
                    historyId: data.data._id,
                    fileName: data.data.fileName || `${(snapshot.header?.name || "resume").replace(/\s+/g, "_")}_${matchedTemplate.id}.pdf`,
                    templateId: matchedTemplate.id,
                    templateName: data.data.templateName || matchedTemplate.name,
                    resumeName: data.data.resumeName || snapshot.header?.name || "Saved Resume",
                    originalPayload: JSON.stringify(snapshot),
                });
                toastSuccess(`Loaded saved resume: ${data.data.resumeName || data.data.fileName}`);
            })
            .catch((error: unknown) => {
                if (!active) return;
                toastError(error instanceof Error ? error.message : "Failed to restore saved resume.");
            });

        return () => {
            active = false;
        };
    }, [toastError, toastSuccess]);

    const generatePdfBlob = useCallback(async () => {
        const { pdf } = await import("@react-pdf/renderer");
        const CurrentTemplate = TEMPLATES.find((template) => template.id === templateId)?.component;
        if (!CurrentTemplate) {
            throw new Error("Selected template is unavailable.");
        }
        const documentElement = React.createElement(CurrentTemplate, { data: resumeData }) as unknown as React.ReactElement;
        return (pdf as any)(documentElement).toBlob();
    }, [resumeData, templateId]);

    const triggerBrowserDownload = useCallback((blob: Blob, fileName: string) => {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = fileName;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();

        window.setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
            anchor.remove();
        }, 30000);
    }, []);

    // Generate a fresh PDF blob for each click, then consume usage and download it.
    const handlePremiumDownload = useCallback(async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const blob = await generatePdfBlob();
            const currentPayload = JSON.stringify(resumeData);
            const isUnchangedRestoredResume = Boolean(
                restoredResume &&
                restoredResume.templateId === templateId &&
                restoredResume.originalPayload === currentPayload
            );

            if (isUnchangedRestoredResume) {
                const restoredFileName = restoredResume?.fileName || `${(resumeData.header?.name || "resume").replace(/\s+/g, "_")}_${templateId}.pdf`;
                triggerBrowserDownload(blob, restoredFileName);
                toastSuccess(`Re-downloaded ${restoredResume?.resumeName || "saved resume"} without using another subscription credit.`);
                setDownloading(false);
                return;
            }

            const token = getStoredToken();
            const res  = await fetch("/api/v1/private/subscriptions/use", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!data.success) {
                toastError(data.message || "Subscription required to download this template.");
                setDownloading(false);
                return;
            }
            setSubStatus((prev) => ({
                ...prev,
                remaining: data.data.remaining,
                hasUsage:  data.data.remaining === null || data.data.remaining > 0,
            }));

            const selectedTemplate = TEMPLATES.find((t) => t.id === templateId);
            const fileName = `${(resumeData.header?.name || "resume").replace(/\s+/g, "_")}_${templateId}.pdf`;

            try {
                await fetch("/api/v1/private/resume-downloads", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fileName,
                        templateId,
                        templateName: selectedTemplate?.name || templateId,
                        resumeName: resumeData.header?.name || "",
                        resumeTitle: resumeData.header?.title || "",
                        source: "resume-config",
                        resumePayload: resumeData,
                        subscriptionId: data.data?.subscription?.id || "",
                        subscriptionUsageCount: data.data?.usageCount ?? null,
                        subscriptionMaxUsage: data.data?.maxUsage ?? null,
                        subscriptionRemaining: data.data?.remaining ?? null,
                    }),
                });
            } catch {
                // Analytics tracking should never block the download itself.
            }

            triggerBrowserDownload(blob, fileName);
        } catch {
            toastError("Download failed. Please try again.");
        }
        setDownloading(false);
    }, [downloading, generatePdfBlob, resumeData, restoredResume, templateId, toastError, toastSuccess, triggerBrowserDownload]);

    // Free template download — no subscription needed
    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setJsonInput(val);
        try { setResumeData(JSON.parse(val)); setJsonError(null); }
        catch (err) { setJsonError((err as Error).message); }
    };

    const activeTpl   = TEMPLATES.find((t) => t.id === templateId)!;
    const TemplateDoc = activeTpl.component;
    const lineCount   = jsonInput.split("\n").length;
    const isHistoryRedownloadReady = Boolean(
        restoredResume &&
        restoredResume.templateId === templateId &&
        restoredResume.originalPayload === JSON.stringify(resumeData)
    );

    const MTab = ({ id, label, icon }: { id: ActiveTab; label: string; icon: React.ReactNode }) => (
        <button
            onClick={() => setMobileTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                mobileTab === id ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="flex flex-col gap-3">
            {restoredResume && (
                <div className="flex flex-col gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="font-semibold">Restored from My Resumes: {restoredResume.resumeName}</p>
                        <p className="text-xs text-sky-700/80">
                            Exact format: {restoredResume.templateName}. Re-downloading this unchanged saved version will not use another subscription credit.
                        </p>
                    </div>
                    <p className="text-xs font-medium text-sky-700/80">
                        If you edit the content or change the template, the next download will use a new credit.
                    </p>
                </div>
            )}

            {/* ── Subscription status banner ───────────────────────────── */}
            {subStatus.loaded && (
                subStatus.hasActive && subStatus.hasUsage ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                        <FiCheckCircle size={12} className="shrink-0" />
                        <span>
                            {subStatus.remaining === null
                                ? "Active subscription — unlimited premium downloads"
                                : `Active subscription — ${subStatus.remaining} premium download${subStatus.remaining === 1 ? "" : "s"} remaining`}
                        </span>
                    </div>
                ) : subStatus.hasActive && !subStatus.hasUsage ? (
                    <div className="flex items-center gap-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs">
                        <FiAlertCircle size={12} className="text-red-600 shrink-0" />
                        <span className="text-red-700">Usage limit reached. Premium downloads are locked.</span>
                        <a href="/dashboard/my-subscription" className="ml-auto font-semibold text-indigo-600 hover:underline whitespace-nowrap">Re-subscribe →</a>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                        <FiLock size={12} className="text-amber-600 shrink-0" />
                        <span className="text-amber-700">All resume templates require an active subscription to download.</span>
                        <a href="/dashboard/my-subscription" className="ml-auto font-semibold text-indigo-600 hover:underline whitespace-nowrap">Subscribe →</a>
                    </div>
                )
            )}

            {/* ── Page header ──────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
                        <FiFileText className="text-white" size={18} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">Resumes</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Choose a format · edit your data · preview live as PDF</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        jsonError
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                        {jsonError ? <><FiAlertCircle size={11} /> Invalid JSON</> : <><FiCheckCircle size={11} /> Valid JSON</>}
                    </span>

                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                        <FiLayers size={11} /> {activeTpl.name}
                    </span>

                    {pdfReady && !jsonError && (
                        subStatus.loaded && !isHistoryRedownloadReady && (!subStatus.hasActive || !subStatus.hasUsage) ? (
                            /* No active subscription — prompt to subscribe */
                            <a
                                href="/dashboard/my-subscription"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-full transition-colors"
                            >
                                <FiLock size={11} /> Subscribe to Download
                            </a>
                        ) : (
                            /* Active subscription — use BlobProvider to consume usage */
                            <BlobProvider document={<TemplateDoc data={resumeData} />}>
                                {({ url, loading }: { url: string | null; loading: boolean }) => (
                                    <button
                                        disabled={loading || downloading}
                                        onClick={() => handlePremiumDownload()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-full transition-colors shadow-sm shadow-violet-500/20 disabled:opacity-50"
                                    >
                                        {(loading || downloading)
                                            ? <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Preparing…</>
                                            : <><FiDownload size={11} /> Download PDF</>}
                                    </button>
                                )}
                            </BlobProvider>
                        )
                    )}
                </div>
            </div>

            {/* ── Mobile tab switcher ──────────────────────────────────── */}
            <div className="flex lg:hidden bg-white rounded-xl border border-gray-200 p-1 shadow-sm gap-0.5">
                <MTab id="templates" label="Templates" icon={<FiLayers size={13} />} />
                <MTab id="editor"    label="Editor"    icon={<FiCode    size={13} />} />
                <MTab id="preview"   label="Preview"   icon={<FiEye     size={13} />} />
            </div>

            {/* ── 3-panel workspace ────────────────────────────────────── */}
            <div
                className="flex rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
                style={{ height: "min(700px, calc(100vh - 200px))" }}
            >
                {/* ── Panel 1: Template gallery ─────────────────────── */}
                <div
                    className={`flex-col border-r border-gray-200 bg-gray-50 lg:w-52 shrink-0 overflow-y-auto
                        ${mobileTab === "templates" ? "flex w-full" : "hidden"} lg:flex`}
                    style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}
                >
                    <div className="px-3 pt-3 pb-2 border-b border-gray-200 bg-white shrink-0">
                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Resume Formats</p>
                        <p className="text-xs text-gray-400 mt-0.5">{TEMPLATES.length} templates available</p>
                    </div>

                    <div className="flex flex-col gap-2 p-2 pb-4">
                        {TEMPLATES.map((tpl) => {
                            const active   = tpl.id === templateId;
                            const isLocked = tpl.premium && subStatus.loaded && (!subStatus.hasActive || !subStatus.hasUsage);
                            return (
                                <button
                                    key={tpl.id}
                                    onClick={() => { setTemplateId(tpl.id); setMobileTab("preview"); }}
                                    className="w-full rounded-xl overflow-hidden text-left transition-all"
                                    style={{
                                        outline: active ? `2px solid ${tpl.accent}` : "1px solid #e5e7eb",
                                        boxShadow: active ? `0 4px 14px ${tpl.accent}28` : undefined,
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <div className="h-24 relative overflow-hidden">
                                        {tpl.thumb}
                                        {active && !isLocked && (
                                            <div className="absolute inset-0 flex items-center justify-center"
                                                style={{ background: `${tpl.accent}15` }}
                                            >
                                                <span className="flex items-center gap-1 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: tpl.accent }}
                                                >
                                                    <FiCheckCircle size={10} /> Active
                                                </span>
                                            </div>
                                        )}
                                        {isLocked && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[1px]">
                                                <FiLock size={14} className="text-white mb-0.5" />
                                                <span className="text-white text-xs font-bold">Premium</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Label */}
                                    <div className="px-2.5 py-2 bg-white border-t border-gray-100">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: tpl.accent }} />
                                            <p className="text-xs font-semibold text-gray-800">{tpl.name}</p>
                                            {tpl.premium && (
                                                <span className="ml-auto text-xs font-bold text-amber-600">PRO</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 leading-tight">{tpl.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Panel 2: JSON editor ──────────────────────────── */}
                <div
                    className={`flex-col overflow-hidden border-r border-white/10 flex-1
                        ${mobileTab === "editor" ? "flex" : "hidden"} lg:flex`}
                    style={{ background: "#0C0A1B" }}
                >
                    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/8 shrink-0"
                        style={{ background: "#120F26" }}
                    >
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ background: "#FF5F57" }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: "#FEBC2E" }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: "#28C840" }} />
                        </div>
                        <FiCode size={12} className="ml-1" style={{ color: "#a78bfa" }} />
                        <span className="text-sm font-medium" style={{ color: "#d4d4d4" }}>JSON Data</span>
                        <div className="ml-auto">
                            {jsonError ? (
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                    style={{ color: "#f87171", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.2)" }}
                                ><FiAlertCircle size={11} /> Error</span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                    style={{ color: "#34d399", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)" }}
                                ><FiCheckCircle size={11} /> Valid</span>
                            )}
                        </div>
                    </div>

                    <textarea
                        className="flex-1 w-full px-4 py-4 font-mono text-xs leading-relaxed outline-none resize-none"
                        value={jsonInput}
                        onChange={handleJsonChange}
                        spellCheck={false}
                        style={{
                            background: "#0C0A1B",
                            color: "rgba(221,214,254,0.85)",
                            caretColor: "#a78bfa",
                            scrollbarWidth: "thin",
                            scrollbarColor: "#3b1e7a #0C0A1B",
                        }}
                    />

                    <div className="px-4 py-2 border-t border-white/8 flex items-center justify-between shrink-0"
                        style={{ background: "#0F0D22" }}
                    >
                        <span className="text-xs" style={{ color: "#4b5280" }}>Edit JSON → live PDF update</span>
                        <span className="text-xs tabular-nums" style={{ color: "#4b5280" }}>{lineCount} lines</span>
                    </div>
                </div>

                {/* ── Panel 3: PDF preview ──────────────────────────── */}
                <div
                    className={`flex-col overflow-hidden flex-[1.4]
                        ${mobileTab === "preview" ? "flex" : "hidden"} lg:flex`}
                    style={{ background: "#f8fafc" }}
                >
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ background: "#FF5F57" }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: "#FEBC2E" }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: "#28C840" }} />
                        </div>
                        <FiEye size={12} className="ml-1 text-violet-500" />
                        <span className="text-sm font-medium text-gray-700">PDF Preview</span>
                        <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ml-1"
                            style={{ background: activeTpl.bg, color: activeTpl.accent, border: `1px solid ${activeTpl.accent}30` }}
                        >
                            {activeTpl.name}
                        </span>
                        <div className="ml-auto flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs text-gray-400">Live</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {!pdfReady || jsonError ? (
                            <PDFLoader />
                        ) : isMobile ? (
                            /* ── Mobile: BlobProvider → PDF.js canvas preview + download bar ── */
                            <BlobProvider document={<TemplateDoc data={resumeData} />}>
                                {({ url, loading }: { url: string | null; loading: boolean }) =>
                                    loading || !url ? <PDFLoader /> : (
                                        <div className="flex flex-col w-full h-full">
                                            {/* Scrollable page canvas */}
                                            <div className="flex-1 min-h-0">
                                                <MobilePDFCanvas url={url} />
                                            </div>

                                            {/* Download bar */}
                                            <div className="shrink-0 px-4 py-3 bg-white border-t border-gray-200 flex items-center gap-3">
                                                {subStatus.loaded && !isHistoryRedownloadReady && (!subStatus.hasActive || !subStatus.hasUsage) ? (
                                                    <a
                                                        href="/dashboard/my-subscription"
                                                        className="flex flex-1 items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
                                                    >
                                                        <FiLock size={14} /> Subscribe to Download
                                                    </a>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePremiumDownload()}
                                                        disabled={downloading}
                                                        className="flex flex-1 items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-violet-500/20 disabled:opacity-50"
                                                    >
                                                        {downloading
                                                            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Preparing…</>
                                                            : <><FiDownload size={14} /> Download PDF</>}
                                                    </button>
                                                )}
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                                >
                                                    <FiEye size={14} />
                                                </a>
                                            </div>
                                        </div>
                                    )
                                }
                            </BlobProvider>
                        ) : (
                            /* ── Desktop: BlobProvider → iframe (toolbar hidden) + download bar ── */
                            <BlobProvider document={<TemplateDoc data={resumeData} />}>
                                {({ url, loading }: { url: string | null; loading: boolean }) =>
                                    loading || !url ? <PDFLoader /> : (
                                        <div className="flex flex-col w-full h-full">
                                            {/* PDF iframe — #toolbar=0 hides browser download button */}
                                            <div className="flex-1 min-h-0">
                                                <iframe
                                                    src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
                                                    className="w-full h-full"
                                                    style={{ border: "none" }}
                                                />
                                            </div>

                                            {/* Download bar */}
                                            <div className="shrink-0 px-4 py-3 bg-white border-t border-gray-200 flex items-center gap-3">
                                                {subStatus.loaded && !isHistoryRedownloadReady && (!subStatus.hasActive || !subStatus.hasUsage) ? (
                                                    <a
                                                        href="/dashboard/my-subscription"
                                                        className="flex flex-1 items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
                                                    >
                                                        <FiLock size={14} /> Subscribe to Download
                                                    </a>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePremiumDownload()}
                                                        disabled={downloading}
                                                        className="flex flex-1 items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-violet-500/20 disabled:opacity-50"
                                                    >
                                                        {downloading
                                                            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Preparing…</>
                                                            : <><FiDownload size={14} /> Download PDF</>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }
                            </BlobProvider>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                textarea::-webkit-scrollbar        { width: 4px; }
                textarea::-webkit-scrollbar-track  { background: #0C0A1B; }
                textarea::-webkit-scrollbar-thumb  { background: #3b1e7a; border-radius: 2px; }
                textarea::-webkit-scrollbar-thumb:hover { background: #5b2ea8; }
            `}</style>
        </div>
    );
}

