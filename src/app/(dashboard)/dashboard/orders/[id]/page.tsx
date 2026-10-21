import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getAdminOrder } from "@/lib/data/orders";
import type { AdminOrderDetail, AdminOrderItem } from "@/lib/data/orders";
import { getPartnerOrder } from "@/lib/data/partner-orders";
import {
  getNextStatusesForRole,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/orders";
import { formatNaira } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { OrderActionButton } from "@/components/dashboard/OrderActionButton";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function dateText(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function actionLabel(status: OrderStatus): string {
  switch (status) {
    case "confirmed":
      return "Approve order";
    case "processing":
      return "Start processing";
    case "shipped":
      return "Mark shipped";
    case "delivered":
      return "Mark delivered";
    case "cancelled":
      return "Cancel order";
    default:
      return ORDER_STATUS_LABELS[status];
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  "bad-request": "That order action was not valid.",
  transition: "That status change is not allowed from here. Reload and try again.",
  conflict: "Another person changed this order first. Reload and check its status.",
  "payment-only": "A paid status only comes from verified payment.",
  db: "Could not update the order. Try again.",
};

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const user = await requireRole(["admin", "partner"]);
  const { id } = await params;
  const query = await searchParams;
  const isAdmin = user.role === "admin";

  const order = isAdmin ? await getAdminOrder(id) : await getPartnerOrder(id);
  if (!order) notFound();

  // The role decided which query ran, so this cast is safe and keeps the
  // partner branch free of any payment fields.
  const adminOrder = isAdmin ? (order as AdminOrderDetail) : null;
  const nextStatuses = getNextStatusesForRole(order.status, user.role).filter(
    (status) => status !== "paid"
  );
  const ok = typeof query.ok === "string" ? query.ok : "";
  const error = typeof query.error === "string" ? query.error : "";

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-offwhite"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All orders
      </Link>

      <PageHeader
        eyebrow={isAdmin ? "Admin order" : "Partner order"}
        title={order.orderNumber}
        description={`${dateText(order.createdAt)} · ${order.itemCount} ${
          order.itemCount === 1 ? "item" : "items"
        }`}
        actions={<OrderStatusBadge status={order.status} />}
      />

      {ok === "updated" ? (
        <p
          role="status"
          className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
        >
          Order updated and added to the history.
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
        >
          {ERROR_MESSAGES[error] ?? "Could not complete that action. Try again."}
        </p>
      ) : null}

      {order.needsAttention ? (
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          <p className="font-semibold">This order needs attention.</p>
          {order.attentionNote ? <p className="mt-1">{order.attentionNote}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
            <h2 className="font-montserrat text-sm font-semibold text-offwhite">
              Customer and delivery
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Name</dt>
                <dd className="mt-0.5 text-sm text-offwhite">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd className="mt-0.5 text-sm text-offwhite">
                  <a href={`tel:${order.customerPhone}`} className="hover:text-gold">
                    {order.customerPhone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Email</dt>
                <dd className="mt-0.5 break-all text-sm text-offwhite">
                  <a href={`mailto:${order.customerEmail}`} className="hover:text-gold">
                    {order.customerEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">State</dt>
                <dd className="mt-0.5 text-sm text-offwhite">{order.shippingState}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted">Address</dt>
                <dd className="mt-0.5 text-sm leading-relaxed text-offwhite">
                  {order.shippingAddress}
                  <br />
                  {order.shippingCity}, {order.shippingState}
                </dd>
              </div>
              {order.deliveryNote ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Delivery note</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-offwhite">
                    {order.deliveryNote}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
            <h2 className="font-montserrat text-sm font-semibold text-offwhite">
              Items
            </h2>
            <ul className="mt-4 divide-y divide-border">
              {order.items.map((item, index) => {
                const priced = adminOrder
                  ? (item as AdminOrderItem)
                  : null;
                return (
                  <li
                    key={`${item.productName}-${item.size}-${index}`}
                    className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-offwhite">
                        {item.productName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Size {item.size}
                        {item.color ? ` · ${item.color}` : ""} · Qty {item.quantity}
                      </p>
                    </div>
                    {priced ? (
                      <div className="text-right">
                        <p className="font-oswald text-base text-offwhite">
                          {formatNaira(priced.lineTotalKobo)}
                        </p>
                        <p className="text-xs text-muted">
                          {formatNaira(priced.unitPriceKobo)} each
                        </p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
            <h2 className="font-montserrat text-sm font-semibold text-offwhite">
              History
            </h2>
            {order.events.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No status changes recorded yet.</p>
            ) : (
              <ol className="mt-4 space-y-4">
                {order.events.map((event) => (
                  <li key={event.id} className="border-l border-border-strong pl-4">
                    <p className="text-sm text-offwhite">
                      {event.fromStatus
                        ? `${ORDER_STATUS_LABELS[event.fromStatus]} to `
                        : ""}
                      {ORDER_STATUS_LABELS[event.toStatus]}
                    </p>
                    {event.note ? (
                      <p className="mt-0.5 text-sm text-muted">{event.note}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted">
                      {dateText(event.createdAt)} · {event.actorName ?? "System"}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
            <h2 className="font-montserrat text-sm font-semibold text-offwhite">
              Status actions
            </h2>
            {nextStatuses.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                {order.status === "delivered"
                  ? "This order is delivered. No further status changes."
                  : "This order is closed. No further status changes."}
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                {nextStatuses.map((status) => (
                  <OrderActionButton
                    key={status}
                    orderId={order.id}
                    status={status}
                    label={actionLabel(status)}
                    variant={
                      status === "confirmed"
                        ? "primary"
                        : status === "cancelled"
                          ? "danger"
                          : "outline"
                    }
                    confirmText={
                      status === "cancelled"
                        ? "Cancel this order? This cannot be undone here."
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Every change is written to the order history with your name.
            </p>
          </section>

          {adminOrder ? (
            <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
              <h2 className="font-montserrat text-sm font-semibold text-offwhite">
                Payment
              </h2>
              {adminOrder.payment ? (
                <>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Subtotal</dt>
                      <dd className="text-offwhite">
                        {formatNaira(adminOrder.payment.subtotalKobo)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Discount</dt>
                      <dd className="text-offwhite">
                        {adminOrder.payment.discountKobo > 0
                          ? `-${formatNaira(adminOrder.payment.discountKobo)}`
                          : formatNaira(0)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Delivery</dt>
                      <dd className="text-offwhite">
                        {formatNaira(adminOrder.payment.shippingKobo)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-border pt-2">
                      <dt className="font-semibold text-offwhite">Total</dt>
                      <dd className="font-oswald text-lg text-white">
                        {formatNaira(adminOrder.payment.totalKobo)}
                      </dd>
                    </div>
                  </dl>

                  <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Payment status</dt>
                      <dd className="capitalize text-offwhite">
                        {adminOrder.payment.status}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Builder commission</dt>
                      <dd className="text-offwhite">
                        {formatNaira(adminOrder.payment.commissionKobo)}
                        <span className="ml-1 text-xs text-muted">
                          ({new Intl.NumberFormat("en-NG", {
                            style: "percent",
                            maximumFractionDigits: 2,
                          }).format(adminOrder.payment.commissionRate)}
                          )
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Commission base</dt>
                      <dd className="text-offwhite">
                        {formatNaira(adminOrder.payment.commissionBaseKobo)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Subaccount</dt>
                      <dd className="text-right text-offwhite">
                        {adminOrder.payment.builderSubaccountId ?? "Not split"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Reference</dt>
                      <dd className="break-all text-right text-xs text-offwhite">
                        {adminOrder.payment.txRef}
                      </dd>
                    </div>
                    {adminOrder.payment.flwTransactionId ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Flutterwave ID</dt>
                        <dd className="break-all text-right text-xs text-offwhite">
                          {adminOrder.payment.flwTransactionId}
                        </dd>
                      </div>
                    ) : null}
                    {adminOrder.payment.paidAt ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Paid at</dt>
                        <dd className="text-right text-offwhite">
                          {dateText(adminOrder.payment.paidAt)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {adminOrder.payment.status !== "successful" ? (
                    <p className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs leading-relaxed text-muted">
                      Payment is not verified. A paid status can only come from
                      the Flutterwave return page or webhook.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  No payment record exists for this order. Do not fulfil it.
                </p>
              )}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
