import { createAdminClient } from "@/lib/supabase/admin";
import { getShippingConfig } from "@/lib/data/shipping";
import { getStoreSettings } from "@/lib/data/settings";
import { quoteTotals } from "@/lib/checkout-calc";
import { calculateDiscount } from "@/lib/money";
import type { CheckoutItemInput, CheckoutQuote, PricedLine } from "@/lib/checkout-types";
import type { CheckoutInput } from "@/lib/validation/checkout";

// Server-side checkout. Every amount here comes from the database; the
// browser only ever sends variant IDs and quantities. Nothing in this file
// may be imported by a client component.

interface VariantRow {
  id: string;
  product_id: string;
  size: string;
  color: string | null;
  stock: number;
  product:
    | {
        id: string;
        name: string;
        price_kobo: number;
        status: string;
      }
    | null;
}

interface DiscountRow {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_subtotal_kobo: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

function emptyQuote(state: string | null): CheckoutQuote {
  return {
    lines: [],
    subtotalKobo: 0,
    discountKobo: 0,
    shippingKobo: 0,
    totalKobo: 0,
    commissionBaseKobo: 0,
    commissionRate: 0,
    commissionKobo: 0,
    discountCode: null,
    state,
    issues: [],
  };
}

async function resolveDiscount(
  code: string | undefined,
  subtotalKobo: number
): Promise<{ id: string | null; kobo: number; error?: string }> {
  if (!code) return { id: null, kobo: 0 };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("discount_codes")
    .select(
      "id, code, type, value, min_subtotal_kobo, max_uses, used_count, starts_at, ends_at, is_active"
    )
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) throw new CheckoutError("Could not check that discount code. Try again.", 503);
  if (!data) return { id: null, kobo: 0, error: "That discount code is not valid." };

  const discount = data as unknown as DiscountRow;
  const now = Date.now();

  if (!discount.is_active) {
    return { id: null, kobo: 0, error: "That discount code is no longer active." };
  }
  if (discount.starts_at && new Date(discount.starts_at).getTime() > now) {
    return { id: null, kobo: 0, error: "That discount code is not active yet." };
  }
  if (discount.ends_at && new Date(discount.ends_at).getTime() <= now) {
    return { id: null, kobo: 0, error: "That discount code has expired." };
  }
  if (discount.max_uses !== null && discount.used_count >= discount.max_uses) {
    return { id: null, kobo: 0, error: "That discount code has been used up." };
  }
  if (subtotalKobo < discount.min_subtotal_kobo) {
    return {
      id: null,
      kobo: 0,
      error: "Your bag does not reach the minimum for that code.",
    };
  }

  const kobo = Math.min(
    subtotalKobo,
    calculateDiscount(subtotalKobo, discount.type, discount.value)
  );
  return { id: discount.id, kobo };
}

