import { createServerClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

// Customer accounts live in `customers`, separate from staff `profiles`.
// Every read and write here is server-side. The browser only holds the
// Supabase auth session.

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
}

export interface CustomerAddress {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface CustomerSession {
  user: User;
  customer: Customer | null;
  emailConfirmed: boolean;
}

function mapCustomer(row: {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}): Customer {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
  };
}

export async function getAuthUser(): Promise<User | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Create the customer row on first authenticated visit. The auth user id is
// the primary key, so a user cannot claim someone else's row.
export async function ensureCustomer(user: User): Promise<Customer | null> {
  if (!user.email) return null;
  const admin = createAdminClient();

  const { data: existing, error: readError } = await admin
    .from("customers")
    .select("id, full_name, email, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    // 42P01 = the customer migration has not been run yet. Accounts stay
    // unavailable, but the rest of the store (including guest checkout) works.
    console.error("[account] Could not read customers. Has 001_customer_accounts.sql run?");
    return null;
  }
  if (existing) return mapCustomer(existing);

  const metadataName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  const metadataPhone =
    typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null;

  const { data: created, error: createError } = await admin
    .from("customers")
    .insert({
      id: user.id,
      email: user.email.toLowerCase(),
      full_name: metadataName.slice(0, 120),
      phone: metadataPhone ? metadataPhone.slice(0, 30) : null,
    })
    .select("id, full_name, email, phone")
    .single();

  if (createError || !created) {
    console.error("[account] Could not create the customer row.");
    return null;
  }
  return mapCustomer(created);
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const emailConfirmed = Boolean(user.email_confirmed_at || user.confirmed_at);
  return {
    user,
    customer: await ensureCustomer(user),
    emailConfirmed,
  };
}

export async function updateCustomer(
  customerId: string,
  input: { fullName: string; phone: string | null }
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("customers")
    .update({ full_name: input.fullName, phone: input.phone })
    .eq("id", customerId);
  return !error;
}

export async function listAddresses(customerId: string): Promise<CustomerAddress[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customer_addresses")
    .select("id, label, recipient_name, phone, address, city, state, is_default")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    isDefault: row.is_default,
  }));
}

export async function countAddresses(customerId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("customer_addresses")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId);
  return count ?? 0;
}

export async function addAddress(
  customerId: string,
  input: Omit<CustomerAddress, "id" | "isDefault">,
  makeDefault: boolean
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const count = await countAddresses(customerId);
  if (count >= 5) return { ok: false, error: "You can save up to five addresses." };

  const shouldDefault = makeDefault || count === 0;
  if (shouldDefault) {
    await admin
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", customerId)
      .eq("is_default", true);
  }

  const { error } = await admin.from("customer_addresses").insert({
    customer_id: customerId,
    label: input.label,
    recipient_name: input.recipientName,
    phone: input.phone,
    address: input.address,
    city: input.city,
    state: input.state,
    is_default: shouldDefault,
  });

  if (error) return { ok: false, error: "Could not save that address." };
  return { ok: true };
}

export async function deleteAddress(
  customerId: string,
  addressId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("customer_addresses")
    .delete()
    .eq("customer_id", customerId)
    .eq("id", addressId);
  return !error;
}

export async function setDefaultAddress(
  customerId: string,
  addressId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { error: clearError } = await admin
    .from("customer_addresses")
    .update({ is_default: false })
    .eq("customer_id", customerId);
  if (clearError) return false;

  const { error } = await admin
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("customer_id", customerId)
    .eq("id", addressId);
  return !error;
}

export interface CustomerOrderSummary {
  orderNumber: string;
  status: string;
  createdAt: string;
  totalKobo: number;
  itemCount: number;
}

// Only called with the email from a confirmed Supabase session. Guest orders
// placed with that email appear here, and so do orders linked to the customer
// id at checkout even if the customer used a different receipt email.
interface OrderHistoryRow {
  order_number: string;
  status: string;
  created_at: string;
  payment: { total_kobo: number } | null;
  order_items: Array<{ quantity: number }> | null;
}

function mapOrderSummary(row: OrderHistoryRow): CustomerOrderSummary {
  return {
    orderNumber: row.order_number,
    status: row.status,
    createdAt: row.created_at,
    totalKobo: row.payment?.total_kobo ?? 0,
    itemCount: (row.order_items ?? []).reduce(
      (total, item) => total + item.quantity,
      0
    ),
  };
}

export async function listOrdersForEmail(
  email: string,
  customerId?: string
): Promise<CustomerOrderSummary[]> {
  const admin = createAdminClient();
  const columns =
    "order_number, status, created_at, payment:order_payments (total_kobo), order_items (quantity)";

  const [byEmail, byCustomer] = await Promise.all([
    admin
      .from("orders")
      .select(columns)
      .eq("customer_email", email.trim().toLowerCase())
      .order("created_at", { ascending: false })
      .limit(30),
    customerId
      ? admin
          .from("orders")
          .select(columns)
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (byEmail.error) return [];

  const rows = new Map<string, OrderHistoryRow>();
  for (const row of [
    ...((byEmail.data ?? []) as unknown as OrderHistoryRow[]),
    ...((byCustomer.data ?? []) as unknown as OrderHistoryRow[]),
  ]) {
    rows.set(row.order_number, row);
  }

  return Array.from(rows.values())
    .map(mapOrderSummary)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);
}
