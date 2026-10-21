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
      default: "border border-border bg-charcoal text-offwhite",
      gold: "bg-gold text-on-gold",
      success: "border border-success/40 bg-success/15 text-success",
      error: "border border-error/40 bg-error/15 text-error",
      muted: "border border-border bg-charcoal text-muted",
    };

    const sizes = {
      default:
        "px-2.5 py-0.5 text-xs font-montserrat font-semibold uppercase tracking-[0.06em]",
      sm: "px-2 py-0.5 text-[10px] font-montserrat font-semibold uppercase tracking-[0.06em]",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-md font-montserrat",
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
