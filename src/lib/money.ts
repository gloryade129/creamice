export function koboToNaira(kobo: number): number {
  return Math.round(kobo / 100);
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export function formatNairaWithSign(kobo: number): string {
  return formatNaira(kobo);
}

export function calculateCommission(subtotalKobo: number, commissionRate: number): number {
  return Math.round(subtotalKobo * commissionRate);
}

export function calculateDiscount(subtotalKobo: number, discountType: "percent" | "fixed", value: number): number {
  if (discountType === "percent") {
    return Math.round(subtotalKobo * (value / 100));
  }
  return value;
}

export function calculateOrderTotals(
  subtotalKobo: number,
  discountKobo: number,
  shippingKobo: number
): { totalKobo: number; commissionBaseKobo: number } {
  const commissionBaseKobo = subtotalKobo - discountKobo;
  const totalKobo = commissionBaseKobo + shippingKobo;
  return { totalKobo, commissionBaseKobo };
}

export function addKobo(a: number, b: number): number {
  return a + b;
}

export function subtractKobo(a: number, b: number): number {
  return Math.max(0, a - b);
}