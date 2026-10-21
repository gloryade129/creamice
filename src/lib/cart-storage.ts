// One browser storage key for the cart, shared by the header badge (T11)
// and the cart context, drawer and /cart page (T15). Prices never live
// here: whatever the customer stored is re-priced on the server at checkout.

export const CART_STORAGE_KEY = "creamice_cart";
// Fired (as a window CustomEvent) whenever the stored cart changes in this
// tab. Cross-tab changes arrive through the native "storage" event.
export const CART_CHANGED_EVENT = "creamice:cart-changed";

// Line count for the header badge. Parsing stays tolerant so an old or
// corrupt value shows an empty badge instead of crashing the header.
export function readCartCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return 0;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce<number>((total, line) => {
      const quantity = (line as { quantity?: unknown } | null)?.quantity;
      if (typeof quantity !== "number" || quantity <= 0) return total;
      return total + quantity;
    }, 0);
  } catch {
    return 0;
  }
}
