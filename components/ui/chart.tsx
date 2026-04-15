"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

// ─── Theme config ─────────────────────────────────────────────────────────────

export type ChartConfig = Record<
    string,
    { label?: React.ReactNode; icon?: React.ComponentType; color?: string }
>;

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
    const ctx = React.useContext(ChartContext);
    if (!ctx) throw new Error("useChart must be used within ChartContainer");
    return ctx;
}

// ─── ChartContainer ───────────────────────────────────────────────────────────

export const ChartContainer = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactNode }
>(({ id, className, children, config, ...props }, ref) => {
    const chartId = `chart-${id ?? React.useId().replace(/:/g, "")}`;
    return (
        <ChartContext.Provider value={{ config }}>
            <div
                ref={ref}
                data-chart={chartId}
                className={cn("flex min-w-0 overflow-hidden aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none", className)}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                    {children as React.ReactElement}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
});
ChartContainer.displayName = "ChartContainer";

// ─── ChartStyle (injects CSS variables) ──────────────────────────────────────

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
    const colorConfig = Object.entries(config).filter(([, v]) => v.color);
    if (!colorConfig.length) return null;
    return (
        <style
            dangerouslySetInnerHTML={{
                __html: `[data-chart=${id}] {\n${colorConfig
                    .map(([key, value]) => `  --color-${key}: ${value.color};`)
                    .join("\n")}\n}`,
            }}
        />
    );
}

// ─── ChartTooltip ─────────────────────────────────────────────────────────────

export const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipContentProps = React.ComponentProps<"div"> & {
    active?: boolean;
    payload?: RechartsPrimitive.TooltipPayload;
    label?: string | number;
    labelFormatter?: RechartsPrimitive.DefaultTooltipContentProps["labelFormatter"];
    labelClassName?: string;
    formatter?: RechartsPrimitive.DefaultTooltipContentProps["formatter"];
    color?: string;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
};

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
    (
        {
            active, payload, className, indicator = "dot", hideLabel = false,
            hideIndicator = false, label, labelFormatter, labelClassName,
            formatter, color, nameKey, labelKey,
        },
        ref,
    ) => {
        const { config } = useChart();
        const tooltipLabel = React.useMemo(() => {
            if (hideLabel || !payload?.length) return null;
            const [item] = payload;
            const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const val = !labelKey && typeof label === "string"
                ? config[label as keyof typeof config]?.label ?? label
                : itemConfig?.label;
            if (labelFormatter) {
                return <div className={cn("font-medium", labelClassName)}>{labelFormatter(val, payload)}</div>;
            }
            if (!val) return null;
            return <div className={cn("font-medium", labelClassName)}>{val}</div>;
        }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

        if (!active || !payload?.length) return null;

        return (
            <div
                ref={ref}
                className={cn(
                    "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
                    className,
                )}
            >
                {!hideLabel && tooltipLabel}
                <div className="grid gap-1.5">
                    {payload.map((item: any, index: number) => {
                        const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
                        const itemConfig = getPayloadConfigFromPayload(config, item, key);
                        const indicatorColor = color ?? item.payload?.fill ?? item.color;
                        return (
                            <div
                                key={item.dataKey}
                                className={cn(
                                    "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                                    indicator === "dot" && "items-center",
                                )}
                            >
                                {!hideIndicator && (
                                    <div
                                        className={cn(
                                            "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                                            indicator === "dot"    && "h-2.5 w-2.5 rounded-[2px]",
                                            indicator === "line"   && "w-1",
                                            indicator === "dashed" && "w-0 border-[1.5px] border-dashed bg-transparent",
                                        )}
                                        style={{ "--color-bg": indicatorColor, "--color-border": indicatorColor } as React.CSSProperties}
                                    />
                                )}
                                <div className={cn("flex flex-1 justify-between leading-none", hideIndicator ? "items-end" : "items-center")}>
                                    <div className="grid gap-1.5">
                                        <span className="text-muted-foreground">
                                            {itemConfig?.label ?? item.name}
                                        </span>
                                    </div>
                                    {item.value !== undefined && (
                                        <span className="font-mono font-medium tabular-nums text-foreground">
                                            {formatter
                                                ? (() => { const r = formatter(item.value, item.name, item, index, payload); return Array.isArray(r) ? r[0] : r; })()
                                                : typeof item.value === "number"
                                                    ? item.value.toLocaleString("en-IN")
                                                    : item.value}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

// ─── ChartLegend ─────────────────────────────────────────────────────────────

export const ChartLegend = RechartsPrimitive.Legend;

export const ChartLegendContent = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div"> &
        Pick<RechartsPrimitive.DefaultLegendContentProps, "payload" | "verticalAlign"> & {
            hideIcon?: boolean;
            nameKey?: string;
        }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
    const { config } = useChart();
    if (!payload?.length) return null;
    return (
        <div
            ref={ref}
            className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}
        >
            {(payload as any[]).map((item) => {
                const key = `${nameKey ?? item.dataKey ?? "value"}`;
                const itemConfig = getPayloadConfigFromPayload(config, item, key);
                return (
                    <div key={item.value} className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground">
                        {itemConfig?.icon && !hideIcon ? (
                            <itemConfig.icon />
                        ) : (
                            <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
                        )}
                        {itemConfig?.label ?? item.value}
                    </div>
                );
            })}
        </div>
    );
});
ChartLegendContent.displayName = "ChartLegendContent";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
    if (typeof payload !== "object" || !payload) return undefined;
    const pl = payload as Record<string, any>;
    const payloadPayload = pl.payload as Record<string, any> | undefined;
    let configLabelKey: string = key;
    if (payloadPayload && key in payloadPayload) {
        configLabelKey = payloadPayload[key] as string;
    } else if (key in pl) {
        configLabelKey = pl[key] as string;
    }
    return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config];
}
