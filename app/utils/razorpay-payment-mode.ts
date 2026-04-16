import PaymentOrder from "@/models/PaymentOrder";

export type RazorpayPaymentDetail = {
    method?: unknown;
    bank?: unknown;
    wallet?: unknown;
    vpa?: unknown;
    card?: {
        network?: unknown;
        last4?: unknown;
        type?: unknown;
    };
};

export type PaymentModeInfo = {
    paymentMethod: string;
    paymentChannel?: string;
};

type PaymentOrderWithMode = {
    razorpayPaymentId?: unknown;
    paymentMethod?: unknown;
    paymentChannel?: unknown;
};

function asText(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getPaymentModeInfo(detail: RazorpayPaymentDetail | null): PaymentModeInfo | null {
    const method = asText(detail?.method)?.toLowerCase();
    if (!method) return null;

    const cardNetwork = asText(detail?.card?.network);
    const cardLast4 = asText(detail?.card?.last4);
    const channel =
        method === "card"
            ? [cardNetwork, cardLast4 ? `**** ${cardLast4}` : undefined].filter(Boolean).join(" ")
            : method === "upi"
                ? asText(detail?.vpa)
                : method === "netbanking"
                    ? asText(detail?.bank)
                    : method === "wallet"
                        ? asText(detail?.wallet)
                        : undefined;

    return {
        paymentMethod: method,
        ...(channel ? { paymentChannel: channel } : {}),
    };
}

export async function fetchRazorpayPaymentDetail(
    paymentId: string,
    credentials: string
): Promise<RazorpayPaymentDetail | null> {
    try {
        const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Basic ${credentials}` },
        });

        if (!response.ok) return null;
        return await response.json() as RazorpayPaymentDetail;
    } catch {
        return null;
    }
}

export async function fetchRazorpayPaymentMode(
    paymentId: string,
    credentials: string
): Promise<PaymentModeInfo | null> {
    const detail = await fetchRazorpayPaymentDetail(paymentId, credentials);
    return getPaymentModeInfo(detail);
}

export async function enrichMissingPaymentModes<T extends PaymentOrderWithMode>(
    orders: T[],
    credentials: string | null
): Promise<T[]> {
    if (!credentials || orders.length === 0) return orders;

    return Promise.all(orders.map(async (order) => {
        if (asText(order.paymentMethod)) return order;

        const paymentId = asText(order.razorpayPaymentId);
        if (!paymentId) return order;

        const modeInfo = await fetchRazorpayPaymentMode(paymentId, credentials);
        if (!modeInfo) return order;

        try {
            await PaymentOrder.updateOne({ razorpayPaymentId: paymentId }, { $set: modeInfo });
        } catch {
            // Keep the table usable even if backfilling the cached method fails.
        }

        return { ...order, ...modeInfo } as T;
    }));
}
