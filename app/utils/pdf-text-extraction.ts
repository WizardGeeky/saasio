type CanvasGlobals = {
    DOMMatrix?: unknown;
    ImageData?: unknown;
    Path2D?: unknown;
};

let pdfParseModulePromise: Promise<typeof import("pdf-parse")> | null = null;

export async function extractPdfText(file: File): Promise<string> {
    const { PDFParse } = await loadPdfParse();
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    try {
        const result = await parser.getText({ parseHyperlinks: true });
        return cleanExtractedText(result.text);
    } catch (error) {
        console.error("Failed to parse PDF:", error);
        return "";
    } finally {
        await parser.destroy().catch(() => undefined);
    }
}

function loadPdfParse() {
    pdfParseModulePromise ??= importCanvasGlobals().then(() => import("pdf-parse"));
    return pdfParseModulePromise;
}

async function importCanvasGlobals() {
    if (globalThis.DOMMatrix && globalThis.ImageData && globalThis.Path2D) return;

    const canvas = await import("@napi-rs/canvas") as CanvasGlobals;

    if (!globalThis.DOMMatrix && canvas.DOMMatrix) {
        globalThis.DOMMatrix = canvas.DOMMatrix as typeof DOMMatrix;
    }
    if (!globalThis.ImageData && canvas.ImageData) {
        globalThis.ImageData = canvas.ImageData as typeof ImageData;
    }
    if (!globalThis.Path2D && canvas.Path2D) {
        globalThis.Path2D = canvas.Path2D as typeof Path2D;
    }
}

function cleanExtractedText(text: string): string {
    return text
        .replace(/\u0000/g, " ")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}
