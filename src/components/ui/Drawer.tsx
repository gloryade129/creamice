"use client";

import { Fragment, ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  position?: "left" | "right";
  title?: string;
  className?: string;
}

export function Drawer({ open, onClose, children, position = "left", title, className }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      drawerRef.current?.focus();
    } else {
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Fragment>
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={cn(
          "fixed top-0 z-50 h-full w-full max-w-[320px] bg-surface border-r border-border flex flex-col transition-transform duration-200 ease-out",
          position === "left" ? "left-0 translate-x-0" : "right-0 translate-x-0",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
      >
        {(title || !title) && (
          <header className="flex items-center justify-between p-4 border-b border-border">
            {title && (
              <h2 id="drawer-title" className="font-oswald font-semibold text-lg uppercase tracking-[0.02em]">
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-offwhite transition-colors rounded-lg hover:bg-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </header>
        )}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </Fragment>
  );
}