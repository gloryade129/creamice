"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "sm" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", loading, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-montserrat font-semibold uppercase tracking-[0.04em] rounded-[4px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-jet disabled:opacity-40 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-gold text-jet hover:bg-gold-hover active:bg-gold-pressed",
      secondary: "border border-offwhite text-offwhite hover:bg-charcoal",
      ghost: "text-offwhite underline-offset-2 hover:underline",
      danger: "border border-error text-error hover:bg-error/10",
    };

    const sizes = {
      default: "h-12 px-6 text-sm",
      sm: "h-10 px-4 text-xs",
      lg: "h-14 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? "Please wait" : children}
      </button>
    );
  }
);

Button.displayName = "Button";