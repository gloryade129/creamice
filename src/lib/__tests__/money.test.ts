import { describe, it, expect } from "vitest";
import {
  koboToNaira,
  nairaToKobo,
  koboToNairaInput,
  nairaStringToKobo,
  formatNaira,
  formatNairaWithSign,
  calculateCommission,
  calculateDiscount,
  calculateOrderTotals,
  addKobo,
  subtractKobo,
} from "../money";

describe("money helpers", () => {
  describe("koboToNaira", () => {
    it("converts kobo to naira", () => {
      expect(koboToNaira(100)).toBe(1);
      expect(koboToNaira(250000)).toBe(2500);
      expect(koboToNaira(0)).toBe(0);
    });

    it("rounds correctly", () => {
      expect(koboToNaira(150)).toBe(2);
      expect(koboToNaira(149)).toBe(1);
    });
  });

  describe("nairaToKobo", () => {
    it("converts naira to kobo", () => {
      expect(nairaToKobo(1)).toBe(100);
      expect(nairaToKobo(2500)).toBe(250000);
      expect(nairaToKobo(0)).toBe(0);
    });

    it("rounds correctly", () => {
      expect(nairaToKobo(1.5)).toBe(150);
      expect(nairaToKobo(1.49)).toBe(149);
    });
  });

  describe("formatNaira", () => {
    it("formats kobo as naira currency string", () => {
      expect(formatNaira(100)).toBe("₦1");
      expect(formatNaira(250000)).toBe("₦2,500");
      expect(formatNaira(0)).toBe("₦0");
    });
  });

  describe("formatNairaWithSign", () => {
    it("formats with naira sign (same as formatNaira)", () => {
      expect(formatNairaWithSign(100)).toBe("₦1");
      expect(formatNairaWithSign(250000)).toBe("₦2,500");
    });
  });

  describe("calculateCommission", () => {
    it("calculates commission correctly", () => {
      expect(calculateCommission(10000, 0.2)).toBe(2000);
      expect(calculateCommission(250000, 0.2)).toBe(50000);
      expect(calculateCommission(0, 0.2)).toBe(0);
    });

    it("handles different rates", () => {
      expect(calculateCommission(10000, 0.15)).toBe(1500);
      expect(calculateCommission(10000, 0.25)).toBe(2500);
    });
  });

  describe("calculateDiscount", () => {
    it("calculates percent discount", () => {
      expect(calculateDiscount(10000, "percent", 10)).toBe(1000);
      expect(calculateDiscount(250000, "percent", 20)).toBe(50000);
    });

    it("calculates fixed discount", () => {
      expect(calculateDiscount(10000, "fixed", 500)).toBe(500);
      expect(calculateDiscount(250000, "fixed", 5000)).toBe(5000);
    });
  });

  describe("calculateOrderTotals", () => {
    it("calculates totals correctly", () => {
      const { totalKobo, commissionBaseKobo } = calculateOrderTotals(10000, 1000, 2000);
      expect(totalKobo).toBe(11000);
      expect(commissionBaseKobo).toBe(9000);
    });

    it("handles zero discount", () => {
      const { totalKobo, commissionBaseKobo } = calculateOrderTotals(10000, 0, 2000);
      expect(totalKobo).toBe(12000);
      expect(commissionBaseKobo).toBe(10000);
    });
  });

  describe("addKobo", () => {
    it("adds two kobo amounts", () => {
      expect(addKobo(1000, 2000)).toBe(3000);
      expect(addKobo(0, 500)).toBe(500);
    });
  });

  describe("subtractKobo", () => {
    it("subtracts kobo amounts", () => {
      expect(subtractKobo(5000, 2000)).toBe(3000);
      expect(subtractKobo(1000, 2000)).toBe(0);
    });

    it("never returns negative", () => {
      expect(subtractKobo(100, 200)).toBe(0);
    });
  });

  describe("koboToNairaInput", () => {
    it("renders whole naira without decimals", () => {
      expect(koboToNairaInput(250000)).toBe("2500");
      expect(koboToNairaInput(0)).toBe("0");
    });

    it("keeps kobo that nairaToKobo would round away", () => {
      expect(koboToNairaInput(2500050)).toBe("25000.50");
      expect(koboToNairaInput(2500001)).toBe("25000.01");
    });
  });

  describe("nairaStringToKobo", () => {
    it("parses plain naira text as integer kobo", () => {
      expect(nairaStringToKobo("25000")).toBe(2500000);
      expect(nairaStringToKobo("0")).toBe(0);
    });

    it("parses kobo decimals exactly", () => {
      expect(nairaStringToKobo("25000.50")).toBe(2500050);
      expect(nairaStringToKobo("25000.5")).toBe(2500050);
      expect(nairaStringToKobo("0.01")).toBe(1);
    });

    it("has no float drift", () => {
      expect(nairaStringToKobo("19.99")).toBe(1999);
      expect(nairaStringToKobo("0.07")).toBe(7);
    });

    it("rejects malformed amounts", () => {
      expect(() => nairaStringToKobo("25,000")).toThrow();
      expect(() => nairaStringToKobo("25000.123")).toThrow();
      expect(() => nairaStringToKobo("-5")).toThrow();
      expect(() => nairaStringToKobo("")).toThrow();
    });
  });
});