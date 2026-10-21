// Shared checkout shapes. This file has no server imports so the client can
// type its quote response without pulling the database client into the bundle.

export interface CheckoutItemInput {
  variantId: string;
  quantity: number;
}

export interface PricedLine {
  variantId: string;
  productId: string;
  name: string;
  size: string;
  color: string | null;
  unitPriceKobo: number;
  quantity: number;
  stock: number;
}

export interface CheckoutQuote {
  lines: PricedLine[];
  subtotalKobo: number;
  discountKobo: number;
  shippingKobo: number;
  totalKobo: number;
  commissionBaseKobo: number;
  commissionRate: number;
  commissionKobo: number;
  discountCode: string | null;
  state: string | null;
  // Problems that stop payment. The quote endpoint never throws for a
  // sold-out line or a bad code; it explains the problem to the shopper.
  issues: string[];
}

export interface QuoteRequest {
  items: CheckoutItemInput[];
  state?: string;
  discountCode?: string;
}

export interface CheckoutSavedAddress {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
}

// Optional signed-in prefill. The server builds this from the session; the
// browser never sends these values back as trusted data.
export interface CheckoutPrefill {
  email: string;
  name: string;
  phone: string | null;
  addresses: CheckoutSavedAddress[];
}
