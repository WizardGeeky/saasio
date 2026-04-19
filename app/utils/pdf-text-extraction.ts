type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfParseModulePromise: Promise<typeof import("pdf-parse")> | null = null;
let pdfJsModulePromise: Promise<PdfJsModule> | null = null;

export class PdfTextExtractionError extends Error {
    constructor(readonly details: string[]) {
        super(`Unable to read text from the uploaded PDF. ${details.join(" | ")}`);
        this.name = "PdfTextExtractionError";
    }
}

export async function extractPdfText(file: File): Promise<string> {
    const data = new Uint8Array(await file.arrayBuffer());
    const errors: string[] = [];

    try {
        const text = await extractWithPdfParse(data);
        if (text) return text;
    } catch (error) {
        errors.push(`pdf-parse: ${formatError(error)}`);
    }

    try {
        const text = await extractWithPdfJs(data);
        if (text) return text;
    } catch (error) {
        errors.push(`pdfjs-dist: ${formatError(error)}`);
    }

    if (errors.length > 0) {
        console.error("PDF text extraction failed:", errors);
        throw new PdfTextExtractionError(errors);
    }

    return "";
}

async function extractWithPdfParse(data: Uint8Array): Promise<string> {
    const { PDFParse } = await loadPdfParse();
    const parser = new PDFParse({ data: new Uint8Array(data) });

    try {
        const result = await parser.getText({ parseHyperlinks: true });
        return cleanExtractedText(result.text);
    } finally {
        await parser.destroy().catch(() => undefined);
    }
}

async function extractWithPdfJs(data: Uint8Array): Promise<string> {
    const pdfjs = await loadPdfJs();
    const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(data),
        isImageDecoderSupported: false,
        isOffscreenCanvasSupported: false,
        stopAtErrors: false,
        useSystemFonts: true,
    });

    const document = await loadingTask.promise;
    const pages: string[] = [];

    try {
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
            const page = await document.getPage(pageNumber);
            const content = await page.getTextContent();
            const pageText = content.items
                .map((item) => ("str" in item ? item.str : ""))
                .filter(Boolean)
                .join(" ");

            pages.push(pageText);
            page.cleanup();
        }
    } finally {
        await document.destroy();
    }

    return cleanExtractedText(pages.join("\n\n"));
}

function loadPdfParse() {
    pdfParseModulePromise ??= Promise.resolve()
        .then(installPdfJsGlobals)
        .then(() => import("pdf-parse"));

    return pdfParseModulePromise;
}

function loadPdfJs() {
    pdfJsModulePromise ??= Promise.resolve()
        .then(installPdfJsGlobals)
        .then(() => import("pdfjs-dist/legacy/build/pdf.mjs"));

    return pdfJsModulePromise;
}

function installPdfJsGlobals() {
    globalThis.DOMMatrix ??= MinimalDOMMatrix as unknown as typeof DOMMatrix;
    globalThis.ImageData ??= MinimalImageData as unknown as typeof ImageData;
    globalThis.Path2D ??= MinimalPath2D as unknown as typeof Path2D;
}

class MinimalDOMMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    is2D = true;
    isIdentity = true;
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;

    constructor(init?: number[] | string) {
        if (Array.isArray(init)) {
            this.set2D(init[0] ?? 1, init[1] ?? 0, init[2] ?? 0, init[3] ?? 1, init[4] ?? 0, init[5] ?? 0);
        }
    }

    multiplySelf(other: MinimalDOMMatrix) {
        return this.setFromMultiply(this, other);
    }

    preMultiplySelf(other: MinimalDOMMatrix) {
        return this.setFromMultiply(other, this);
    }

    translate(tx = 0, ty = 0) {
        return this.multiplySelf(new MinimalDOMMatrix([1, 0, 0, 1, tx, ty]));
    }

    scale(scaleX = 1, scaleY = scaleX) {
        return this.multiplySelf(new MinimalDOMMatrix([scaleX, 0, 0, scaleY, 0, 0]));
    }

    invertSelf() {
        const determinant = this.a * this.d - this.b * this.c;
        if (!determinant) {
            return this.set2D(Number.NaN, Number.NaN, Number.NaN, Number.NaN, Number.NaN, Number.NaN);
        }

        return this.set2D(
            this.d / determinant,
            -this.b / determinant,
            -this.c / determinant,
            this.a / determinant,
            (this.c * this.f - this.d * this.e) / determinant,
            (this.b * this.e - this.a * this.f) / determinant,
        );
    }

    private setFromMultiply(left: MinimalDOMMatrix, right: MinimalDOMMatrix) {
        return this.set2D(
            left.a * right.a + left.c * right.b,
            left.b * right.a + left.d * right.b,
            left.a * right.c + left.c * right.d,
            left.b * right.c + left.d * right.d,
            left.a * right.e + left.c * right.f + left.e,
            left.b * right.e + left.d * right.f + left.f,
        );
    }

    private set2D(a: number, b: number, c: number, d: number, e: number, f: number) {
        this.a = this.m11 = a;
        this.b = this.m12 = b;
        this.c = this.m21 = c;
        this.d = this.m22 = d;
        this.e = this.m41 = e;
        this.f = this.m42 = f;
        this.isIdentity = a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0;
        return this;
    }
}

class MinimalImageData {
    colorSpace: PredefinedColorSpace = "srgb";
    data: Uint8ClampedArray;
    height: number;
    width: number;

    constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
        if (typeof dataOrWidth === "number") {
            this.width = dataOrWidth;
            this.height = widthOrHeight;
            this.data = new Uint8ClampedArray(this.width * this.height * 4);
        } else {
            this.data = dataOrWidth;
            this.width = widthOrHeight;
            this.height = height ?? 0;
        }
    }
}

class MinimalPath2D {
    addPath() {}
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

function formatError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}
