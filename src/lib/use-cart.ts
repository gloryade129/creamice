"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  CART_CHANGED_EVENT,
  CART_STORAGE_KEY,
  parseCartValue,
  type CartLine,
} from "@/lib/cart-storage";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CART_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CART_CHANGED_EVENT, callback);
  };
}

function getSnapshot(): string {
  return window.localStorage.getItem(CART_STORAGE_KEY) ?? "";
}

// Null on the server so the page can show a "loading" state during hydration
// instead of flashing the empty-bag message before storage is read.
function getServerSnapshot(): string | null {
  return null;
}

export function useCart(): { mounted: boolean; lines: CartLine[] } {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(
    () => ({
      mounted: raw !== null,
      lines: raw ? parseCartValue(raw) : [],
    }),
    [raw]
  );
}
