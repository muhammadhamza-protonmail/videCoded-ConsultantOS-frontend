"use client";

import { motion } from "framer-motion";
import { HTMLAttributes } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BubbleCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function BubbleCard({ children, className, hoverEffect = false, ...props }: BubbleCardProps) {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2, scale: 1.005 } : undefined}
      className={cn(
        "bg-surface border border-border rounded-bubble-lg shadow-sm dark:shadow-md overflow-hidden",
        "transition-all duration-300 relative",
        hoverEffect && "hover:border-primary/30 hover:shadow-md dark:hover:shadow-lg cursor-pointer z-10",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
