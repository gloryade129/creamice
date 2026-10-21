"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Check, Lock, ShoppingBag, Truck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { cartSubtotal } from "@/lib/cart-storage";
import { useCart } from "@/lib/use-cart";
import { formatNaira } from "@/lib/money";
import type { ShippingConfig } from "@/lib/data/shipping";
import type { CheckoutPrefill, CheckoutQuote } from "@/lib/checkout-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface FormState {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  deliveryNote: string;
}

function initialForm(prefill: CheckoutPrefill | null): FormState {
  const address =
    prefill?.addresses.find((item) => item.isDefault) ?? prefill?.addresses[0];
  return {
    customerName: prefill?.name ?? "",
    customerEmail: prefill?.email ?? "",
    customerPhone: prefill?.phone ?? "",
    shippingAddress: address?.address ?? "",
    shippingCity: address?.city ?? "",
    deliveryNote: "",
  };
}

function initialState(prefill: CheckoutPrefill | null): string {
  const address =
    prefill?.addresses.find((item) => item.isDefault) ?? prefill?.addresses[0];
  return address?.state ?? "";
}

export function CheckoutView({
  shipping,
  paymentEnabled,
  whatsappNumber,
  prefill,
}: {
  shipping: ShippingConfig;
  paymentEnabled: boolean;
  whatsappNumber: string | null;
  prefill: CheckoutPrefill | null;
}) {
  const { lines, mounted } = useCart();
  const [form, setForm] = useState<FormState>(() => initialForm(prefill));
  const [state, setState] = useState(() => initialState(prefill));
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const address =
      prefill?.addresses.find((item) => item.isDefault) ?? prefill?.addresses[0];
    return address?.id ?? "";
  });
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const items = useMemo(
    () => lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
    [lines]
  );
  const subtotal = cartSubtotal(lines);
  const previewCart = lines.some((line) => !UUID.test(line.variantId));

  // The server is the only source of prices, stock, discount and delivery.
  // Quote again whenever the bag, the state or an applied code changes.
  useEffect(() => {
    if (!mounted || items.length === 0) return;

    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setQuoteLoading(true);
      fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          ...(state ? { state } : {}),
          ...(appliedCode ? { discountCode: appliedCode } : {}),
        }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const data = (await response.json()) as {
            quote?: CheckoutQuote;
            error?: string;
          };
          if (!response.ok || !data.quote) {
            throw new Error(data.error || "Could not check your bag.");
          }
          return data.quote;
        })
        .then((next) => {
          if (cancelled) return;
          setQuote(next);
          setQuoteError(null);
        })
        .catch((error: unknown) => {
          if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
            return;
          }
          setQuoteError(
            error instanceof Error ? error.message : "Could not check your bag."
          );
        })
        .finally(() => {
          if (!cancelled) setQuoteLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [mounted, items, state, appliedCode]);

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

  const issues = quote?.issues ?? [];
  const displaySubtotal = quote?.subtotalKobo ?? subtotal;
  const displayDiscount = quote?.discountKobo ?? 0;
  const displayShipping = state
    ? (quote?.shippingKobo ?? shipping.rates[state] ?? shipping.defaultFeeKobo)
    : 0;
  const displayTotal = quote?.totalKobo ?? displaySubtotal - displayDiscount + displayShipping;
  const canPay =
    paymentEnabled &&
    !previewCart &&
    !submitting &&
    !quoteLoading &&
    Boolean(quote) &&
    issues.length === 0;

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
    : null;

  const update =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (key === "shippingAddress" || key === "shippingCity") {
        setSelectedAddressId("");
      }
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  function chooseAddress(addressId: string) {
    setSelectedAddressId(addressId);
    const address = prefill?.addresses.find((item) => item.id === addressId);
    if (!address) return;
    setForm((current) => ({
      ...current,
      shippingAddress: address.address,
      shippingCity: address.city,
    }));
    setState(address.state);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    if (previewCart) {
      setSubmitError(
        "These are preview products, so they cannot be paid for. Replace them with real products to check out."
      );
      return;
    }
    if (!canPay) {
      setSubmitError("Check the items and delivery details before paying.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items,
          shippingState: state,
          ...(appliedCode ? { discountCode: appliedCode } : {}),
        }),
      });
      const data = (await response.json()) as {
        link?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
        issues?: string[];
      };

      if (!response.ok || !data.link) {
        setSubmitError(data.error || "Could not start your order. Please try again.");
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setSubmitting(false);
        return;
      }

      // Keep the bag until the payment is verified. The order page clears it
      // only when the shopper returns from a successful payment.
      window.location.assign(data.link);
    } catch {
      setSubmitError("Could not reach the store. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="space-y-8">
        <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
          <h2 className="font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
            Contact
          </h2>
          {prefill ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-charcoal px-4 py-3 text-xs text-muted">
              <span>
                Signed in as <span className="text-offwhite">{prefill.email}</span>
              </span>
              <Link
                href="/account"
                className="font-semibold text-gold-ink underline-offset-2 hover:underline"
              >
                Manage account
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">
              Have an account?{" "}
              <Link
                href="/account/login?next=/checkout"
                className="font-semibold text-gold-ink underline-offset-2 hover:underline"
              >
                Sign in
              </Link>{" "}
              to fill your details and use saved addresses.
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              name="customer_name"
              autoComplete="name"
              placeholder="Your full name"
              value={form.customerName}
              onChange={update("customerName")}
              error={fieldErrors.customerName}
              required
            />
            <Input
              label="Email"
              name="customer_email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              hint="Your receipt and order updates go here."
              value={form.customerEmail}
              onChange={update("customerEmail")}
              error={fieldErrors.customerEmail}
              required
            />
            <Input
              label="Phone"
              name="customer_phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0801 234 5678"
              value={form.customerPhone}
              onChange={update("customerPhone")}
              error={fieldErrors.customerPhone}
              required
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
          <h2 className="font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
            Delivery
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {prefill && prefill.addresses.length > 0 ? (
              <div className="sm:col-span-2">
                <Select
                  label="Saved address"
                  name="saved_address"
                  value={selectedAddressId}
                  onChange={(event) => chooseAddress(event.target.value)}
                >
                  <option value="">Enter a new address</option>
                  {prefill.addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label || address.recipientName} — {address.address},{" "}
                      {address.city}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-xs text-muted">
                  Picking a saved address fills the fields below. You can still
                  edit them for this order.
                </p>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <Input
                label="Delivery address"
                name="shipping_address"
                autoComplete="street-address"
                placeholder="Street, building, landmark"
                value={form.shippingAddress}
                onChange={update("shippingAddress")}
                error={fieldErrors.shippingAddress}
                required
              />
            </div>
            <Input
              label="City"
              name="shipping_city"
              autoComplete="address-level2"
              placeholder="City"
              value={form.shippingCity}
              onChange={update("shippingCity")}
              error={fieldErrors.shippingCity}
              required
            />
            <Select
              label="State"
              name="shipping_state"
              value={state}
              onChange={(event) => {
                setState(event.target.value);
                setSelectedAddressId("");
              }}
              error={fieldErrors.shippingState}
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
                value={form.deliveryNote}
                onChange={update("deliveryNote")}
                error={fieldErrors.deliveryNote}
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

          {previewCart && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden="true" />
              <p className="text-muted">
                <span className="font-semibold text-offwhite">Preview products cannot be paid for.</span>{" "}
                This site is showing a sample catalogue until real products are
                published. Checkout will work on the live products.
              </p>
            </div>
          )}

          {submitError && (
            <p role="alert" className="mt-4 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={!canPay}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold px-6 text-sm font-semibold uppercase tracking-[0.04em] text-on-gold transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
          >
            {submitting ? "Opening payment…" : `Pay ${formatNaira(displayTotal)}`}
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

        <div className="mt-4">
          <label htmlFor="discount-code" className="text-xs font-medium text-muted">
            Discount code (optional)
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="discount-code"
              name="discount_code"
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
              placeholder="CODE"
              autoComplete="off"
              className="h-10 min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm uppercase tracking-[0.08em] text-offwhite placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <button
              type="button"
              onClick={() => setAppliedCode(codeInput.trim().toUpperCase())}
              disabled={!codeInput.trim()}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface px-4 text-xs font-semibold uppercase tracking-[0.06em] text-offwhite transition-colors hover:border-offwhite disabled:cursor-not-allowed disabled:opacity-40"
            >
              {appliedCode && appliedCode === codeInput.trim().toUpperCase() ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                "Apply"
              )}
            </button>
          </div>
          {appliedCode ? (
            <button
              type="button"
              onClick={() => {
                setAppliedCode("");
                setCodeInput("");
              }}
              className="mt-1 min-h-[32px] text-[11px] font-medium text-muted underline-offset-2 hover:text-offwhite hover:underline"
            >
              Remove {appliedCode}
            </button>
          ) : null}
        </div>

        <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums text-offwhite">{formatNaira(displaySubtotal)}</dd>
          </div>
          {displayDiscount > 0 ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Discount</dt>
              <dd className="tabular-nums text-success">-{formatNaira(displayDiscount)}</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Delivery</dt>
            <dd className="text-right tabular-nums text-offwhite">
              {state ? formatNaira(displayShipping) : "Choose a state"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-4">
          <span className="text-sm font-semibold text-offwhite">Total</span>
          <span className="text-xl font-semibold tabular-nums text-offwhite">
            {state || quote ? formatNaira(displayTotal) : "—"}
          </span>
        </div>

        {quoteLoading ? (
          <p className="mt-2 text-[11px] text-muted">Checking prices and stock…</p>
        ) : null}

        {quoteError ? (
          <p role="alert" className="mt-3 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
            {quoteError}
          </p>
        ) : null}

        {issues.length > 0 ? (
          <ul className="mt-3 space-y-1 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-muted">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : null}

        <button
          type="submit"
          disabled={!canPay}
          className="mt-5 hidden h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold text-sm font-semibold uppercase tracking-[0.04em] text-on-gold transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50 lg:inline-flex"
        >
          {submitting ? "Opening payment…" : "Pay with Flutterwave"}
          {!submitting ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
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
