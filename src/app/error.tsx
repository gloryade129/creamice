"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center bg-jet text-offwhite">
      <div className="container-page py-16 md:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-ink">
          Something went wrong
        </p>
        <h1 className="mt-3 max-w-[18ch] font-oswald text-[36px] font-semibold uppercase leading-[1.05] tracking-[0.02em] md:text-[54px]">
          We could not load this page
        </h1>
        <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-muted md:text-base">
          Try the page again. If it keeps failing, go back home or search the
          shop.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-offwhite px-5 text-sm font-semibold uppercase tracking-[0.04em] text-jet transition-colors duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-jet"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-1 rounded-lg border border-border-strong px-5 text-sm font-semibold text-offwhite transition-colors hover:border-offwhite hover:bg-charcoal"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>

        <form
          action="/shop"
          method="get"
          role="search"
          className="mt-8 flex w-full max-w-[460px] flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="error-search" className="sr-only">
            Search products
          </label>
          <input
            id="error-search"
            name="q"
            type="search"
            placeholder="Search products"
            className="h-12 min-w-0 w-full rounded-lg border border-border-strong bg-surface px-4 text-sm text-offwhite placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 sm:flex-1"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border-strong px-5 text-sm font-semibold uppercase tracking-[0.04em] text-offwhite transition-colors hover:border-offwhite hover:bg-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-jet"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </button>
        </form>
      </div>
    </main>
  );
}
