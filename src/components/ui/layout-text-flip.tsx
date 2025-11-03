"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export const LayoutTextFlip = ({
  text = "Build Amazing",
  words = ["Landing Pages", "Component Blocks", "Page Sections", "3D Shaders"],
  duration = 3000,
}: {
  text: string;
  words: string[];
  duration?: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Estabilizar valores primitivos para las dependencias
  const stableDuration = useMemo(() => duration ?? 3000, [duration]);
  const stableWordsLength = useMemo(() => words.length, [words.length]);

  useEffect(() => {
    if (stableWordsLength === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % stableWordsLength);
    }, stableDuration);

    return () => clearInterval(interval);
  }, [stableDuration, stableWordsLength]);

  return (
    <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-0">
      <motion.span
        layoutId="subtext"
        className="text-lg font-bold tracking-tight drop-shadow-lg sm:text-xl md:text-2xl"
      >
        {text}
      </motion.span>

      <motion.span
        layout
        className="relative w-fit overflow-hidden rounded-md border border-transparent bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1.5 font-sans text-lg font-bold tracking-tight text-white shadow-sm ring shadow-black/10 ring-black/10 drop-shadow-lg sm:px-4 sm:py-2 sm:text-xl md:ml-2 md:px-4 md:py-2 md:text-2xl dark:from-blue-600 dark:to-purple-700 dark:text-white dark:shadow-sm dark:ring-1 dark:shadow-white/10 dark:ring-white/10"
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: -40, filter: "blur(10px)" }}
            animate={{
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{ y: 50, filter: "blur(10px)", opacity: 0 }}
            transition={{
              duration: 0.5,
            }}
            className={cn("inline-block whitespace-nowrap")}
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </div>
  );
};
