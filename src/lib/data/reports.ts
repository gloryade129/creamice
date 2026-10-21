import { createAdminClient } from "@/lib/supabase/admin";
import {
  lagosDayRange,
  lagosMonthRange,
  lagosMonthValue,
  monthLabel,
  parseMonthValue,
  type MonthValue,
} from "@/lib/reports";

export interface CommissionRow {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  customerName: string;
  productValueKobo: number;
  deliveryKobo: number;
  totalKobo: number;
  commissionRate: number;
  commissionKobo: number;
  builderSubaccountId: string | null;
  txRef: string;
  paidAt: string;
}

export interface CommissionReport {
  month: MonthValue;
  label: string;
  rows: CommissionRow[];
  totals: {
    orders: number;
    productValueKobo: number;
    deliveryKobo: number;
    totalKobo: number;
    commissionKobo: number;
  };
}

interface RawReportOrder {
  order_number: string;
  status: string;
  customer_name: string;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// Successful payments only. An order cancelled after payment still appears
// here, because the commission snapshot and the money are real until a refund
// is recorded outside the site.
export async function getCommissionReport(
  month: MonthValue
): Promise<CommissionReport> {
  const { startIso, endIso } = lagosMonthRange(month.year, month.month);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("order_payments")
    .select(
      "order_id, status, shipping_kobo, total_kobo, commission_rate, commission_base_kobo, commission_kobo, builder_subaccount_id, tx_ref, paid_at, order:orders (order_number, status, customer_name)"
    )
    .eq("status", "successful")
    .gte("paid_at", startIso)
    .lt("paid_at", endIso)
    .order("paid_at", { ascending: true });

  if (error) {
    console.error("[reports] Could not load the commission report.");
    throw new Error("Could not load the commission report.");
  }
  if (!data) {
    return {
      month,
      label: monthLabel(month),
      rows: [],
      totals: {
        orders: 0,
        productValueKobo: 0,
        deliveryKobo: 0,
        totalKobo: 0,
        commissionKobo: 0,
      },
    };
  }

  const rows: CommissionRow[] = data
    .map((value) => {
      const payment = value as unknown as {
        order_id: string;
        shipping_kobo: number;
        total_kobo: number;
        commission_rate: number;
        commission_base_kobo: number;
        commission_kobo: number;
        builder_subaccount_id: string | null;
        tx_ref: string;
        paid_at: string;
        order: RawReportOrder | RawReportOrder[] | null;
      };
      const order = firstRelation(payment.order);
      if (!order || !payment.paid_at) return null;

      return {
        orderId: payment.order_id,
        orderNumber: order.order_number,
        orderStatus: order.status,
        customerName: order.customer_name,
        productValueKobo: payment.commission_base_kobo,
        deliveryKobo: payment.shipping_kobo,
        totalKobo: payment.total_kobo,
        commissionRate: Number(payment.commission_rate),
        commissionKobo: payment.commission_kobo,
        builderSubaccountId: payment.builder_subaccount_id,
        txRef: payment.tx_ref,
        paidAt: payment.paid_at,
      };
    })
    .filter((row): row is CommissionRow => row !== null);

  const totals = rows.reduce(
    (sum, row) => ({
      orders: sum.orders + 1,
      productValueKobo: sum.productValueKobo + row.productValueKobo,
      deliveryKobo: sum.deliveryKobo + row.deliveryKobo,
      totalKobo: sum.totalKobo + row.totalKobo,
      commissionKobo: sum.commissionKobo + row.commissionKobo,
    }),
    {
      orders: 0,
      productValueKobo: 0,
      deliveryKobo: 0,
      totalKobo: 0,
      commissionKobo: 0,
    }
  );

  return { month, label: monthLabel(month), rows, totals };
}

export interface AdminDashboardStats {
  ordersToday: number;
  paidThisMonthKobo: number;
  needsAttention: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const admin = createAdminClient();
  const month = parseMonthValue(lagosMonthValue());
  const monthRange = lagosMonthRange(month.year, month.month);
  const dayRange = lagosDayRange();

  const [todayResult, paymentResult, attentionResult] = await Promise.all([
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayRange.startIso)
      .lt("created_at", dayRange.endIso),
    admin
      .from("order_payments")
      .select("total_kobo")
      .eq("status", "successful")
      .gte("paid_at", monthRange.startIso)
      .lt("paid_at", monthRange.endIso),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("needs_attention", true),
  ]);

  const paidThisMonthKobo = (paymentResult.data ?? []).reduce(
    (sum, payment) => sum + (payment.total_kobo ?? 0),
    0
  );

  return {
    ordersToday: todayResult.count ?? 0,
    paidThisMonthKobo,
    needsAttention: attentionResult.count ?? 0,
  };
}
