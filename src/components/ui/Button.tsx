"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "default" | "sm" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "default", loading, disabled, children, ...props },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-montserrat font-semibold uppercase tracking-[0.04em] rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-jet disabled:opacity-40 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-gold text-on-gold hover:bg-gold-hover active:bg-gold-pressed",
      secondary: "bg-offwhite text-jet hover:opacity-90",
      outline:
        "border border-border-strong text-offwhite hover:border-offwhite hover:bg-charcoal",
      ghost: "text-offwhite hover:bg-charcoal",
      danger: "border border-error/50 text-error hover:bg-error/10",
    };

    const sizes = {
      default: "h-11 px-5 text-sm",
      sm: "h-9 px-3.5 text-xs",
      lg: "h-12 px-7 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? "Please wait…" : children}
      </button>
    );
  }
);

Button.displayName = "Button";
