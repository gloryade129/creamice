"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { addToCart } from "@/lib/cart-storage";
import { cn } from "@/lib/utils";

interface PurchaseProps {
  productId: string;
  slug: string;
  name: string;
  priceKobo: number;
  imageUrl: string | null;
  variants: { id: string; size: string; color: string | null; stock: number }[];
}

export function ProductPurchase({
  productId,
  slug,
  name,
  priceKobo,
  imageUrl,
  variants,
}: PurchaseProps) {
  const firstAvailable = variants.find((variant) => variant.stock > 0);
  const [size, setSize] = useState(firstAvailable?.size ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const selected = variants.find((variant) => variant.size === size);
  const allSoldOut = variants.every((variant) => variant.stock <= 0);
  const maxQuantity = Math.max(1, Math.min(9, selected?.stock ?? 1));

  const handleAdd = () => {
    setError("");
    if (!selected || selected.stock <= 0) {
      setError("Choose a size that is in stock.");
      return;
    }

    try {
      addToCart({
        productId,
        variantId: selected.id,
        slug,
        name,
        size: selected.size,
        color: selected.color,
        priceKobo,
        imageUrl,
        quantity: Math.min(quantity, maxQuantity),
      });
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2500);
    } catch {
      setError("Could not save your bag in this browser. Try again or use another browser.");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-offwhite">
            Size
          </p>
          <p className="text-xs text-muted">
            {allSoldOut ? "Restocking" : "Select a size"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {variants.length === 0 && (
            <p className="text-sm text-muted">Sizes will appear when this product is ready.</p>
          )}
          {variants.map((variant) => {
            const disabled = variant.stock <= 0;
            return (
              <button
                key={variant.id}
                type="button"
                disabled={disabled}
                aria-pressed={size === variant.size}
                onClick={() => {
                  setSize(variant.size);
                  setQuantity(1);
                  setError("");
                }}
                className={cn(
                  "inline-flex h-11 min-w-[52px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors",
                  disabled
                    ? "cursor-not-allowed border-border text-muted/60 line-through"
                    : size === variant.size
                      ? "border-offwhite bg-offwhite text-jet"
                      : "border-border-strong text-offwhite hover:border-offwhite"
                )}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-offwhite">
          Quantity
        </p>
        <div className="inline-flex h-11 items-center rounded-lg border border-border-strong">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="inline-flex h-full w-11 items-center justify-center text-offwhite transition-colors hover:bg-charcoal disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm tabular-nums text-offwhite" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
            disabled={quantity >= maxQuantity}
            aria-label="Increase quantity"
            className="inline-flex h-full w-11 items-center justify-center text-offwhite transition-colors hover:bg-charcoal disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={allSoldOut}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold px-6 text-sm font-semibold uppercase tracking-[0.04em] text-on-gold transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Added to bag
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {allSoldOut ? "Sold out" : "Add to bag"}
            </>
          )}
        </button>

        {added && (
          <Link
            href="/cart"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border-strong text-sm font-semibold text-offwhite transition-colors hover:border-offwhite"
          >
            View bag
          </Link>
        )}
      </div>
    </div>
  );
}
