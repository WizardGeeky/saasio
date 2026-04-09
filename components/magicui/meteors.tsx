"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MeteorStyle {
  top: string;
  left: string;
  animationDelay: string;
  animationDuration: string;
}

interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 18, className }: MeteorsProps) {
  const [styles, setStyles] = useState<MeteorStyle[]>([]);

  useEffect(() => {
    setStyles(
      Array.from({ length: number }, () => ({
        top: Math.floor(Math.random() * 80) + "%",
        left: Math.floor(Math.random() * 100) + "%",
        animationDelay: (Math.random() * 2 + 0.1).toFixed(2) + "s",
        animationDuration: (Math.floor(Math.random() * 7) + 3).toString() + "s",
      })),
    );
  }, [number]);

  return (
    <>
      {styles.map((style, idx) => (
        <span
          key={idx}
          className={cn(
            "pointer-events-none absolute h-px w-px rotate-[215deg] rounded-full",
            "before:absolute before:top-1/2 before:h-px before:w-16 before:-translate-y-1/2",
            "before:bg-gradient-to-r before:from-violet-400/70 before:to-transparent",
            "after:absolute after:top-1/2 after:h-[3px] after:w-[3px] after:-translate-y-1/2 after:rounded-full after:bg-violet-400/60",
            "animate-meteor",
            className,
          )}
          style={style}
        />
      ))}
    </>
  );
}
