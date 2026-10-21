import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createPayment,
  isValidWebhookSignature,
  verifyPayment,
} from "../flutterwave";

const fetchMock = vi.fn();

beforeEach(() => {
  process.env.FLW_SECRET_KEY = "FLWSECK_TEST-fake";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.FLW_SECRET_KEY;
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createPayment", () => {
  it("sends naira amounts and a flat commission split", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: "success",
        data: { link: "https://checkout.flutterwave.com/v3/hosted/pay/abc" },
      })
    );

    const link = await createPayment({
      txRef: "CRM-TEST-1",
      totalKobo: 25_500_50,
      redirectUrl: "https://example.com/checkout/return",
      customer: { email: "a@example.com", name: "Ada", phone: "08012345678" },
      orderNumber: "CRM-1001",
      storeName: "Creamice",
      commissionKobo: 10_000_00,
      subaccountId: "RS_TEST",
    });

    expect(link).toBe("https://checkout.flutterwave.com/v3/hosted/pay/abc");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.flutterwave.com/v3/payments");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer FLWSECK_TEST-fake"
    );

    const body = JSON.parse(init.body as string);
    expect(body.amount).toBe(25500.5);
    expect(body.currency).toBe("NGN");
    expect(body.tx_ref).toBe("CRM-TEST-1");
    expect(body.subaccounts).toEqual([
      {
        id: "RS_TEST",
        transaction_charge_type: "flat_subaccount",
        transaction_charge: 10000,
      },
    ]);
  });

  it("omits the split when there is no subaccount or commission", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: "success",
        data: { link: "https://checkout.flutterwave.com/v3/hosted/pay/abc" },
      })
    );

    await createPayment({
      txRef: "CRM-TEST-2",
      totalKobo: 15_000_00,
      redirectUrl: "https://example.com/checkout/return",
      customer: { email: "a@example.com", name: "Ada", phone: "08012345678" },
      orderNumber: "CRM-1002",
      storeName: "Creamice",
      commissionKobo: 0,
      subaccountId: null,
    });

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.subaccounts).toBeUndefined();
  });

  it("refuses a response without an https payment link", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "success", data: {} }));
    await expect(
      createPayment({
        txRef: "CRM-TEST-3",
        totalKobo: 100,
        redirectUrl: "https://example.com/return",
        customer: { email: "a@example.com", name: "Ada", phone: "0801" },
        orderNumber: "CRM-1003",
        storeName: "Creamice",
        commissionKobo: 20,
        subaccountId: null,
      })
    ).rejects.toThrow("payment link");
  });

  it("refuses to build a payment without a secret key", async () => {
    delete process.env.FLW_SECRET_KEY;
    await expect(
      createPayment({
        txRef: "CRM-TEST-4",
        totalKobo: 100,
        redirectUrl: "https://example.com/return",
        customer: { email: "a@example.com", name: "Ada", phone: "0801" },
        orderNumber: "CRM-1004",
        storeName: "Creamice",
        commissionKobo: 20,
        subaccountId: null,
      })
    ).rejects.toThrow("not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("verifyPayment", () => {
  function verifyResponse(overrides: Record<string, unknown> = {}) {
    return jsonResponse({
      status: "success",
      data: {
        id: 12345,
        tx_ref: "CRM-1001",
        status: "successful",
        amount: 25500.5,
        currency: "NGN",
        ...overrides,
      },
    });
  }

  it("accepts a matching successful transaction", async () => {
    fetchMock.mockResolvedValue(verifyResponse());
    const result = await verifyPayment("12345", "CRM-1001", 25_500_50);
    expect(result).toEqual({ ok: true, transactionId: "12345" });
  });

  it("rejects a different reference", async () => {
    fetchMock.mockResolvedValue(verifyResponse({ tx_ref: "CRM-9999" }));
    const result = await verifyPayment("12345", "CRM-1001", 25_500_50);
    expect(result.ok).toBe(false);
  });

  it("rejects a different currency", async () => {
    fetchMock.mockResolvedValue(verifyResponse({ currency: "USD" }));
    const result = await verifyPayment("12345", "CRM-1001", 25_500_50);
    expect(result.ok).toBe(false);
  });

  it("rejects an amount below the stored total", async () => {
    fetchMock.mockResolvedValue(verifyResponse({ amount: 25000 }));
    const result = await verifyPayment("12345", "CRM-1001", 25_500_50);
    expect(result.ok).toBe(false);
  });

  it("accepts an amount above the stored total", async () => {
    fetchMock.mockResolvedValue(verifyResponse({ amount: 30000 }));
    const result = await verifyPayment("12345", "CRM-1001", 25_500_50);
    expect(result.ok).toBe(true);
  });

  it("rejects an unsuccessful transaction", async () => {
    fetchMock.mockResolvedValue(verifyResponse({ status: "failed" }));
    const result = await verifyPayment("12345", "CRM-1001", 25_500_50);
    expect(result.ok).toBe(false);
  });
});

describe("webhook signature", () => {
  it("accepts the exact secret", () => {
    expect(isValidWebhookSignature("abc123", "abc123")).toBe(true);
  });

  it("rejects a different or missing signature", () => {
    expect(isValidWebhookSignature("abc124", "abc123")).toBe(false);
    expect(isValidWebhookSignature(null, "abc123")).toBe(false);
    expect(isValidWebhookSignature("", "abc123")).toBe(false);
    expect(isValidWebhookSignature("abc123", undefined)).toBe(false);
    expect(isValidWebhookSignature("short", "a-much-longer-secret")).toBe(false);
  });
});
