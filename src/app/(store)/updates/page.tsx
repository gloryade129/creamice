import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { getPublicUpdates } from "@/lib/data/updates";
import {
  excerptFromBody,
  formatUpdateDate,
} from "@/lib/updates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Updates",
  description: "Creamice drop news and store announcements, newest first.",
  alternates: { canonical: "/updates" },
  openGraph: {
    title: "Updates | Creamice",
    description: "Creamice drop news and store announcements, newest first.",
    url: "/updates",
    siteName: "Creamice",
    locale: "en_NG",
    type: "website",
    images: ["/opengraph-image"],
  },
};

export default async function UpdatesArchivePage() {
  const updates = await getPublicUpdates();

  return (
    <div>
      <section className="border-b border-border bg-charcoal">
        <div className="container-page py-10 md:py-14">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-1 text-xs text-muted"
          >
            <Link href="/" className="transition-colors hover:text-offwhite">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-offwhite">Updates</span>
          </nav>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-ink">
            From the store
          </p>
          <h1 className="mt-2 font-oswald text-[34px] font-semibold uppercase tracking-[0.02em] text-offwhite md:text-[46px]">
            Updates
          </h1>
          <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-muted">
            Drops, restocks and store announcements, newest first. This is the
            permanent archive, so nothing disappears after it leaves the
            WhatsApp Channel.
          </p>
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        {updates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-charcoal px-6 py-12 text-center">
            <p className="text-sm text-muted">
              No updates yet. New drops and announcements will appear here.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-offwhite transition-colors hover:text-gold-ink"
            >
              Shop the collection
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <ul className="border-t border-border">
            {updates.map((update) => (
              <li key={update.id} className="border-b border-border">
                <Link
                  href={`/updates/${update.slug}`}
                  className="group grid gap-2 py-6 transition-colors hover:bg-charcoal md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-start md:gap-6 md:px-3"
                >
                  <time
                    dateTime={update.publishedAt}
                    className="text-xs uppercase tracking-[0.08em] text-muted"
                  >
                    {formatUpdateDate(update.publishedAt)}
                  </time>
                  <span className="min-w-0">
                    <span className="block font-oswald text-xl font-medium uppercase tracking-[0.02em] text-offwhite transition-colors group-hover:text-gold-ink md:text-2xl">
                      {update.title}
                    </span>
                    <span className="mt-2 block max-w-[70ch] text-sm leading-relaxed text-muted">
                      {excerptFromBody(update.body)}
                    </span>
                  </span>
                  <span className="hidden min-h-[44px] items-center gap-1 text-sm font-medium text-offwhite md:inline-flex">
                    Read update
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
