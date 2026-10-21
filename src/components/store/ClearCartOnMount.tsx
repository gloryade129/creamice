"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart-storage";

// The bag is cleared only when the shopper lands on the order page straight
// from a verified payment (paid=1). Opening an old order later must not wipe
// a bag they have started since.
export function ClearCartOnMount() {
  useEffect(() => {
    clearCart();
  }, []);
  return null;
}
