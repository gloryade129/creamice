import { NextResponse } from "next/server";
import { checkoutSchema, fieldErrors } from "@/lib/validation/checkout";
import {
  CheckoutError,
  cancelPendingOrder,
  createPendingOrder,
  quoteCart,
} from "@/lib/data/checkout";
import { getStoreSettings } from "@/lib/data/settings";
import { getCustomerSession } from "@/lib/data/customers";
import { createPayment, isPaymentConfigured } from "@/lib/flutterwave";

// Creates the pending order and the hosted Flutterwave payment. Every amount
// is recalculated here; the request cannot choose a price, a total or a
// commission. The order becomes real only after server verification.
export async function POST(request: Request) {
  if (!isPaymentConfigured()) {
    return NextResponse.json(
      { error: "Online payment is not switched on yet. Please try again later." },
      { status: 503 }
    );
  }

  const requestUrl = new URL(request.url);
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    let origin: string | null = null;
    try {
      origin = new URL(originHeader).origin;
    } catch {
      origin = null;
    }
    if (origin !== requestUrl.origin) {
      return NextResponse.json({ error: "Request refused." }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid request." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Check the highlighted fields and try again.",
        fieldErrors: fieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  try {
    const quote = await quoteCart({
      items: parsed.data.items,
      state: parsed.data.shippingState,
      discountCode: parsed.data.discountCode,
    });

    if (quote.issues.length > 0) {
      return NextResponse.json(
        { error: quote.issues[0], issues: quote.issues },
        { status: 409 }
      );
    }

    const settings = await getStoreSettings();
    // Signed-in customers are linked by their verified session, never by an
    // id sent from the browser. Guests pass no id and still check out.
    const session = await getCustomerSession().catch(() => null);
    const order = await createPendingOrder(parsed.data, quote, session?.customer?.id ?? null);

    const base = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || requestUrl.origin).replace(
      /\/+$/,
      ""
    );

    let paymentLink: string;
    try {
      paymentLink = await createPayment({
        txRef: order.txRef,
        totalKobo: order.totalKobo,
        redirectUrl: `${base}/checkout/return`,
        customer: {
          email: parsed.data.customerEmail,
          name: parsed.data.customerName,
          phone: parsed.data.customerPhone,
        },
        orderNumber: order.orderNumber,
        storeName: settings.store_name,
        commissionKobo: quote.commissionKobo,
        subaccountId: settings.builder_subaccount_id,
      });
    } catch (error) {
      // No payment page exists, so close the pending order. If money somehow
      // arrives later, mark_order_paid flags the cancelled order for review.
      await cancelPendingOrder(
        order.id,
        order.txRef,
        "Payment page could not be created. No charge was made."
      );
      if (error instanceof Error) {
        console.error("[checkout] Could not create payment link.");
      }
      return NextResponse.json(
        { error: "Could not open the payment page. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      link: paymentLink,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[checkout] Unexpected failure.");
    return NextResponse.json(
      { error: "Could not start your order. Please try again." },
      { status: 503 }
    );
  }
}
