"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "text", width, height, ...props }, ref) => {
    const baseStyles = "bg-charcoal relative overflow-hidden";

    const variants = {
      text: "h-4 rounded-[2px]",
      circular: "rounded-full",
      rectangular: "rounded-[4px]",
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        style={{ width, height }}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
      </div>
    );
  }
);

Skeleton.displayName = "Skeleton";