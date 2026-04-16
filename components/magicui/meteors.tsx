"use client";

import { cn } from "@/lib/utils";

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

function seededFraction(seed: number) {
  const value = Math.sin(seed * 9301 + 49297) * 233280;
  return value - Math.floor(value);
}

function createMeteorStyle(index: number): MeteorStyle {
  return {
    top: Math.floor(seededFraction(index + 1) * 80) + "%",
    left: Math.floor(seededFraction(index + 11) * 100) + "%",
    animationDelay: (seededFraction(index + 21) * 2 + 0.1).toFixed(2) + "s",
    animationDuration: (Math.floor(seededFraction(index + 31) * 7) + 3).toString() + "s",
  };
}

export function Meteors({ number = 18, className }: MeteorsProps) {
  const meteorCount = Math.max(0, Math.floor(number));
  const styles = Array.from({ length: meteorCount }, (_, index) => createMeteorStyle(index));

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
