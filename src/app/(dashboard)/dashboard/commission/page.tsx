import Link from "next/link";
import { Download } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import {
  getCommissionReport,
  type CommissionReport,
} from "@/lib/data/reports";
import {
  commissionRatePercent,
  monthLabel,
  parseMonthValue,
} from "@/lib/reports";
import { isOrderStatus } from "@/lib/orders";
import { formatNaira } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function paidDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 font-oswald text-[26px] font-semibold leading-none tabular-nums text-offwhite">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-muted">{hint}</p>
    </div>
  );
}

export default async function CommissionPage({ searchParams }: Props) {
  await requireRole(["admin"]);
  const params = await searchParams;
  const rawMonth = typeof params.month === "string" ? params.month : undefined;
  const month = parseMonthValue(rawMonth);

  let report: CommissionReport | null = null;
  let failed = false;
  try {
    report = await getCommissionReport(month);
  } catch {
    failed = true;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Commission"
        description="Successful Flutterwave payments in the selected month, with the builder split saved on each order."
        actions={
          <a
            href={`/api/commission/export?month=${month.value}`}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-5 text-sm font-semibold uppercase tracking-[0.04em] text-on-gold transition-colors hover:bg-gold-hover"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download CSV
          </a>
        }
      />

      <form
        action="/dashboard/commission"
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <div className="w-full sm:w-52">
          <Input
            label="Month"
            type="month"
            name="month"
            defaultValue={month.value}
          />
        </div>
        <Button type="submit" variant="secondary">
          View month
        </Button>
        <Link
          href="/dashboard/commission"
          className="inline-flex h-11 items-center px-2 text-sm text-muted underline-offset-2 hover:text-offwhite hover:underline"
        >
          This month
        </Link>
      </form>

      {failed || !report ? (
        <div
          role="alert"
          className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
        >
          Could not load the commission report. Refresh the page and try again.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Paid orders"
              value={String(report.totals.orders)}
              hint={report.label}
            />
            <SummaryCard
              label="Total collected"
              value={formatNaira(report.totals.totalKobo)}
              hint="Includes delivery"
            />
            <SummaryCard
              label="Product value"
              value={formatNaira(report.totals.productValueKobo)}
              hint="After discount, before delivery"
            />
            <SummaryCard
              label="Builder commission"
              value={formatNaira(report.totals.commissionKobo)}
              hint={`Delivery ${formatNaira(report.totals.deliveryKobo)} excluded`}
            />
          </div>

          <p className="max-w-[80ch] text-xs leading-relaxed text-muted">
            Commission uses the rate saved with each payment, so changing the
            rate today does not rewrite past orders. Only successful payments
            are counted. A cancelled or refunded order stays here until the
            refund is recorded outside the store.
          </p>

          <section className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-montserrat text-sm font-semibold text-offwhite">
                Payments in {monthLabel(month)}
              </h2>
            </div>

            {report.rows.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-muted">
                  No successful payments in this month. Paid orders appear here
                  after Flutterwave verification.
                </p>
                <Link href="/dashboard/orders" className="mt-4 inline-block">
                  <Button variant="outline">Open orders</Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {report.rows.map((row) => (
                  <li
                    key={row.orderId}
                    className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:px-5"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/orders/${row.orderId}`}
                        className="font-oswald text-lg font-medium uppercase tracking-[0.02em] text-offwhite transition-colors hover:text-gold"
                      >
                        {row.orderNumber}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm text-muted">
                          {row.customerName}
                        </span>
                        {isOrderStatus(row.orderStatus) ? (
                          <OrderStatusBadge status={row.orderStatus} />
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] text-muted">
                        {row.builderSubaccountId ?? "No subaccount split"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted">Paid</p>
                      <p className="mt-0.5 text-sm text-offwhite">
                        {paidDate(row.paidAt)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:text-right">
                      <div>
                        <p className="text-xs text-muted">Product value</p>
                        <p className="mt-0.5 font-oswald text-base text-offwhite">
                          {formatNaira(row.productValueKobo)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">
                          Commission ({commissionRatePercent(row.commissionRate)}
                          %)
                        </p>
                        <p className="mt-0.5 font-oswald text-base text-gold">
                          {formatNaira(row.commissionKobo)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