// Re-price a cart from the database. Sold-out or missing lines are reported
// in `issues` instead of throwing, so the checkout page can explain them.
export async function quoteCart({
  items,
  state,
  discountCode,
}: {
  items: CheckoutItemInput[];
  state?: string;
  discountCode?: string;
}): Promise<CheckoutQuote> {
  const quote = emptyQuote(state ?? null);
  const wanted = new Map<string, number>();

  for (const item of items) {
    wanted.set(item.variantId, (wanted.get(item.variantId) ?? 0) + item.quantity);
  }

  for (const quantity of wanted.values()) {
    if (quantity > 10) quote.issues.push("Maximum 10 of one item per order.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_variants")
    .select(
      "id, product_id, size, color, stock, product:products (id, name, price_kobo, status)"
    )
    .in("id", Array.from(wanted.keys()));

  if (error) throw new CheckoutError("Could not check your bag. Try again.", 503);

  const rows = (data ?? []) as unknown as VariantRow[];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const lines: PricedLine[] = [];

  for (const [variantId, quantity] of wanted) {
    const row = byId.get(variantId);
    if (!row || !row.product || row.product.status !== "active") {
      quote.issues.push("One item in your bag is no longer available.");
      continue;
    }
    if (row.stock < quantity) {
      quote.issues.push(
        row.stock <= 0
          ? `${row.product.name} (${row.size}) is sold out.`
          : `Only ${row.stock} left of ${row.product.name} (${row.size}).`
      );
      continue;
    }
    lines.push({
      variantId: row.id,
      productId: row.product_id,
      name: row.product.name,
      size: row.size,
      color: row.color,
      unitPriceKobo: row.product.price_kobo,
      quantity,
      stock: row.stock,
    });
  }

  lines.sort((a, b) => a.name.localeCompare(b.name) || a.size.localeCompare(b.size));
  quote.lines = lines;
  quote.subtotalKobo = lines.reduce(
    (total, line) => total + line.unitPriceKobo * line.quantity,
    0
  );

  const discount = await resolveDiscount(discountCode, quote.subtotalKobo);
  if (discount.error) quote.issues.push(discount.error);
  quote.discountKobo = discount.kobo;
  quote.discountCode = discount.id ? (discountCode ?? null) : null;

  if (state) {
    const shipping = await getShippingConfig();
    quote.shippingKobo = shipping.rates[state] ?? shipping.defaultFeeKobo;
  }

  const settings = await getStoreSettings();
  const totals = quoteTotals(
    quote.subtotalKobo,
    quote.discountKobo,
    quote.shippingKobo,
    settings.commission_rate
  );
  quote.commissionRate = settings.commission_rate;
  quote.commissionBaseKobo = totals.commissionBaseKobo;
  quote.commissionKobo = totals.commissionKobo;
  quote.totalKobo = totals.totalKobo;

  if (quote.lines.length === 0 && quote.issues.length === 0) {
    quote.issues.push("Your bag is empty.");
  }

  return quote;
}

export interface PendingOrder {
  id: string;
  orderNumber: string;
  txRef: string;
  totalKobo: number;
}

function newTxRef(): string {
  return `CRM-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
}

// Insert the order, its items and the payment snapshot. The totals passed in
// come from quoteCart, never from the browser. If a later insert fails the
// order is removed, so no half-order is left for the dashboard.
export async function createPendingOrder(
  input: CheckoutInput,
  quote: CheckoutQuote,
  customerId?: string | null
): Promise<PendingOrder> {
  if (quote.issues.length > 0) {
    throw new CheckoutError(quote.issues[0]);
  }

  const settings = await getStoreSettings();
  const admin = createAdminClient();
  const txRef = newTxRef();

  const baseOrder = {
    status: "pending_payment",
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    shipping_address: input.shippingAddress,
    shipping_city: input.shippingCity,
    shipping_state: input.shippingState,
    delivery_note: input.deliveryNote ?? null,
  };

  let order:
    | { id: string; order_number: string }
    | null = null;
  let orderError: { code?: string } | null = null;

  if (customerId) {
    const first = await admin
      .from("orders")
      .insert({ ...baseOrder, customer_id: customerId })
      .select("id, order_number")
      .single();
    order = first.data;
    orderError = first.error;

    // The account migration may not have run yet. Guest checkout still works,
    // so fall back rather than failing a real order over an optional link.
    if (orderError && (orderError.code === "42703" || orderError.code === "PGRST204")) {
      const retry = await admin
        .from("orders")
        .insert(baseOrder)
        .select("id, order_number")
        .single();
      order = retry.data;
      orderError = retry.error;
    }
  } else {
    const result = await admin
      .from("orders")
      .insert(baseOrder)
      .select("id, order_number")
      .single();
    order = result.data;
    orderError = result.error;
  }

  if (orderError || !order) {
    throw new CheckoutError("Could not start your order. Try again.", 503);
  }

  try {
    const { error: itemsError } = await admin.from("order_items").insert(
      quote.lines.map((line) => ({
        order_id: order.id,
        product_id: line.productId,
        variant_id: line.variantId,
        product_name: line.name,
        size: line.size,
        color: line.color,
        unit_price_kobo: line.unitPriceKobo,
        quantity: line.quantity,
      }))
    );
    if (itemsError) throw itemsError;

    const { error: paymentError } = await admin.from("order_payments").insert({
      order_id: order.id,
      tx_ref: txRef,
      status: "initiated",
      subtotal_kobo: quote.subtotalKobo,
      discount_kobo: quote.discountKobo,
      shipping_kobo: quote.shippingKobo,
      total_kobo: quote.totalKobo,
      discount_code_id: quote.discountCode ? await discountId(quote.discountCode) : null,
      commission_rate: quote.commissionRate,
      commission_base_kobo: quote.commissionBaseKobo,
      commission_kobo: quote.commissionKobo,
      builder_subaccount_id: settings.builder_subaccount_id,
    });
    if (paymentError) throw paymentError;
  } catch {
    await admin.from("orders").delete().eq("id", order.id);
    throw new CheckoutError("Could not start your order. Try again.", 503);
  }

  return {
    id: order.id,
    orderNumber: order.order_number,
    txRef,
    totalKobo: quote.totalKobo,
  };
}

async function discountId(code: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("discount_codes")
    .select("id")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  return data?.id ?? null;
}

// Payment creation failed or timed out. No money should have moved; if it did
// later, mark_order_paid flags the cancelled order for the admin.
export async function cancelPendingOrder(orderId: string, txRef: string, note: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("order_payments")
    .update({ status: "failed" })
    .eq("tx_ref", txRef)
    .eq("status", "initiated");
  await admin
    .from("orders")
    .update({ status: "cancelled", attention_note: note })
    .eq("id", orderId)
    .eq("status", "pending_payment");
  await admin.from("order_events").insert({
    order_id: orderId,
    from_status: "pending_payment",
    to_status: "cancelled",
    note,
  });
}

export interface PaymentOrder {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  customerEmail: string;
  customerName: string;
  totalKobo: number;
  paymentStatus: string;
  flwTransactionId: string | null;
}

export async function getPaymentByTxRef(txRef: string): Promise<PaymentOrder | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("order_payments")
    .select(
      "status, total_kobo, flw_transaction_id, order:orders (id, order_number, status, customer_email, customer_name)"
    )
    .eq("tx_ref", txRef)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as {
    status: string;
    total_kobo: number;
    flw_transaction_id: string | null;
    order: {
      id: string;
      order_number: string;
      status: string;
      customer_email: string;
      customer_name: string;
    } | null;
  };
  if (!row.order) return null;

  return {
    orderId: row.order.id,
    orderNumber: row.order.order_number,
    orderStatus: row.order.status,
    customerEmail: row.order.customer_email,
    customerName: row.order.customer_name,
    totalKobo: row.total_kobo,
    paymentStatus: row.status,
    flwTransactionId: row.flw_transaction_id,
  };
}

// Idempotent: the database function returns false when this payment was
// already completed, and never moves stock twice.
export async function markOrderPaid(txRef: string, transactionId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("mark_order_paid", {
    p_tx_ref: txRef,
    p_flw_transaction_id: transactionId,
  });
  if (error) {
    throw new CheckoutError("Could not confirm the payment yet.", 503);
  }
  return Boolean(data);
}

export interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  deliveryNote: string | null;
  items: Array<{
    productName: string;
    size: string;
    color: string | null;
    quantity: number;
    unitPriceKobo: number;
  }>;
  subtotalKobo: number;
  discountKobo: number;
  shippingKobo: number;
  totalKobo: number;
}

// One query for the emails sent after payment. Kept separate from the customer
// order page so the page never selects customer phone or payment amounts.
export async function getOrderEmailData(orderId: string): Promise<OrderEmailData | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      "id, order_number, status, created_at, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_state, delivery_note, order_items (product_name, size, color, quantity, unit_price_kobo), payment:order_payments (subtotal_kobo, discount_kobo, shipping_kobo, total_kobo)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as {
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    delivery_note: string | null;
    order_items: Array<{
      product_name: string;
      size: string;
      color: string | null;
      quantity: number;
      unit_price_kobo: number;
    }> | null;
    payment:
      | {
          subtotal_kobo: number;
          discount_kobo: number;
          shipping_kobo: number;
          total_kobo: number;
        }
      | null;
  };

  return {
    orderId: row.id,
    orderNumber: row.order_number,
    status: row.status,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    shippingCity: row.shipping_city,
    shippingState: row.shipping_state,
    deliveryNote: row.delivery_note,
    items: (row.order_items ?? []).map((item) => ({
      productName: item.product_name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPriceKobo: item.unit_price_kobo,
    })),
    subtotalKobo: row.payment?.subtotal_kobo ?? 0,
    discountKobo: row.payment?.discount_kobo ?? 0,
    shippingKobo: row.payment?.shipping_kobo ?? 0,
    totalKobo: row.payment?.total_kobo ?? 0,
  };
}

export interface CustomerOrderItem {
  productName: string;
  size: string;
  color: string | null;
  quantity: number;
  unitPriceKobo: number;
}

export interface CustomerOrderEvent {
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  deliveryNote: string | null;
  createdAt: string;
  items: CustomerOrderItem[];
  events: CustomerOrderEvent[];
  subtotalKobo: number;
  discountKobo: number;
  shippingKobo: number;
  totalKobo: number;
}

interface CustomerOrderRow {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  delivery_note: string | null;
  created_at: string;
  order_items: Array<{
    product_name: string;
    size: string;
    color: string | null;
    quantity: number;
    unit_price_kobo: number;
  }> | null;
  order_events: Array<{
    from_status: string | null;
    to_status: string;
    created_at: string;
  }> | null;
  payment: {
    subtotal_kobo: number;
    discount_kobo: number;
    shipping_kobo: number;
    total_kobo: number;
  } | null;
}

export async function getCustomerOrder(orderNumber: string): Promise<CustomerOrder | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      "id, order_number, status, customer_name, customer_email, shipping_address, shipping_city, shipping_state, delivery_note, created_at, order_items (product_name, size, color, quantity, unit_price_kobo), order_events (from_status, to_status, created_at), payment:order_payments (subtotal_kobo, discount_kobo, shipping_kobo, total_kobo)"
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as CustomerOrderRow;

  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    shippingAddress: row.shipping_address,
    shippingCity: row.shipping_city,
    shippingState: row.shipping_state,
    deliveryNote: row.delivery_note,
    createdAt: row.created_at,
    items: (row.order_items ?? []).map((item) => ({
      productName: item.product_name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPriceKobo: item.unit_price_kobo,
    })),
    events: (row.order_events ?? [])
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((event) => ({
        fromStatus: event.from_status,
        toStatus: event.to_status,
        createdAt: event.created_at,
      })),
    subtotalKobo: row.payment?.subtotal_kobo ?? 0,
    discountKobo: row.payment?.discount_kobo ?? 0,
    shippingKobo: row.payment?.shipping_kobo ?? 0,
    totalKobo: row.payment?.total_kobo ?? 0,
  };
}

// /track needs a match on both order number and email. It returns the order
// number only, never any customer data.
export async function findOrderForTracking(
  orderNumber: string,
  email: string
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("order_number")
    .eq("order_number", orderNumber)
    .eq("customer_email", email.trim().toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  return data.order_number;
}
