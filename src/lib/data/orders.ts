import { createAdminClient } from "@/lib/supabase/admin";
import type {
  OrderEventView,
  OrderListFilters,
  PartnerOrderDetail,
  PartnerOrderItem,
  PartnerOrderSummary,
} from "@/lib/data/partner-orders";
import {
  cleanSearch,
  firstRelation,
  mapOrderEvents,
  mapPartnerSummary,
  statusFilter,
} from "@/lib/data/partner-orders";

// Admin order reads. Unlike the partner module, these queries include the
// payment, the commission snapshot and item prices.

export interface AdminOrderSummary extends PartnerOrderSummary {
  totalKobo: number;
  paymentStatus: string;
}

export interface AdminOrderItem extends PartnerOrderItem {
  unitPriceKobo: number;
  lineTotalKobo: number;
}

export interface AdminPaymentView {
  status: string;
  txRef: string;
  flwTransactionId: string | null;
  subtotalKobo: number;
  discountKobo: number;
  shippingKobo: number;
  totalKobo: number;
  commissionRate: number;
  commissionBaseKobo: number;
  commissionKobo: number;
  builderSubaccountId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminOrderDetail extends PartnerOrderDetail {
  items: AdminOrderItem[];
  events: OrderEventView[];
  payment: AdminPaymentView | null;
}

const ADMIN_ORDER_COLUMNS =
  "id, order_number, status, customer_name, created_at, needs_attention, order_items (quantity), payment:order_payments (total_kobo, status)";

const ADMIN_ORDER_DETAIL_COLUMNS =
  "id, order_number, status, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_state, delivery_note, needs_attention, attention_note, created_at, order_items (product_name, size, color, quantity, unit_price_kobo), payment:order_payments (status, tx_ref, flw_transaction_id, subtotal_kobo, discount_kobo, shipping_kobo, total_kobo, commission_rate, commission_base_kobo, commission_kobo, builder_subaccount_id, paid_at, created_at), order_events (id, from_status, to_status, note, created_at, actor:profiles (full_name))";

interface RawPayment {
  status: string;
  tx_ref: string;
  flw_transaction_id: string | null;
  subtotal_kobo: number;
  discount_kobo: number;
  shipping_kobo: number;
  total_kobo: number;
  commission_rate: number;
  commission_base_kobo: number;
  commission_kobo: number;
  builder_subaccount_id: string | null;
  paid_at: string | null;
  created_at: string;
}

function mapAdminItems(items: unknown): AdminOrderItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const item = raw as {
      product_name: string;
      size: string;
      color: string | null;
      quantity: number;
      unit_price_kobo?: number;
    };
    const unitPriceKobo = item.unit_price_kobo ?? 0;
    return {
      productName: item.product_name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPriceKobo,
      lineTotalKobo: unitPriceKobo * item.quantity,
    };
  });
}

function mapPayment(raw: RawPayment | null): AdminPaymentView | null {
  if (!raw) return null;
  return {
    status: raw.status,
    txRef: raw.tx_ref,
    flwTransactionId: raw.flw_transaction_id,
    subtotalKobo: raw.subtotal_kobo,
    discountKobo: raw.discount_kobo,
    shippingKobo: raw.shipping_kobo,
    totalKobo: raw.total_kobo,
    commissionRate: Number(raw.commission_rate),
    commissionBaseKobo: raw.commission_base_kobo,
    commissionKobo: raw.commission_kobo,
    builderSubaccountId: raw.builder_subaccount_id,
    paidAt: raw.paid_at,
    createdAt: raw.created_at,
  };
}

export async function listAdminOrders(
  filters: OrderListFilters = {}
): Promise<{ orders: AdminOrderSummary[]; total: number }> {
  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select(ADMIN_ORDER_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50);

  const status = statusFilter(filters);
  if (status) query = query.eq("status", status);
  if (filters.attention) query = query.eq("needs_attention", true);

  const search = cleanSearch(filters.q);
  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error || !data) return { orders: [], total: 0 };

  return {
    orders: data.map((value) => {
      const row = value as unknown as Parameters<typeof mapPartnerSummary>[0] & {
        payment: RawPayment | RawPayment[] | null;
      };
      const payment = firstRelation(row.payment);
      return {
        ...mapPartnerSummary(row),
        totalKobo: payment?.total_kobo ?? 0,
        paymentStatus: payment?.status ?? "missing",
      };
    }),
    total: count ?? data.length,
  };
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(ADMIN_ORDER_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as Parameters<typeof mapPartnerSummary>[0] & {
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    delivery_note: string | null;
    attention_note: string | null;
    order_items: unknown;
    order_events: unknown;
    payment: RawPayment | RawPayment[] | null;
  };

  return {
    ...mapPartnerSummary(row),
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    shippingCity: row.shipping_city,
    shippingState: row.shipping_state,
    deliveryNote: row.delivery_note,
    attentionNote: row.attention_note,
    items: mapAdminItems(row.order_items),
    events: mapOrderEvents(row.order_events),
    payment: mapPayment(firstRelation(row.payment)),
  };
}
