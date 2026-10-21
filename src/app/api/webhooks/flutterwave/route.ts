import { NextResponse } from "next/server";
import {
  getPaymentByTxRef,
  markOrderPaid,
  CheckoutError,
} from "@/lib/data/checkout";
import { isValidWebhookSignature, verifyPayment } from "@/lib/flutterwave";
import { sendOrderPaidEmails } from "@/lib/email/order-emails";

// Flutterwave webhook. The signature proves the sender; the API verification
// proves the payment. The body itself is never trusted for money or status.
export async function POST(request: Request) {
  const secret = process.env.FLW_SECRET_HASH;
  if (!secret) {
    // Refuse rather than accept unsigned "successful payment" requests.
    console.error("[webhook] FLW_SECRET_HASH is not configured.");
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("verif-hash");
  if (!isValidWebhookSignature(signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const event = payload as {
    event?: unknown;
    data?: { id?: unknown; tx_ref?: unknown; status?: unknown };
  };

  // Only completed charges matter. Everything else is acknowledged so
  // Flutterwave stops retrying it.
  if (event.event !== "charge.completed" || event.data?.status !== "successful") {
    return NextResponse.json({ status: "ignored" });
  }

  const txRef = typeof event.data.tx_ref === "string" ? event.data.tx_ref : null;
  const transactionId =
    typeof event.data.id === "number" || typeof event.data.id === "string"
      ? String(event.data.id)
      : null;

  if (!txRef || !transactionId) {
    return NextResponse.json({ status: "ignored" });
  }

  try {
    const payment = await getPaymentByTxRef(txRef);
    if (!payment) {
      // A different Flutterwave account or a test event. Nothing to update.
      return NextResponse.json({ status: "ignored" });
    }
    if (payment.paymentStatus === "successful") {
      return NextResponse.json({ status: "already processed" });
    }

    const verification = await verifyPayment(transactionId, txRef, payment.totalKobo);
    if (!verification.ok || !verification.transactionId) {
      // A real provider event that does not match our order. Acknowledge it,
      // flag nothing as paid, and keep the reason out of the response.
      console.warn(`[webhook] Verification rejected for ${payment.orderNumber}: ${verification.reason ?? "unknown"}`);
      return NextResponse.json({ status: "rejected" });
    }

    const firstTime = await markOrderPaid(txRef, verification.transactionId);
    if (firstTime) {
      const origin = (
        process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin
      ).replace(/\/+$/, "");
      try {
        await sendOrderPaidEmails(payment.orderId, origin);
      } catch {
        console.error(`[webhook] Emails failed for ${payment.orderNumber}.`);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    if (error instanceof CheckoutError) {
      // Transient database problem: ask Flutterwave to retry.
      return NextResponse.json({ error: "Try again." }, { status: 500 });
    }
    console.error("[webhook] Unexpected failure.");
    return NextResponse.json({ error: "Try again." }, { status: 500 });
  }
}
