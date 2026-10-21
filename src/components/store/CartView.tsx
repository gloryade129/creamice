"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Minus, Plus, Shirt, ShoppingBag, Trash2 } from "lucide-react";
import { cartLineKey, cartSubtotal, removeLine, updateQuantity } from "@/lib/cart-storage";
import { useCart } from "@/lib/use-cart";
import { formatNaira } from "@/lib/money";

export function CartView() {
  const { lines, mounted } = useCart();
  const [error, setError] = useState("");

  const change = (key: string, quantity: number) => {
    setError("");
    try {
      updateQuantity(key, quantity);
    } catch {
      setError("Could not update your bag. Check that this browser allows storage.");
    }
  };

  const remove = (key: string) => {
    setError("");
    try {
      removeLine(key);
    } catch {
      setError("Could not update your bag. Check that this browser allows storage.");
    }
  };

  if (!mounted) {
    return (
      <div className="rounded-xl border border-border bg-charcoal px-6 py-16 text-center text-sm text-muted">
        Loading your bag…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-charcoal px-6 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface text-offwhite">
          <ShoppingBag className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-montserrat text-lg font-semibold text-offwhite">
          Your bag is empty
        </h2>
        <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted">
          Add a piece from the shop and it will appear here.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#121212] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2b2b2b]"
        >
          Shop the collection
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
      <div>
        {error && (
          <p className="mb-4 rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <ul className="divide-y divide-border border-y border-border">
          {lines.map((line) => {
            const key = cartLineKey(line);
            return (
              <li key={key} className="flex gap-3 py-4 sm:gap-5 sm:py-5">
                <Link
                  href={`/product/${line.slug}`}
                  className="relative h-[96px] w-[76px] shrink-0 overflow-hidden rounded-lg border border-border bg-charcoal sm:h-[112px] sm:w-[90px]"
                >
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt={line.name}
                      fill
                      sizes="90px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Shirt className="h-7 w-7 text-border-strong" aria-hidden="true" />
                    </span>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${line.slug}`}
                        className="block truncate text-sm font-semibold text-offwhite transition-colors hover:text-gold-ink sm:text-[15px]"
                      >
                        {line.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted">
                        Size {line.size}
                        {line.color ? ` · ${line.color}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(key)}
                      aria-label={`Remove ${line.name}`}
                      className="-mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-charcoal hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                    <div className="inline-flex h-9 items-center rounded-lg border border-border-strong">
                      <button
                        type="button"
                        onClick={() => change(key, line.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="inline-flex h-full w-9 items-center justify-center text-offwhite transition-colors hover:bg-charcoal"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums text-offwhite">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => change(key, line.quantity + 1)}
                        disabled={line.quantity >= 99}
                        aria-label="Increase quantity"
                        className="inline-flex h-full w-9 items-center justify-center text-offwhite transition-colors hover:bg-charcoal disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-offwhite">
                        {formatNaira(line.priceKobo * line.quantity)}
                      </p>
                      {line.quantity > 1 && (
                        <p className="text-[11px] tabular-nums text-muted">
                          {formatNaira(line.priceKobo)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          href="/shop"
          className="mt-5 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-offwhite transition-colors hover:text-gold-ink"
        >
          <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" />
          Continue shopping
        </Link>
      </div>

      <aside className="rounded-xl border border-border bg-charcoal p-5 lg:sticky lg:top-44 lg:p-6">
        <h2 className="font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
          Order summary
        </h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-medium tabular-nums text-offwhite">
              {formatNaira(subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Delivery</dt>
            <dd className="text-right text-xs text-muted">Calculated at checkout</dd>
          </div>
        </dl>

        <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-border pt-4">
          <span className="text-sm font-semibold text-offwhite">Total</span>
          <span className="text-xl font-semibold tabular-nums text-offwhite">
            {formatNaira(subtotal)}
          </span>
        </div>

        <Link
          href="/checkout"
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold text-sm font-semibold uppercase tracking-[0.04em] text-on-gold transition-colors hover:bg-gold-hover"
        >
          Checkout
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
          Prices are confirmed on the server at checkout. Secure payment by
          Flutterwave.
        </p>
      </aside>
    </div>
  );
}
