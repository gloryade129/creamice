"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { addToCart, type CartLine } from "@/lib/cart-storage";
import { cn } from "@/lib/utils";

interface QuickAddProps {
  productId: string;
  slug: string;
  name: string;
  priceKobo: number;
  imageUrl: string | null;
  variants: { id: string; size: string; color: string | null; stock: number }[];
  className?: string;
}

// Adds the first size that is in stock. The product page is where a customer
// chooses an exact size; this is the marketplace shortcut.
export function QuickAdd({
  productId,
  slug,
  name,
  priceKobo,
  imageUrl,
  variants,
  className,
}: QuickAddProps) {
  const [added, setAdded] = useState(false);
  const available = variants.find((variant) => variant.stock > 0);

  if (!available) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex h-9 w-full items-center justify-center rounded-lg border border-border text-xs font-semibold uppercase tracking-[0.06em] text-muted",
          className
        )}
      >
        Sold out
      </button>
    );
  }

  const handleClick = () => {
    const line: CartLine = {
      productId,
      variantId: available.id,
      slug,
      name,
      size: available.size,
      color: available.color,
      priceKobo,
      imageUrl,
      quantity: 1,
    };
    try {
      addToCart(line);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1500);
    } catch {
      // Storage blocked: the badge simply does not change. The cart page
      // repeats the error with a clearer explanation.
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-offwhite bg-transparent text-xs font-semibold uppercase tracking-[0.06em] text-offwhite transition-colors hover:bg-offwhite hover:text-jet",
        added && "border-success bg-success/10 text-success hover:bg-success/10 hover:text-success",
        className
      )}
    >
      {added ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Added
        </>
      ) : (
        <>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add to bag
        </>
      )}
    </button>
  );
}
