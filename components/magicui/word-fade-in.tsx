"use client";

import { motion } from "framer-motion";

interface WordFadeInProps {
  words: string;
  className?: string;
  delay?: number;
}

export function WordFadeIn({
  words,
  delay = 0.12,
  className,
}: WordFadeInProps) {
  const wordList = words.split(" ");

  return (
    <motion.h1
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: delay },
        },
      }}
      className={className}
    >
      {wordList.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
          }}
          className="mr-[0.25em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}
