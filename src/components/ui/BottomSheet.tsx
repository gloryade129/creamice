"use client";

import { Fragment, ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function BottomSheet({ open, onClose, children, title, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      sheetRef.current?.focus();
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
        className="fixed inset-0 bg-jet/60 z-40 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-jet border-t border-border rounded-t-[12px] flex flex-col max-h-[85vh] transition-transform duration-200 ease-out translate-y-0",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "sheet-title" : undefined}
      >
        <header className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          {title && (
            <h2 id="sheet-title" className="font-oswald font-semibold text-lg uppercase tracking-[0.02em]">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-offwhite transition-colors rounded-[4px] hover:bg-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </Fragment>
  );
}