import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Package, UserRound } from "lucide-react";
import { ProfileForm } from "@/components/store/ProfileForm";
import { AddressForm } from "@/components/store/AddressForm";
import {
  getCustomerSession,
  listAddresses,
  listOrdersForEmail,
} from "@/lib/data/customers";
import { formatNaira } from "@/lib/money";
import {
  deleteAddressAction,
  setDefaultAddressAction,
  signOutAction,
} from "@/app/(store)/account/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
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

function dateText(value: string): string {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

export default async function AccountPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login?next=/account");

  if (!session.customer) {
    return (
      <div className="container-page py-12 md:py-16">
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-6 md:p-8">
          <UserRound className="h-8 w-8 text-gold-ink" aria-hidden="true" />
          <h1 className="mt-4 font-oswald text-[28px] font-semibold uppercase tracking-[0.02em] text-offwhite">
            Accounts are being set up
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            You are signed in, but your account details could not be loaded yet.
            You can still shop and check out as a guest. Please try again later.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#121212] px-6 text-sm font-semibold text-white"
            >
              Continue shopping
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border-strong bg-surface px-6 text-sm font-semibold text-offwhite transition-colors hover:border-offwhite"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const customer = session.customer;
  const [addresses, orders] = await Promise.all([
    listAddresses(customer.id),
    session.emailConfirmed
      ? listOrdersForEmail(customer.email, customer.id)
      : Promise.resolve([] as Awaited<ReturnType<typeof listOrdersForEmail>>),
  ]);

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">
            Your account
          </p>
          <h1 className="mt-2 font-oswald text-[30px] font-semibold uppercase tracking-[0.02em] text-offwhite md:text-[38px]">
            {customer.fullName || "Hello"}
          </h1>
          <p className="mt-1 text-sm text-muted">{customer.email}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border-strong bg-surface px-5 text-sm font-semibold text-offwhite transition-colors hover:border-offwhite"
          >
            Sign out
          </button>
        </form>
      </div>

      {!session.emailConfirmed ? (
        <p className="mt-6 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-muted">
          Confirm your email address to see your order history. Check your inbox
          for the link we sent when you created the account.
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
            <h2 className="flex items-center gap-2 font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Your details
            </h2>
            <ProfileForm fullName={customer.fullName} phone={customer.phone} />
          </section>

          <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Saved addresses
              </h2>
              <span className="text-xs text-muted">{addresses.length} of 5</span>
            </div>

            {addresses.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No saved addresses yet. Add one to fill checkout faster.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {addresses.map((address) => (
                  <li
                    key={address.id}
                    className="rounded-lg border border-border bg-charcoal p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-offwhite">
                          {address.label || address.recipientName}
                          {address.isDefault ? (
                            <span className="ml-2 rounded border border-gold/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-gold-ink">
                              Default
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-sm text-muted">{address.recipientName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {!address.isDefault ? (
                          <form action={setDefaultAddressAction}>
                            <input type="hidden" name="addressId" value={address.id} />
                            <button
                              type="submit"
                              className="min-h-[36px] text-xs font-medium text-muted underline-offset-2 hover:text-offwhite hover:underline"
                            >
                              Make default
                            </button>
                          </form>
                        ) : null}
                        <form action={deleteAddressAction}>
                          <input type="hidden" name="addressId" value={address.id} />
                          <button
                            type="submit"
                            className="min-h-[36px] text-xs font-medium text-error underline-offset-2 hover:underline"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    </div>
                    <address className="mt-2 text-sm not-italic leading-relaxed text-muted">
                      {address.address}
                      <br />
                      {address.city}, {address.state}
                      <br />
                      {address.phone}
                    </address>
                  </li>
                ))}
              </ul>
            )}

            {addresses.length < 5 ? (
              <details className="mt-4 rounded-lg border border-border bg-charcoal">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-offwhite">
                  Add a saved address
                </summary>
                <div className="border-t border-border px-4 pb-4">
                  <AddressForm />
                </div>
              </details>
            ) : null}
          </section>
        </div>

        <aside className="rounded-xl border border-border bg-surface p-5 md:p-6">
          <h2 className="flex items-center gap-2 font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
            <Package className="h-4 w-4" aria-hidden="true" />
            Your orders
          </h2>

          {orders.length === 0 ? (
            <div className="mt-4">
              <p className="text-sm text-muted">
                No orders yet on this email.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#121212] px-6 text-sm font-semibold text-white"
              >
                Shop the collection
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {orders.map((order) => (
                <li key={order.orderNumber} className="py-3">
                  <Link
                    href={`/order/${encodeURIComponent(order.orderNumber)}`}
                    className="group block"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-offwhite group-hover:underline">
                        {order.orderNumber}
                      </span>
                      <span className="text-sm tabular-nums text-offwhite">
                        {formatNaira(order.totalKobo)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted">
                      <span>{STATUS_LABELS[order.status] ?? order.status}</span>
                      <span>{dateText(order.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {order.itemCount} {order.itemCount === 1 ? "item" : "items"} ·{" "}
                      <span className="text-gold-ink">View order</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
