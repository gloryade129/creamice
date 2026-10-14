import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextStatuses,
  isTerminalStatus,
  isPaidStatus,
} from "../orders";

describe("order status transitions", () => {
  describe("canTransition", () => {
    describe("pending_payment", () => {
      it("allows paid by admin", () => {
        expect(canTransition("pending_payment", "paid", "admin")).toBe(true);
      });

      it("allows cancelled by admin", () => {
        expect(canTransition("pending_payment", "cancelled", "admin")).toBe(true);
      });

      it("allows cancelled by system", () => {
        expect(canTransition("pending_payment", "cancelled", "partner", true)).toBe(true);
      });

      it("denies paid by partner", () => {
        expect(canTransition("pending_payment", "paid", "partner")).toBe(false);
      });

      it("denies paid by board", () => {
        expect(canTransition("pending_payment", "paid", "board")).toBe(false);
      });

      it("denies invalid transitions", () => {
        expect(canTransition("pending_payment", "confirmed", "admin")).toBe(false);
        expect(canTransition("pending_payment", "shipped", "admin")).toBe(false);
      });
    });

    describe("paid", () => {
      it("allows confirmed by admin", () => {
        expect(canTransition("paid", "confirmed", "admin")).toBe(true);
      });

      it("allows confirmed by partner", () => {
        expect(canTransition("paid", "confirmed", "partner")).toBe(true);
      });

      it("allows cancelled by admin", () => {
        expect(canTransition("paid", "cancelled", "admin")).toBe(true);
      });

      it("denies cancelled by partner", () => {
        expect(canTransition("paid", "cancelled", "partner")).toBe(false);
      });

      it("denies invalid transitions", () => {
        expect(canTransition("paid", "processing", "admin")).toBe(false);
        expect(canTransition("paid", "shipped", "partner")).toBe(false);
      });
    });

    describe("confirmed", () => {
      it("allows processing by admin", () => {
        expect(canTransition("confirmed", "processing", "admin")).toBe(true);
      });

      it("allows processing by partner", () => {
        expect(canTransition("confirmed", "processing", "partner")).toBe(true);
      });

      it("allows cancelled by admin", () => {
        expect(canTransition("confirmed", "cancelled", "admin")).toBe(true);
      });

      it("denies cancelled by partner", () => {
        expect(canTransition("confirmed", "cancelled", "partner")).toBe(false);
      });
    });

    describe("processing", () => {
      it("allows shipped by admin", () => {
        expect(canTransition("processing", "shipped", "admin")).toBe(true);
      });

      it("allows shipped by partner", () => {
        expect(canTransition("processing", "shipped", "partner")).toBe(true);
      });

      it("allows cancelled by admin", () => {
        expect(canTransition("processing", "cancelled", "admin")).toBe(true);
      });
    });

    describe("shipped", () => {
      it("allows delivered by admin", () => {
        expect(canTransition("shipped", "delivered", "admin")).toBe(true);
      });

      it("allows delivered by partner", () => {
        expect(canTransition("shipped", "delivered", "partner")).toBe(true);
      });

      it("denies cancelled", () => {
        expect(canTransition("shipped", "cancelled", "admin")).toBe(false);
      });
    });

    describe("delivered", () => {
      it("allows no transitions", () => {
        expect(canTransition("delivered", "cancelled", "admin")).toBe(false);
        expect(canTransition("delivered", "shipped", "admin")).toBe(false);
      });
    });

    describe("cancelled", () => {
      it("allows no transitions", () => {
        expect(canTransition("cancelled", "paid", "admin")).toBe(false);
        expect(canTransition("cancelled", "delivered", "admin")).toBe(false);
      });
    });
  });

  describe("getNextStatuses", () => {
    it("returns valid next statuses", () => {
      expect(getNextStatuses("pending_payment")).toEqual(["paid", "cancelled"]);
      expect(getNextStatuses("paid")).toEqual(["confirmed", "cancelled"]);
      expect(getNextStatuses("confirmed")).toEqual(["processing", "cancelled"]);
      expect(getNextStatuses("processing")).toEqual(["shipped", "cancelled"]);
      expect(getNextStatuses("shipped")).toEqual(["delivered"]);
      expect(getNextStatuses("delivered")).toEqual([]);
      expect(getNextStatuses("cancelled")).toEqual([]);
    });
  });

  describe("isTerminalStatus", () => {
    it("returns true for terminal statuses", () => {
      expect(isTerminalStatus("delivered")).toBe(true);
      expect(isTerminalStatus("cancelled")).toBe(true);
    });

    it("returns false for non-terminal statuses", () => {
      expect(isTerminalStatus("pending_payment")).toBe(false);
      expect(isTerminalStatus("paid")).toBe(false);
      expect(isTerminalStatus("confirmed")).toBe(false);
      expect(isTerminalStatus("processing")).toBe(false);
      expect(isTerminalStatus("shipped")).toBe(false);
    });
  });

  describe("isPaidStatus", () => {
    it("returns true for paid statuses", () => {
      expect(isPaidStatus("paid")).toBe(true);
      expect(isPaidStatus("confirmed")).toBe(true);
      expect(isPaidStatus("processing")).toBe(true);
      expect(isPaidStatus("shipped")).toBe(true);
      expect(isPaidStatus("delivered")).toBe(true);
    });

    it("returns false for unpaid statuses", () => {
      expect(isPaidStatus("pending_payment")).toBe(false);
      expect(isPaidStatus("cancelled")).toBe(false);
    });
  });
});