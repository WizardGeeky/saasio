export function normalizeNonNegativeInt(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        return Math.floor(value);
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (/^\d+$/.test(trimmed)) {
            return Number(trimmed);
        }
    }

    return null;
}

export function inferUsageLimitFromDescriptions(descriptions: unknown): number | null {
    if (!Array.isArray(descriptions)) return null;

    let explicitUnlimited = false;

    for (const item of descriptions) {
        if (typeof item !== "string") continue;

        const text = item.trim();
        if (!text) continue;

        if (/unlimited/i.test(text)) {
            explicitUnlimited = true;
        }

        const match = text.match(
            /\b(\d+)\s+(?:resume|resumes|download|downloads|use|uses|analysis|analyses|scan|scans|credit|credits)\b/i
        );

        if (match) {
            return Number(match[1]);
        }
    }

    return explicitUnlimited ? 0 : null;
}

export function normalizePlanMaxUsage(plan: { maxUsage?: unknown; descriptions?: unknown } | null | undefined): number {
    const explicit = normalizeNonNegativeInt(plan?.maxUsage);
    if (explicit !== null) return explicit;

    const inferred = inferUsageLimitFromDescriptions(plan?.descriptions);
    return inferred ?? 0;
}
