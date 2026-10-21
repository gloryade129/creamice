// One browser storage key for the cart, shared by the header badge, the
// product page, /cart and checkout. Prices in storage are display data only:
// checkout re-prices every line on the server from the variant ID.

export const CART_STORAGE_KEY = "creamice_cart";
// Fired (as a window CustomEvent) whenever the stored cart changes in this
// tab. Cross-tab changes arrive through the native "storage" event.
export const CART_CHANGED_EVENT = "creamice:cart-changed";

export interface CartLine {
  productId: string;
  // The variant is what checkout re-prices and reserves. Demo products carry
  // demo ids; the server rejects anything it cannot find.
  variantId: string;
  slug: string;
  name: string;
  size: string;
  color: string | null;
  priceKobo: number;
  imageUrl: string | null;
  quantity: number;
}

export function cartLineKey(line: Pick<CartLine, "productId" | "size" | "color">): string {
  return `${line.productId}|${line.size}|${line.color ?? ""}`;
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.productId === "string" &&
    typeof line.variantId === "string" &&
    typeof line.slug === "string" &&
    typeof line.name === "string" &&
    typeof line.size === "string" &&
    (line.color === null || typeof line.color === "string") &&
    typeof line.priceKobo === "number" &&
    Number.isFinite(line.priceKobo) &&
    (line.imageUrl === null || typeof line.imageUrl === "string") &&
    typeof line.quantity === "number" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    line.quantity <= 99
  );
}

// Parsing stays tolerant so an old or corrupt value shows an empty cart
// instead of crashing the header or checkout.
export function parseCartValue(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartLine);
  } catch {
    return [];
  }
}

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    return parseCartValue(window.localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

function emitChange(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail: lines }));
}

export function writeCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    emitChange(lines);
  } catch {
    // Storage can be full or blocked (private mode). The page still works,
    // the cart just will not survive a refresh; the caller shows the error.
    throw new Error("Could not save your cart in this browser.");
  }
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
  emitChange([]);
}

export function addToCart(next: CartLine): CartLine[] {
  const lines = readCart();
  const key = cartLineKey(next);
  const existing = lines.find((line) => cartLineKey(line) === key);

  const merged = existing
    ? lines.map((line) =>
        cartLineKey(line) === key
          ? { ...line, quantity: Math.min(99, line.quantity + next.quantity) }
          : line
      )
    : [...lines, next];

  writeCart(merged);
  return merged;
}

export function updateQuantity(key: string, quantity: number): CartLine[] {
  const clamped = Math.max(0, Math.min(99, Math.floor(quantity)));
  const lines = readCart();
  const next =
    clamped === 0
      ? lines.filter((line) => cartLineKey(line) !== key)
      : lines.map((line) =>
          cartLineKey(line) === key ? { ...line, quantity: clamped } : line
        );
  writeCart(next);
  return next;
}

export function removeLine(key: string): CartLine[] {
  const next = readCart().filter((line) => cartLineKey(line) !== key);
  writeCart(next);
  return next;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.priceKobo * line.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

// Line count for the header badge.
export function readCartCount(): number {
  return cartCount(readCart());
}
