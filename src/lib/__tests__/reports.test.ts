import { describe, it, expect } from "vitest";
import {
  buildCommissionCsv,
  commissionRatePercent,
  koboToDecimal,
  lagosDayRange,
  lagosMonthRange,
  lagosMonthValue,
  parseMonthValue,
  type CommissionCsvRow,
} from "../reports";

describe("Lagos reporting periods", () => {
  it("puts a late UTC night into the next Lagos day", () => {
    expect(lagosMonthValue(new Date("2026-10-31T23:30:00Z"))).toBe("2026-11");
  });

  it("builds a half-open month range in UTC", () => {
    expect(lagosMonthRange(2026, 1)).toEqual({
      startIso: "2025-12-31T23:00:00.000Z",
      endIso: "2026-01-31T23:00:00.000Z",
    });
  });

  it("builds a Lagos day range", () => {
    expect(lagosDayRange(new Date("2026-10-21T12:00:00Z"))).toEqual({
      startIso: "2026-10-20T23:00:00.000Z",
      endIso: "2026-10-21T23:00:00.000Z",
    });
  });

  it("accepts a valid month and falls back for bad input", () => {
    expect(parseMonthValue("2026-02")).toEqual({
      year: 2026,
      month: 2,
      value: "2026-02",
    });
    expect(parseMonthValue("2026-13").value).toBe(lagosMonthValue());
    expect(parseMonthValue("").value).toBe(lagosMonthValue());
  });
});

describe("spreadsheet money", () => {
  it("formats exact kobo without a symbol or separators", () => {
    expect(koboToDecimal(5_350_000)).toBe("53500.00");
    expect(koboToDecimal(5)).toBe("0.05");
    expect(koboToDecimal(-105)).toBe("-1.05");
    expect(koboToDecimal(0)).toBe("0.00");
  });

  it("formats the commission rate as a percentage", () => {
    expect(commissionRatePercent(0.2)).toBe("20.00");
    expect(commissionRatePercent(0.125)).toBe("12.50");
  });
});

describe("commission CSV", () => {
  const row: CommissionCsvRow = {
    orderNumber: "CRM-1001",
    paidAt: "2026-10-21T11:00:00.000Z",
    orderStatus: "paid",
    customerName: 'Ada, "Ace" Obi',
    productValueKobo: 5_000_000,
    deliveryKobo: 350_000,
    totalKobo: 5_350_000,
    commissionRate: 0.2,
    commissionKobo: 1_000_000,
    builderSubaccountId: "RS_123",
    txRef: "tx-1",
  };

  it("writes a header and one line per payment", () => {
    const csv = buildCommissionCsv(
      { year: 2026, month: 10, value: "2026-10" },
      [row]
    );
    const lines = csv.split("\r\n");
    expect(lines[0]).toContain("Order number");
    expect(lines[0]).toContain("Commission (NGN)");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("CRM-1001");
    expect(lines[1]).toContain("50000.00");
    expect(lines[1]).toContain("10000.00");
    expect(lines[1]).toContain('"Ada, ""Ace"" Obi"');
  });

  it("leaves a missing subaccount empty instead of printing null", () => {
    const csv = buildCommissionCsv(
      { year: 2026, month: 10, value: "2026-10" },
      [{ ...row, builderSubaccountId: null }]
    );
    expect(csv).not.toContain("null");
  });
});
