"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HelpCircle,
  Menu,
  PackageSearch,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { CART_CHANGED_EVENT, readCartCount } from "@/lib/cart-storage";

export interface HeaderCategory {
  name: string;
  slug: string;
}

const infoLinks = [
  { href: "/updates", label: "Updates" },
  { href: "/track", label: "Track your order" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/delivery-returns", label: "Delivery and Returns" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
];

interface SiteHeaderProps {
  categories: HeaderCategory[];
}

export function SiteHeader({ categories }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const update = () => setCartCount(readCartCount());
    update();
    window.addEventListener("storage", update);
    window.addEventListener(CART_CHANGED_EVENT, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(CART_CHANGED_EVENT, update);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-surface">
      {/* Utility strip: the one black band above the fold. */}
      <div className="bg-[#0B0B0B] text-[#F5F2EB]">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[11px] tracking-[0.02em] sm:text-xs">
          <p className="truncate">
            Delivery across Nigeria <span className="text-[#C6A15B]">·</span> Secure
            payment by Flutterwave
          </p>
          <div className="hidden items-center gap-5 sm:flex">
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 text-[#D8D2C6] transition-colors hover:text-white"
            >
              <PackageSearch className="h-3.5 w-3.5" aria-hidden="true" />
              Track order
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 text-[#D8D2C6] transition-colors hover:text-white"
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Help
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border">
        <div className="container-page flex h-16 items-center gap-2 sm:gap-4 md:h-20 md:gap-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="-ml-1 inline-flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-offwhite transition-colors hover:bg-charcoal sm:-ml-2 sm:w-11 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link
            href="/"
            aria-label="Creamice home"
            className="shrink-0 font-oswald text-[19px] font-semibold uppercase leading-none tracking-[0.1em] text-offwhite sm:text-[22px] sm:tracking-[0.12em] md:text-[28px]"
          >
            Creamice<span className="text-gold">.</span>
          </Link>

          <div className="mx-auto hidden w-full max-w-[560px] flex-1 lg:block">
            <SearchForm id="site-search-desktop" />
          </div>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? "Close search" : "Open search"}
              aria-expanded={searchOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-offwhite transition-colors hover:bg-charcoal lg:hidden"
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>

            <Link
              href="/track"
              className="hidden h-11 items-center rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-charcoal hover:text-offwhite md:inline-flex"
            >
              Track order
            </Link>

            <CartLink count={cartCount} />
          </div>
        </div>

        {searchOpen && (
          <div className="container-page pb-3 lg:hidden">
            <SearchForm id="site-search-mobile" />
          </div>
        )}
      </div>

      {/* Category bar */}
      <nav aria-label="Categories" className="border-b border-border bg-surface">
        <div className="no-scrollbar container-page flex h-11 items-center gap-6 overflow-x-auto text-[13px] md:h-12">
          <Link
            href="/shop"
            className="shrink-0 font-semibold uppercase tracking-[0.04em] text-offwhite transition-colors hover:text-gold-ink"
          >
            Shop all
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${encodeURIComponent(category.slug)}`}
              className="shrink-0 whitespace-nowrap text-muted transition-colors hover:text-offwhite"
            >
              {category.name}
            </Link>
          ))}
          <Link
            href="/updates"
            className="ml-auto hidden shrink-0 whitespace-nowrap text-muted transition-colors hover:text-offwhite md:inline"
          >
            Updates
          </Link>
        </div>
      </nav>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <nav aria-label="Menu" className="space-y-6">
          <SearchForm id="site-search-menu" />

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Shop
            </p>
            <Link
              href="/shop"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-[44px] items-center justify-between border-b border-border text-[15px] font-medium text-offwhite"
            >
              Shop all products
              <span aria-hidden="true" className="text-gold-ink">→</span>
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${encodeURIComponent(category.slug)}`}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center justify-between border-b border-border text-[15px] text-offwhite"
              >
                {category.name}
                <span aria-hidden="true" className="text-muted">→</span>
              </Link>
            ))}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Help
            </p>
            {infoLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center border-b border-border text-[15px] text-offwhite"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </Drawer>
    </header>
  );
}

function SearchForm({ id }: { id: string }) {
  return (
    <form action="/shop" method="get" role="search" className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        type="search"
        name="q"
        placeholder="Search hoodies, joggers, sweatshirts…"
        className="h-11 w-full rounded-full border border-border-strong bg-charcoal pl-5 pr-28 text-sm text-offwhite placeholder:text-muted transition-colors focus:border-gold focus:bg-surface focus:outline-none"
      />
      <button
        type="submit"
        className="absolute inset-y-1 right-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#121212] px-4 text-xs font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#2b2b2b]"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Search
      </button>
    </form>
  );
}

function CartLink({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-offwhite transition-colors hover:bg-charcoal"
    >
      <ShoppingBag className="h-[22px] w-[22px]" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold leading-none text-on-gold"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
