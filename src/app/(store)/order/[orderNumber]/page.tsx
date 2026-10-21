import type { Metadata } from "next";
import Link from "next/link";
import { Check, MessageCircle, Package, Truck } from "lucide-react";
import { PaymentResult } from "@/components/store/PaymentResult";
import { ClearCartOnMount } from "@/components/store/ClearCartOnMount";
import { getCustomerOrder } from "@/lib/data/checkout";
import { getCustomerSession } from "@/lib/data/customers";
import { getStoreSettings } from "@/lib/data/settings";
import { verifyOrderToken } from "@/lib/order-token";
import { formatNaira } from "@/lib/money";
import { isPaidStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STEPS = [
  { key: "paid", label: "Paid" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function dateText(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orderNumber } = await params;
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : undefined;
  const settings = await getStoreSettings();

  const order = await getCustomerOrder(orderNumber);
  if (!order) {
    return (
      <div className="container-page py-12 md:py-16">
        <PaymentResult
          tone="failed"
          title="We could not find that order"
          message="The order number does not match our records. Check the number in your confirmation email or use the track page."
          primary={{ href: "/track", label: "Find my order" }}
          secondary={{ href: "/shop", label: "Continue shopping" }}
          whatsappNumber={settings.whatsapp_number}
          reference={orderNumber}
        />
      </div>
    );
  }

  // Access is either the private link from /track or payment, or a signed-in
  // customer whose confirmed email is the email on the order. A customer id
  // from the browser is never accepted.
  const tokenIsValid = verifyOrderToken(orderNumber, token);
  let signedInOwner = false;
  if (!tokenIsValid) {
    const session = await getCustomerSession();
    signedInOwner = Boolean(
      session?.emailConfirmed &&
        session.customer &&
        session.customer.email.toLowerCase() === order.customerEmail.toLowerCase()
    );
  }

  if (!tokenIsValid && !signedInOwner) {
    return (
      <div className="container-page py-12 md:py-16">
        <PaymentResult
          tone="failed"
          title="That order link is not valid"
          message="Order links are private. Sign in with the email used for the order, or find it with your order number and email."
          primary={{ href: "/account/login?next=/account", label: "Sign in" }}
          secondary={{ href: "/track", label: "Find my order" }}
          whatsappNumber={settings.whatsapp_number}
        />
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const currentStep = STEPS.findIndex((step) => step.key === order.status);
  const paid = isPaidStatus(order.status as OrderStatus);
  const whatsappHref = settings.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hello Creamice, I need help with order ${order.orderNumber}.`
      )}`
    : null;

  return (
    <div className="container-page py-8 md:py-12">
      {query.paid === "1" && paid ? <ClearCartOnMount /> : null}

      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-offwhite">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/track" className="transition-colors hover:text-offwhite">
          Track order
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-offwhite">{order.orderNumber}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">
            Order {order.orderNumber}
          </p>
          <h1 className="mt-2 font-oswald text-[30px] font-semibold uppercase tracking-[0.02em] text-offwhite md:text-[38px]">
            Order details
          </h1>
          <p className="mt-1 text-sm text-muted">Placed {dateText(order.createdAt)}</p>
        </div>
        <span className="inline-flex items-center rounded-md border border-border bg-charcoal px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-offwhite">
          {statusLabel}
        </span>
      </div>

      {order.status === "cancelled" ? (
        <div className="mt-6 rounded-xl border border-error/30 bg-error/5 p-5">
          <p className="font-semibold text-offwhite">This order was cancelled</p>
          <p className="mt-1 text-sm text-muted">
            If you were charged, contact us with the order number and we will check
            the payment before anything else.
          </p>
        </div>
      ) : (
        <section aria-label="Order progress" className="mt-7 rounded-xl border border-border bg-surface p-5 md:p-6">
          <ol className="grid grid-cols-5 gap-1">
            {STEPS.map((step, index) => {
              const done = index <= currentStep;
              return (
                <li key={step.key} className="flex flex-col items-center text-center">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                      done
                        ? "border-gold bg-gold text-on-gold"
                        : "border-border-strong bg-charcoal text-muted"
                    }`}
                  >
                    {done ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <span className="text-[11px] font-semibold">{index + 1}</span>
                    )}
                  </span>
                  <span
                    className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.06em] sm:text-xs ${
                      done ? "text-offwhite" : "text-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
            {order.status === "pending_payment"
              ? "This order is waiting for payment. If you have just paid, reload this page in a moment."
              : order.status === "paid"
                ? "Payment received. We will update this page as your order moves."
                : "This page always shows the latest status we have."}
          </p>
          {order.status === "pending_payment" ? (
            <Link
              href="/checkout"
              className="mt-3 inline-flex h-11 items-center justify-center rounded-lg bg-[#121212] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2a2a2a]"
            >
              Complete payment
            </Link>
          ) : null}
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <section className="rounded-xl border border-border bg-surface">
          <h2 className="border-b border-border px-5 py-4 font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite md:px-6">
            Items
          </h2>
          <ul className="divide-y divide-border">
            {order.items.map((item, index) => (
              <li key={`${item.productName}-${item.size}-${index}`} className="flex items-start justify-between gap-4 px-5 py-4 md:px-6">
                <div className="min-w-0">
                  <p className="font-medium text-offwhite">{item.productName}</p>
                  <p className="mt-1 text-xs text-muted">
                    Size {item.size}
                    {item.color ? ` · ${item.color}` : ""} · Qty {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-offwhite">
                  {formatNaira(item.unitPriceKobo * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-charcoal p-5">
            <h2 className="font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
              Summary
            </h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums text-offwhite">{formatNaira(order.subtotalKobo)}</dd>
              </div>
              {order.discountKobo > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Discount</dt>
                  <dd className="tabular-nums text-success">-{formatNaira(order.discountKobo)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Delivery</dt>
                <dd className="tabular-nums text-offwhite">{formatNaira(order.shippingKobo)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                <dt className="font-semibold text-offwhite">Total</dt>
                <dd className="text-lg font-semibold tabular-nums text-offwhite">
                  {formatNaira(order.totalKobo)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
              <Truck className="h-4 w-4" aria-hidden="true" />
              Delivery
            </h2>
            <address className="mt-3 space-y-0.5 text-sm not-italic text-muted">
              <p className="font-medium text-offwhite">{order.customerName}</p>
              <p>{order.shippingAddress}</p>
              <p>
                {order.shippingCity}, {order.shippingState}
              </p>
              {order.deliveryNote ? (
                <p className="pt-2 text-xs">Note: {order.deliveryNote}</p>
              ) : null}
            </address>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
              <Package className="h-4 w-4" aria-hidden="true" />
              Need help?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Quote order {order.orderNumber} when you contact us.
            </p>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-5 text-sm font-semibold text-offwhite transition-colors hover:border-offwhite"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp about this order
              </a>
            ) : null}
            {settings.support_email ? (
              <a
                href={`mailto:${settings.support_email}?subject=${encodeURIComponent(
                  `Order ${order.orderNumber}`
                )}`}
                className="mt-2 inline-flex min-h-[40px] w-full items-center justify-center text-xs font-medium text-muted transition-colors hover:text-offwhite"
              >
                {settings.support_email}
              </a>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
