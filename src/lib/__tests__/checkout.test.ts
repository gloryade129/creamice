import { describe, it, expect } from "vitest";
import { quoteTotals } from "../checkout-calc";
import { checkoutSchema, quoteSchema } from "../validation/checkout";

const variant = "0b9c1f5e-3f4a-4f6b-8c2d-1e2f3a4b5c6d";

function validCheckout(overrides: Record<string, unknown> = {}) {
  return {
    customerName: "Ada Obi",
    customerEmail: "ADA@Example.com",
    customerPhone: "0801 234 5678",
    shippingAddress: "12 Broad Street",
    shippingCity: "Lagos",
    shippingState: "Lagos",
    deliveryNote: "",
    items: [{ variantId: variant, quantity: 2 }],
    ...overrides,
  };
}

describe("quote totals", () => {
  it("adds delivery after discount without putting it in commission", () => {
    const totals = quoteTotals(50_000_00, 0, 3_000_00, 0.2);
    expect(totals.commissionBaseKobo).toBe(50_000_00);
    expect(totals.commissionKobo).toBe(10_000_00);
    expect(totals.totalKobo).toBe(53_000_00);
  });

  it("takes commission after the discount and still excludes delivery", () => {
    const totals = quoteTotals(80_000_00, 20_000_00, 5_000_00, 0.2);
    expect(totals.commissionBaseKobo).toBe(60_000_00);
    expect(totals.commissionKobo).toBe(12_000_00);
    expect(totals.totalKobo).toBe(65_000_00);
  });

  it("never discounts below zero or above the subtotal", () => {
    const totals = quoteTotals(10_000_00, 25_000_00, 0, 0.2);
    expect(totals.discountKobo).toBe(10_000_00);
    expect(totals.commissionBaseKobo).toBe(0);
    expect(totals.totalKobo).toBe(0);
    expect(totals.commissionKobo).toBe(0);
  });

  it("rounds commission to the nearest kobo", () => {
    expect(quoteTotals(1_00, 0, 0, 0.2).commissionKobo).toBe(20);
    expect(quoteTotals(3_00, 0, 0, 0.2).commissionKobo).toBe(60);
    expect(quoteTotals(2_01, 0, 0, 0.2).commissionKobo).toBe(40);
  });

  it("rejects negative inputs instead of subtracting money", () => {
    const totals = quoteTotals(-500, -500, -1_000, 0.2);
    expect(totals.subtotalKobo).toBe(0);
    expect(totals.discountKobo).toBe(0);
    expect(totals.shippingKobo).toBe(0);
    expect(totals.totalKobo).toBe(0);
  });

  it("keeps a zero commission when the rate is zero", () => {
    const totals = quoteTotals(25_000_00, 0, 2_000_00, 0);
    expect(totals.commissionKobo).toBe(0);
    expect(totals.totalKobo).toBe(27_000_00);
  });
});

describe("checkout validation", () => {
  it("normalises email to lower case and trims the name", () => {
    const parsed = checkoutSchema.parse(validCheckout({ customerName: "  Ada Obi  " }));
    expect(parsed.customerEmail).toBe("ada@example.com");
    expect(parsed.customerName).toBe("Ada Obi");
  });

  it("drops an empty delivery note", () => {
    expect(checkoutSchema.parse(validCheckout()).deliveryNote).toBeUndefined();
  });

  it("accepts a valid Nigerian state and rejects anything else", () => {
    expect(checkoutSchema.safeParse(validCheckout({ shippingState: "FCT" })).success).toBe(true);
    expect(checkoutSchema.safeParse(validCheckout({ shippingState: "Lagos State" })).success).toBe(false);
  });

  it("uppercases a discount code", () => {
    const parsed = checkoutSchema.parse(validCheckout({ discountCode: "  first10 " }));
    expect(parsed.discountCode).toBe("FIRST10");
  });

  it("rejects a preview/demo id that is not a UUID", () => {
    const result = checkoutSchema.safeParse(
      validCheckout({ items: [{ variantId: "demo-hoodie-m", quantity: 1 }] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects quantities outside 1 to 10", () => {
    expect(quoteSchema.safeParse({ items: [{ variantId: variant, quantity: 0 }] }).success).toBe(false);
    expect(quoteSchema.safeParse({ items: [{ variantId: variant, quantity: 11 }] }).success).toBe(false);
    expect(quoteSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it("requires enough customer detail for delivery", () => {
    expect(checkoutSchema.safeParse(validCheckout({ customerPhone: "call me" })).success).toBe(false);
    expect(checkoutSchema.safeParse(validCheckout({ shippingAddress: "x" })).success).toBe(false);
    expect(checkoutSchema.safeParse(validCheckout({ customerEmail: "not-an-email" })).success).toBe(false);
  });

  it("allows a quote without customer details", () => {
    const result = quoteSchema.safeParse({
      items: [{ variantId: variant, quantity: 1 }],
      state: "Lagos",
      discountCode: "first10",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.discountCode).toBe("FIRST10");
  });
});
