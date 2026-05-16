"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { BubbleButton } from "./BubbleButton";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const shouldDark = root.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", shouldDark);
    setIsDark(shouldDark);
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
    }
    setIsDark(!isDark);
  };

  return (
    <BubbleButton
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="rounded-full w-10 h-10 p-0 overflow-hidden relative"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{
          scale: isDark ? 0 : 1,
          rotate: isDark ? 90 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Sun className="h-5 w-5 text-primary" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          scale: isDark ? 1 : 0,
          rotate: isDark ? 0 : -90,
        }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Moon className="h-5 w-5 text-foreground" />
      </motion.div>
    </BubbleButton>
  );
}
