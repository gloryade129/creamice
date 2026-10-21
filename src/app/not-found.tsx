import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-jet text-offwhite">
      <div className="container-page py-16 md:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-ink">
          404
        </p>
        <h1 className="mt-3 max-w-[18ch] font-oswald text-[36px] font-semibold uppercase leading-[1.05] tracking-[0.02em] md:text-[54px]">
          This page is not here
        </h1>
        <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-muted md:text-base">
          The link may be old, or the product may no longer be available. Search
          the shop or head back to the home page.
        </p>

        <form
          action="/shop"
          method="get"
          role="search"
          className="mt-7 flex w-full max-w-[460px] flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="not-found-search" className="sr-only">
            Search products
          </label>
          <input
            id="not-found-search"
            name="q"
            type="search"
            placeholder="Search products"
            className="h-12 min-w-0 w-full rounded-lg border border-border-strong bg-surface px-4 text-sm text-offwhite placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 sm:flex-1"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-offwhite px-5 text-sm font-semibold uppercase tracking-[0.04em] text-jet transition-colors duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-jet"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-offwhite transition-colors hover:text-gold-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
          <Link
            href="/shop"
            className="inline-flex min-h-[44px] items-center text-sm text-muted underline-offset-2 transition-colors hover:text-offwhite hover:underline"
          >
            Browse the shop
          </Link>
        </div>
      </div>
    </main>
  );
}
