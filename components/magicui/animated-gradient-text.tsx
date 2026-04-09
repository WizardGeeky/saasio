import { cn } from "@/lib/utils";
import React from "react";

export function AnimatedGradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-white/80 px-4 py-1.5 text-sm font-semibold shadow-sm backdrop-blur-sm",
        "animate-gradient-flow bg-gradient-to-r from-emerald-500/10 via-violet-500/10 to-emerald-500/10",
        className,
      )}
    >
      {children}
    </div>
  );
}
