"use client";

import { motion } from "framer-motion";
import { ButtonHTMLAttributes } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BubbleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function BubbleButton({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: BubbleButtonProps) {
  const baseStyles = "cursor-pointer inline-flex items-center justify-center font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none rounded-bubble-sm relative overflow-hidden";
  
  const variants = {
    primary: "bg-primary text-primary-foreground border border-primary/90 hover:bg-primary-hover shadow-[0_4px_14px_0_rgb(99,102,241,0.39)]",
    secondary: "bg-surface text-foreground border border-border hover:border-primary/40 hover:bg-background/50",
    outline: "border border-primary/50 text-primary hover:bg-primary/5",
    ghost: "border border-transparent hover:bg-primary/5 text-foreground hover:text-primary",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-7 text-[0.95rem]",
    lg: "h-13 px-9 text-[1rem] rounded-bubble",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      <div className="absolute inset-0 bg-white/12 opacity-0 hover:opacity-100 transition-opacity rounded-[inherit] pointer-events-none" />
      {children}
    </motion.button>
  );
}
