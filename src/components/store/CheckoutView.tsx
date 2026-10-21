"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Lock, ShoppingBag, Truck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { cartSubtotal } from "@/lib/cart-storage";
import { useCart } from "@/lib/use-cart";
import { formatNaira } from "@/lib/money";
import type { ShippingConfig } from "@/lib/data/shipping";

export function CheckoutView({
  shipping,
  paymentEnabled,
  whatsappNumber,
}: {
  shipping: ShippingConfig;
  paymentEnabled: boolean;
  whatsappNumber: string | null;
}) {
  const { lines, mounted } = useCart();
  const [state, setState] = useState("");

  const subtotal = cartSubtotal(lines);
  const shippingFee = useMemo(() => {
    if (!state) return 0;
    return shipping.rates[state] ?? shipping.defaultFeeKobo;
  }, [state, shipping]);
  const total = subtotal + shippingFee;

  if (!mounted) {
    return (
      <div className="rounded-xl border border-border bg-charcoal px-6 py-16 text-center text-sm text-muted">
        Loading checkout…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-charcoal px-6 py-16 text-center">
        <ShoppingBag className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
        <h2 className="mt-4 font-montserrat text-lg font-semibold text-offwhite">
          Nothing to check out yet
        </h2>
        <p className="mt-2 text-sm text-muted">Add a piece to your bag first.</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#121212] px-6 text-sm font-semibold text-white"
        >
          Shop the collection
        </Link>
      </div>
    );
  }

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
    : null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start"
    >
      <div className="space-y-8">
        <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
          <h2 className="font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
            Contact
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              name="customer_name"
              autoComplete="name"
              placeholder="Your full name"
              required
            />
            <Input
              label="Email"
              name="customer_email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              hint="Your receipt and order updates go here."
              required
            />
            <Input
              label="Phone"
              name="customer_phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0801 234 5678"
              required
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
          <h2 className="font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
            Delivery
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Delivery address"
                name="shipping_address"
                autoComplete="street-address"
                placeholder="Street, building, landmark"
                required
              />
            </div>
            <Input
              label="City"
              name="shipping_city"
              autoComplete="address-level2"
              placeholder="City"
              required
            />
            <Select
              label="State"
              name="shipping_state"
              value={state}
              onChange={(event) => setState(event.target.value)}
              required
            >
              <option value="">Select a state</option>
              {NIGERIAN_STATES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <div className="sm:col-span-2">
              <Textarea
                label="Delivery note (optional)"
                name="delivery_note"
                rows={3}
                placeholder="Anything the rider should know"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
          <h2 className="font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
            Payment
          </h2>
          <div className="mt-3 flex items-start gap-3 rounded-lg bg-charcoal p-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden="true" />
            <div className="text-sm text-muted">
              <p className="font-medium text-offwhite">Secure online payment</p>
              <p className="mt-1">
                Pay by card, bank transfer or USSD through Flutterwave. Every
                payment is verified on our server before an order is confirmed.
              </p>
            </div>
          </div>

          {!paymentEnabled && (
            <div className="mt-4 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm">
              <p className="font-semibold text-offwhite">Payment setup is in progress</p>
              <p className="mt-1 text-muted">
                Online payment is not switched on yet, so no charge can be made.
                {whatsappHref ? (
                  <>
                    {" "}
                    Need to order now?{" "}
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gold-ink underline"
                    >
                      Message us on WhatsApp
                    </a>
                    .
                  </>
                ) : null}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!paymentEnabled}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold px-6 text-sm font-semibold uppercase tracking-[0.04em] text-on-gold transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
          >
            Pay {formatNaira(total)}
          </button>
        </section>
      </div>

      <aside className="rounded-xl border border-border bg-charcoal p-5 lg:sticky lg:top-44 lg:p-6">
        <h2 className="font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
          Order summary
        </h2>

        <ul className="mt-4 space-y-3 border-b border-border pb-4">
          {lines.map((line) => (
            <li key={`${line.productId}-${line.size}`} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-offwhite">{line.name}</p>
                <p className="text-xs text-muted">
                  Size {line.size} · Qty {line.quantity}
                </p>
              </div>
              <span className="shrink-0 tabular-nums text-offwhite">
                {formatNaira(line.priceKobo * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums text-offwhite">{formatNaira(subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Delivery</dt>
            <dd className="tabular-nums text-offwhite">
              {state ? formatNaira(shippingFee) : "Choose a state"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-4">
          <span className="text-sm font-semibold text-offwhite">Total</span>
          <span className="text-xl font-semibold tabular-nums text-offwhite">
            {formatNaira(total)}
          </span>
        </div>

        <button
          type="submit"
          disabled={!paymentEnabled}
          className="mt-5 hidden h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold text-sm font-semibold uppercase tracking-[0.04em] text-on-gold transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50 lg:inline-flex"
        >
          Pay with Flutterwave
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>

        <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          The delivery fee is set by state. You will see the final amount before
          paying.
        </p>

        <Link
          href="/cart"
          className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center text-xs font-medium text-muted transition-colors hover:text-offwhite"
        >
          Back to bag
        </Link>
      </aside>
    </form>
  );
}
