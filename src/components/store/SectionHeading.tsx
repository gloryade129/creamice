import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  href,
  action = "View all",
  description,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  action?: string;
  description?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-ink">
            {eyebrow}
          </p>
        )}
        <h2 className="font-oswald text-[22px] font-semibold uppercase tracking-[0.02em] text-offwhite md:text-[28px]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-[60ch] text-sm text-muted">{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1 text-sm font-medium text-offwhite transition-colors hover:text-gold-ink"
        >
          {action}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function PreviewNotice() {
  return (
    <div className="border-b border-border bg-charcoal">
      <div className="container-page py-2 text-[11px] text-muted sm:text-xs">
        <span className="font-semibold uppercase tracking-[0.08em] text-offwhite">
          Preview catalogue
        </span>{" "}
        — sample products shown until real ones are published from the dashboard.
      </div>
    </div>
  );
}
