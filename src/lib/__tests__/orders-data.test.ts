import { describe, it, expect } from "vitest";
import {
  PARTNER_ORDER_COLUMNS,
  PARTNER_ORDER_DETAIL_COLUMNS,
} from "../data/partner-orders";

// The partner pages must not even fetch money, not just hide it in the UI.
// These column strings are the whole surface area for partner order reads.
const MONEY_FIELDS = [
  "unit_price",
  "order_payments",
  "total_kobo",
  "subtotal_kobo",
  "discount_kobo",
  "shipping_kobo",
  "commission",
  "paid_at",
  "tx_ref",
];

describe("partner order queries", () => {
  it("never select a money or payment column", () => {
    for (const columns of [PARTNER_ORDER_COLUMNS, PARTNER_ORDER_DETAIL_COLUMNS]) {
      for (const field of MONEY_FIELDS) {
        expect(columns).not.toContain(field);
      }
    }
  });

  it("selects the operational fields the partner detail needs", () => {
    expect(PARTNER_ORDER_DETAIL_COLUMNS).toContain("customer_phone");
    expect(PARTNER_ORDER_DETAIL_COLUMNS).toContain("shipping_address");
    expect(PARTNER_ORDER_DETAIL_COLUMNS).toContain(
      "order_items (product_name, size, color, quantity)"
    );
    expect(PARTNER_ORDER_DETAIL_COLUMNS).toContain("order_events");
  });
});
