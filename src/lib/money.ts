export function koboToNaira(kobo: number): number {
  return Math.round(kobo / 100);
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

// Exact kobo -> naira text for form fields. koboToNaira rounds to whole naira,
// which would corrupt prices like 2500050 kobo (₦25,000.50) on reload.
export function koboToNairaInput(kobo: number): string {
  const naira = Math.trunc(kobo / 100);
  const rest = Math.abs(kobo % 100);
  return rest === 0 ? String(naira) : `${naira}.${String(rest).padStart(2, "0")}`;
}

// Parse a user-typed naira amount ("25000", "25000.50") into integer kobo
// without floating point: split the string instead of multiplying a float.
export function nairaStringToKobo(value: string): number {
  const match = /^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new Error("Invalid naira amount");
  const whole = Number(match[1]);
  const fraction = (match[2] ?? "").padEnd(2, "0");
  return whole * 100 + Number(fraction);
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