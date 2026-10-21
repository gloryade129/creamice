import { timingSafeEqual } from "node:crypto";

// Server-only Flutterwave integration. Never import this file from a client
// component: the secret key must not reach the browser.
//
// Flow: create a hosted Standard payment from the server, send the shopper to
// the returned link, then verify the transaction with the API on return and
// from the webhook. The redirect parameters are only hints.

const API_BASE = "https://api.flutterwave.com/v3";

export class FlutterwaveError extends Error {
  constructor(
    message: string,
    readonly status = 502
  ) {
    super(message);
    this.name = "FlutterwaveError";
  }
}

function secretKey(): string {
  const key = process.env.FLW_SECRET_KEY;
  if (!key) throw new FlutterwaveError("Online payment is not configured yet.", 503);
  return key;
}

export function isPaymentConfigured(): boolean {
  return Boolean(process.env.FLW_SECRET_KEY);
}

export function isValidWebhookSignature(signature: string | null, secret: string | undefined): boolean {
  if (!signature || !secret) return false;
  const given = Buffer.from(signature);
  const expected = Buffer.from(secret);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Read the key before the try block: a missing key is a configuration
  // error, not a network failure, and must keep its own message.
  const key = secretKey();

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new FlutterwaveError("Could not reach the payment provider. Try again.");
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // A non-JSON response is still an error; do not log the body.
  }

  if (!response.ok) {
    throw new FlutterwaveError("The payment provider refused this request. Try again.");
  }

  return body as T;
}

interface CreatePaymentResponse {
  status: string;
  message?: string;
  data?: { link?: string };
}

export interface CreatePaymentInput {
  txRef: string;
  totalKobo: number;
  redirectUrl: string;
  customer: { email: string; name: string; phone: string };
  orderNumber: string;
  storeName: string;
  commissionKobo: number;
  subaccountId: string | null;
}

// Amounts go to Flutterwave in naira. This is the only place a kobo value is
// divided, and it is for the provider payload only.
export async function createPayment(input: CreatePaymentInput): Promise<string> {
  const split =
    input.subaccountId && input.commissionKobo > 0 && input.commissionKobo < input.totalKobo
      ? [
          {
            id: input.subaccountId,
            transaction_charge_type: "flat_subaccount" as const,
            transaction_charge: input.commissionKobo / 100,
          },
        ]
      : undefined;

  const response = await request<CreatePaymentResponse>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: input.totalKobo / 100,
      currency: "NGN",
      redirect_url: input.redirectUrl,
      customer: {
        email: input.customer.email,
        name: input.customer.name,
        phonenumber: input.customer.phone,
      },
      customizations: {
        title: `${input.storeName} order ${input.orderNumber}`,
      },
      meta: { order_number: input.orderNumber },
      ...(split ? { subaccounts: split } : {}),
      configurations: {
        session_duration: 30,
        max_retry_attempt: 5,
      },
    }),
  });

  const link = response.data?.link;
  if (response.status !== "success" || !link || !link.startsWith("https://")) {
    throw new FlutterwaveError("The payment provider did not return a payment link.");
  }
  return link;
}

interface VerifyTransactionResponse {
  status: string;
  data?: {
    id?: number;
    tx_ref?: string;
    status?: string;
    amount?: number;
    currency?: string;
  } | null;
}

export interface VerificationResult {
  ok: boolean;
  transactionId?: string;
  reason?: string;
}

// Accept a payment only when Flutterwave itself reports success and the
// reference, currency and amount all match the order we stored.
export async function verifyPayment(
  transactionId: string,
  txRef: string,
  expectedTotalKobo: number
): Promise<VerificationResult> {
  const response = await request<VerifyTransactionResponse>(
    `/transactions/${encodeURIComponent(transactionId)}/verify`
  );
  const data = response.data;

  if (response.status !== "success" || !data) {
    return { ok: false, reason: "Flutterwave could not find that transaction." };
  }
  if (data.status !== "successful") {
    return { ok: false, reason: "The payment was not successful." };
  }
  if (data.tx_ref !== txRef) {
    return { ok: false, reason: "The payment reference does not match this order." };
  }
  if (data.currency !== "NGN") {
    return { ok: false, reason: "The payment currency does not match this order." };
  }
  if (typeof data.amount !== "number" || Math.round(data.amount * 100) < expectedTotalKobo) {
    return { ok: false, reason: "The amount paid is less than the order total." };
  }
  if (typeof data.id !== "number" && typeof data.id !== "string") {
    return { ok: false, reason: "Flutterwave did not return a transaction ID." };
  }

  return { ok: true, transactionId: String(data.id) };
}
