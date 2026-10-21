import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listAdminOrders } from "@/lib/data/orders";
import { listPartnerOrders } from "@/lib/data/partner-orders";
import { isOrderStatus } from "@/lib/orders";
import { formatNaira } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { expireUnpaidOrdersAction } from "./actions";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function dateText(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function OrdersPage({ searchParams }: Props) {
  const user = await requireRole(["admin", "partner"]);
  const params = await searchParams;
  const isAdmin = user.role === "admin";

  const requestedStatus =
    typeof params.status === "string" && isOrderStatus(params.status)
      ? params.status
      : undefined;
  // Unpaid carts are admin-only, so a partner URL asking for that status gets
  // the normal partner list instead of a confusing empty filter.
  const status =
    !isAdmin && requestedStatus === "pending_payment"
      ? undefined
      : requestedStatus;
  const q = one(params.q).slice(0, 60);
  const attention = isAdmin && one(params.attention) === "1";

  const [result, attentionResult] = isAdmin
    ? await Promise.all([
        listAdminOrders({ status, q, attention }),
        q || status ? Promise.resolve(null) : listAdminOrders({ attention: true }),
      ])
    : [await listPartnerOrders({ status, q, attention }), null];

  const ok = one(params.ok);
  const error = one(params.error);
  const expiredCount = Number(one(params.count)) || 0;

  const errorMessages: Record<string, string> = {
    "bad-request": "That order action was not valid.",
    "not-found": "That order could not be found.",
    transition: "That status change is not allowed from here. Reload and try again.",
    conflict: "Another person changed this order first. Reload and check its status.",
    "payment-only": "A paid status only comes from verified payment.",
    db: "Could not update the order. Try again.",
    expire: "Could not expire unpaid orders. Try again.",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isAdmin ? "Admin" : "Partner"}
        title="Orders"
        description={
          isAdmin
            ? "Payment, fulfilment and delivery in one place. Money is visible only to admins."
            : "Paid orders waiting to be confirmed and fulfilled. Customer contact details are here; prices and totals are not."
        }
        actions={
          isAdmin ? (
            <form action={expireUnpaidOrdersAction}>
              <Button type="submit" variant="outline">
                Expire unpaid
              </Button>
            </form>
          ) : null
        }
      />

      {ok === "updated" ? (
        <p
          role="status"
          className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
        >
          Order updated.
        </p>
      ) : null}
      {ok === "expired" ? (
        <p
          role="status"
          className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
        >
          {expiredCount > 0
            ? `${expiredCount} unpaid ${expiredCount === 1 ? "order" : "orders"} cancelled.`
            : "No unpaid orders were older than 24 hours."}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
        >
          {errorMessages[error] ?? "Could not complete that action. Try again."}
        </p>
      ) : null}

      {isAdmin && attentionResult && attentionResult.total > 0 ? (
        <Link
          href="/dashboard/orders?attention=1"
          className="flex items-center justify-between gap-3 rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error transition-colors hover:border-error"
        >
          <span>
            {attentionResult.total}{" "}
            {attentionResult.total === 1 ? "order needs" : "orders need"} attention.
          </span>
          <span className="font-semibold">Review</span>
        </Link>
      ) : null}

      <form
        action="/dashboard/orders"
        method="get"
        className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_200px_auto_auto] sm:items-end"
      >
        <Input
          label="Search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Order number, name or email"
        />
        <Select label="Status" name="status" defaultValue={status ?? ""}>
          <option value="">All statuses</option>
          {isAdmin ? (
            <option value="pending_payment">Awaiting payment</option>
          ) : null}
          <option value="paid">Paid</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        {isAdmin ? (
          <label className="flex min-h-[44px] items-center gap-2 text-sm text-offwhite">
            <input
              type="checkbox"
              name="attention"
              value="1"
              defaultChecked={attention}
              className="h-4 w-4 rounded border-border-strong accent-[#c6a15b]"
            />
            Needs attention
          </label>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          <Link
            href="/dashboard/orders"
            className="inline-flex h-11 items-center px-2 text-sm text-muted underline-offset-2 hover:text-offwhite hover:underline"
          >
            Clear
          </Link>
        </div>
      </form>

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted">
          {result.total === 0
            ? "No orders"
            : `${result.total} ${result.total === 1 ? "order" : "orders"}`}
          {result.total > result.orders.length
            ? ` · showing latest ${result.orders.length}`
            : ""}
        </p>
      </div>

      {result.orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center md:p-12">
          <p className="text-sm text-muted">
            No orders match these filters. New paid orders appear here
            automatically.
          </p>
          <Link href="/dashboard/orders" className="mt-4 inline-block">
            <Button variant="outline">Clear filters</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {result.orders.map((order) => (
            <li
              key={order.id}
              className="rounded-xl border border-border bg-surface p-4 md:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="font-oswald text-lg font-medium uppercase tracking-[0.02em] text-offwhite transition-colors hover:text-gold"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="mt-1 text-sm text-offwhite">{order.customerName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {order.needsAttention ? (
                    <span className="rounded-md border border-error/40 bg-error/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-error">
                      Needs attention
                    </span>
                  ) : null}
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted">Placed</dt>
                  <dd className="mt-0.5 text-offwhite">{dateText(order.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Items</dt>
                  <dd className="mt-0.5 text-offwhite">{order.itemCount}</dd>
                </div>
                {"totalKobo" in order ? (
                  <>
                    <div>
                      <dt className="text-xs text-muted">Total</dt>
                      <dd className="mt-0.5 font-oswald text-base text-offwhite">
                        {formatNaira(order.totalKobo)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Payment</dt>
                      <dd className="mt-0.5 capitalize text-offwhite">
                        {order.paymentStatus === "missing"
                          ? "No record"
                          : order.paymentStatus}
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
