"use client";

import { useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  delay?: number;
  decimalPlaces?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  delay = 0,
  decimalPlaces = 0,
  className = "",
  prefix = "",
  suffix = "",
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isInView = useInView(ref, { once: true, margin: "-100px" as any });

  useEffect(() => {
    if (isInView) {
      setTimeout(() => motionValue.set(value), delay * 1000);
    }
  }, [isInView, motionValue, value, delay]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent =
            prefix +
            Intl.NumberFormat("en-IN").format(
              parseFloat(latest.toFixed(decimalPlaces)),
            ) +
            suffix;
        }
      }),
    [springValue, decimalPlaces, prefix, suffix],
  );

  return <span ref={ref} className={cn(className)} />;
}
