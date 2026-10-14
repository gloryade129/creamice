"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "gold" | "success" | "error" | "muted";
  size?: "default" | "sm";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-charcoal text-offwhite border border-border",
      gold: "bg-gold text-jet",
      success: "bg-success text-jet",
      error: "bg-error text-jet",
      muted: "bg-charcoal text-muted border border-border",
    };

    const sizes = {
      default: "px-2.5 py-0.5 text-xs font-montserrat font-semibold uppercase tracking-[0.04em]",
      sm: "px-2 py-0.5 text-[11px] font-montserrat font-semibold uppercase tracking-[0.04em]",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-[2px] font-montserrat",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";