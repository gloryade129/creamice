"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { CART_CHANGED_EVENT, readCartCount } from "@/lib/cart-storage";

export interface HeaderCategory {
  name: string;
  slug: string;
}

// Internal information pages arrive with T29; they are linked here so the
// navigation is complete and nothing has to be rewired later.
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

// PRD 5.1. The wordmark is text until the owner delivers a transparent
// logo file (task O-5): the current JPEG has a white background that
// would show as a white box on Jet Black.
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
    <header className="sticky top-0 z-40 bg-jet border-b border-border">
      {/* Mobile row: menu, centred wordmark, search and cart */}
      <div className="grid grid-cols-3 items-center h-14 px-2 md:hidden">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="h-11 w-11 flex items-center justify-center text-offwhite hover:text-gold transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <Link
          href="/"
          className="justify-self-center font-oswald font-semibold text-xl uppercase tracking-[0.02em] text-gold"
        >
          Creamice
        </Link>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label={searchOpen ? "Close search" : "Open search"}
            aria-expanded={searchOpen}
            className="h-11 w-11 flex items-center justify-center text-offwhite hover:text-gold transition-colors"
          >
            {searchOpen ? <X className="w-6 h-6" /> : <Search className="w-6 h-6" />}
          </button>
          <CartLink count={cartCount} />
        </div>
      </div>

      {/* Desktop row: wordmark, search, cart */}
      <div className="hidden md:flex items-center gap-8 h-16 px-8">
        <Link
          href="/"
          className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em] text-gold shrink-0"
        >
          Creamice
        </Link>
        <div className="flex-1 max-w-xl mx-auto">
          <SearchForm />
        </div>
        <div className="flex items-center shrink-0">
          <CartLink count={cartCount} />
        </div>
      </div>

      {/* Mobile search bar, toggled by the search icon */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <SearchForm />
        </div>
      )}

      {/* Desktop category row */}
      {categories.length > 0 && (
        <nav aria-label="Categories" className="hidden md:block border-t border-border">
          <div className="px-8 flex items-center gap-6 h-11 text-sm font-montserrat">
            <Link
              href="/shop"
              className="uppercase tracking-[0.04em] text-offwhite hover:text-gold transition-colors"
            >
              Shop all
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${encodeURIComponent(category.slug)}`}
                className="uppercase tracking-[0.04em] text-muted hover:text-gold transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Announcement strip (PRD 5.1: text only, no icons) */}
      <div className="border-t border-border py-1.5 text-center text-xs text-muted">
        Delivery across Nigeria · Secure payment by Flutterwave
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <nav aria-label="Menu" className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.04em] text-muted mb-1">Shop</p>
            <Link
              href="/shop"
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-base font-montserrat text-offwhite hover:text-gold transition-colors border-b border-border"
            >
              Shop all products
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${encodeURIComponent(category.slug)}`}
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-base font-montserrat text-offwhite hover:text-gold transition-colors border-b border-border"
              >
                {category.name}
              </Link>
            ))}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.04em] text-muted mb-1">Information</p>
            {infoLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-base font-montserrat text-offwhite hover:text-gold transition-colors border-b border-border"
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

// Plain GET form: search is server-side (PRD 5.4), no JavaScript needed.
function SearchForm() {
  return (
    <form action="/shop" method="get" role="search" className="relative w-full">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        name="q"
        placeholder="Search products"
        className="w-full h-11 bg-charcoal border border-border-strong rounded-[4px] pl-4 pr-12 text-sm text-offwhite placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-jet"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-offwhite hover:text-gold transition-colors"
      >
        <Search className="w-5 h-5" />
      </button>
    </form>
  );
}

function CartLink({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
      className="relative h-11 w-11 flex items-center justify-center text-offwhite hover:text-gold transition-colors"
    >
      <ShoppingCart className="w-6 h-6" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-gold text-jet text-[11px] font-semibold rounded-[2px]"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
