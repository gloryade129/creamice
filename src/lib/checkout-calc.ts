import { calculateCommission } from "@/lib/money";

export interface QuoteTotals {
  subtotalKobo: number;
  discountKobo: number;
  shippingKobo: number;
  commissionBaseKobo: number;
  commissionKobo: number;
  totalKobo: number;
}

// Pure money rules for an order:
//   total = (subtotal - discount) + delivery
//   commission = rate x (subtotal - discount)
// Delivery is never part of the commission. Every value stays in integer kobo.
export function quoteTotals(
  subtotalKobo: number,
  discountKobo: number,
  shippingKobo: number,
  commissionRate: number
): QuoteTotals {
  const subtotal = Math.max(0, Math.round(subtotalKobo));
  const discount = Math.min(subtotal, Math.max(0, Math.round(discountKobo)));
  const shipping = Math.max(0, Math.round(shippingKobo));
  const commissionBaseKobo = subtotal - discount;
  const commissionKobo = calculateCommission(commissionBaseKobo, commissionRate);

  return {
    subtotalKobo: subtotal,
    discountKobo: discount,
    shippingKobo: shipping,
    commissionBaseKobo,
    commissionKobo,
    totalKobo: commissionBaseKobo + shipping,
  };
}
