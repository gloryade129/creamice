import { describe, it, expect } from "vitest";
import {
  bpsToPercentInput,
  nairaAmountSchema,
  percentStringToBps,
  storeSettingsSchema,
} from "../validation/settings";

describe("commission percentage", () => {
  it("converts whole and fractional percentages to basis points", () => {
    expect(percentStringToBps("20")).toBe(2000);
    expect(percentStringToBps("20.5")).toBe(2050);
    expect(percentStringToBps("20.05")).toBe(2005);
    expect(percentStringToBps("0")).toBe(0);
    expect(percentStringToBps("100")).toBe(10000);
  });

  it("rejects values outside 0 to 100 and bad formats", () => {
    expect(percentStringToBps("100.01")).toBeNull();
    expect(percentStringToBps("-1")).toBeNull();
    expect(percentStringToBps("abc")).toBeNull();
    expect(percentStringToBps("20.123")).toBeNull();
  });

  it("formats basis points back into the form input", () => {
    expect(bpsToPercentInput(2000)).toBe("20");
    expect(bpsToPercentInput(2050)).toBe("20.50");
    expect(bpsToPercentInput(2005)).toBe("20.05");
  });
});

describe("settings validation", () => {
  const valid = {
    storeName: "Creamice",
    whatsappNumber: "+234 801 234 5678",
    whatsappChannelUrl: "https://whatsapp.com/channel/example",
    supportEmail: "hello@example.com",
    requireProductApproval: true,
    commissionPercent: "20",
    builderSubaccountId: "RS_123456",
  };

  it("accepts a complete settings form and clears optional blanks", () => {
    const parsed = storeSettingsSchema.parse({
      ...valid,
      whatsappNumber: "",
      whatsappChannelUrl: "",
      supportEmail: "",
      builderSubaccountId: "",
    });
    expect(parsed.whatsappNumber).toBeNull();
    expect(parsed.whatsappChannelUrl).toBeNull();
    expect(parsed.supportEmail).toBeNull();
    expect(parsed.builderSubaccountId).toBeNull();
  });

  it("rejects a channel link without http", () => {
    const result = storeSettingsSchema.safeParse({
      ...valid,
      whatsappChannelUrl: "whatsapp.com/channel/example",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a subaccount that is not a Flutterwave RS_ id", () => {
    const result = storeSettingsSchema.safeParse({
      ...valid,
      builderSubaccountId: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a commission above 100 percent", () => {
    const result = storeSettingsSchema.safeParse({
      ...valid,
      commissionPercent: "101",
    });
    expect(result.success).toBe(false);
  });
});

describe("naira amount input", () => {
  it("accepts whole naira and two decimal places", () => {
    expect(nairaAmountSchema.safeParse("3500").success).toBe(true);
    expect(nairaAmountSchema.safeParse("3500.50").success).toBe(true);
  });

  it("rejects negatives, commas and more than two decimals", () => {
    expect(nairaAmountSchema.safeParse("-3500").success).toBe(false);
    expect(nairaAmountSchema.safeParse("3,500").success).toBe(false);
    expect(nairaAmountSchema.safeParse("3500.555").success).toBe(false);
  });
});
