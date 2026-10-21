import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/orders";
import { ORDER_STATUSES } from "@/lib/orders";

// Partner order reads. This is the only module that may load order data for a
// partner, and its queries never select order_payments or unit_price_kobo. The
// mappers return explicit objects so a raw row cannot reach a page.

export const PARTNER_ORDER_COLUMNS =
  "id, order_number, status, customer_name, created_at, needs_attention, order_items (quantity)";

export const PARTNER_ORDER_DETAIL_COLUMNS =
  "id, order_number, status, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_state, delivery_note, needs_attention, attention_note, created_at, order_items (product_name, size, color, quantity), order_events (id, from_status, to_status, note, created_at, actor:profiles (full_name))";

export interface PartnerOrderItem {
  productName: string;
  size: string;
  color: string | null;
  quantity: number;
}

export interface PartnerOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  itemCount: number;
  createdAt: string;
  needsAttention: boolean;
}

export interface OrderEventView {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  createdAt: string;
  actorName: string | null;
}

export interface PartnerOrderDetail extends PartnerOrderSummary {
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  deliveryNote: string | null;
  attentionNote: string | null;
  items: PartnerOrderItem[];
  events: OrderEventView[];
}

export interface OrderListFilters {
  status?: OrderStatus;
  q?: string;
  attention?: boolean;
}

export function firstRelation<T>(
  value: T | T[] | null | undefined
): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// PostgREST treats commas and brackets as filter syntax. A search box is not
// allowed to break the query; the remaining %/_ characters stay wildcards.
export function cleanSearch(value: string | undefined): string {
  return (value ?? "")
    .replace(/[,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export function itemCount(items: unknown): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total: number, item) => {
    const quantity = (item as { quantity?: unknown }).quantity;
    return total + (typeof quantity === "number" ? quantity : 0);
  }, 0);
}

export function mapPartnerItems(items: unknown): PartnerOrderItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const item = raw as {
      product_name: string;
      size: string;
      color: string | null;
      quantity: number;
    };
    return {
      productName: item.product_name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    };
  });
}

export function mapOrderEvents(raw: unknown): OrderEventView[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((value) => {
      const event = value as {
        id: string;
        from_status: OrderStatus | null;
        to_status: OrderStatus;
        note: string | null;
        created_at: string;
        actor: { full_name: string } | Array<{ full_name: string }> | null;
      };
      return {
        id: event.id,
        fromStatus: event.from_status,
        toStatus: event.to_status,
        note: event.note,
        createdAt: event.created_at,
        actorName: firstRelation(event.actor)?.full_name ?? null,
      };
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function mapPartnerSummary(row: {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  created_at: string;
  needs_attention: boolean;
  order_items: unknown;
}): PartnerOrderSummary {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status as OrderStatus,
    customerName: row.customer_name,
    itemCount: itemCount(row.order_items),
    createdAt: row.created_at,
    needsAttention: row.needs_attention,
  };
}

export function statusFilter(
  filters: OrderListFilters
): OrderStatus | undefined {
  if (filters.status && ORDER_STATUSES.includes(filters.status)) {
    return filters.status;
  }
  return undefined;
}

export async function listPartnerOrders(
  filters: OrderListFilters = {}
): Promise<{ orders: PartnerOrderSummary[]; total: number }> {
  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select(PARTNER_ORDER_COLUMNS, { count: "exact" })
    // Partners see paid or later only. Unpaid carts stay admin-only.
    .neq("status", "pending_payment")
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
    orders: data.map((row) =>
      mapPartnerSummary(
        row as unknown as Parameters<typeof mapPartnerSummary>[0]
      )
    ),
    total: count ?? data.length,
  };
}

export async function getPartnerOrder(
  id: string
): Promise<PartnerOrderDetail | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(PARTNER_ORDER_DETAIL_COLUMNS)
    .eq("id", id)
    // Direct links to an unpaid order are not a partner page either.
    .neq("status", "pending_payment")
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
    items: mapPartnerItems(row.order_items),
    events: mapOrderEvents(row.order_events),
  };
}
