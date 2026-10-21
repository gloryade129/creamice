"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  canTransition,
  isOrderStatus,
  type OrderStatus,
} from "@/lib/orders";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function orderPath(id: string, code: string): string {
  return `/dashboard/orders/${id}?${code}`;
}

function safeOrderId(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && UUID.test(value) ? value : null;
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const user = await requireRole(["admin", "partner"]);

  const orderId = safeOrderId(formData.get("order_id"));
  const target = formData.get("status");
  if (!orderId || !isOrderStatus(target)) {
    redirect("/dashboard/orders?error=bad-request");
  }

  // A paid state is created only by the verified Flutterwave flow and
  // mark_order_paid. It is never a dashboard status button.
  if (target === "paid") {
    redirect(orderPath(orderId, "error=payment-only"));
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) redirect("/dashboard/orders?error=db");
  if (!order) redirect("/dashboard/orders?error=not-found");

  const from = order.status as OrderStatus;
  if (!canTransition(from, target, user.role)) {
    redirect(orderPath(orderId, "error=transition"));
  }

  // The status filter makes two dashboards pressing at once fail safely
  // instead of skipping a fulfilment step.
  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({ status: target })
    .eq("id", orderId)
    .eq("status", from)
    .select("id")
    .maybeSingle();

  if (updateError) redirect(orderPath(orderId, "error=db"));
  if (!updated) redirect(orderPath(orderId, "error=conflict"));

  const note =
    target === "confirmed"
      ? "Order approved"
      : target === "cancelled"
        ? "Cancelled from the dashboard"
        : `Status changed to ${target}`;

  const { error: eventError } = await admin.from("order_events").insert({
    order_id: orderId,
    actor_id: user.id,
    from_status: from,
    to_status: target,
    note,
  });
  if (eventError) {
    console.error(`[orders] Status changed but event insert failed for ${orderId}.`);
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard");
  redirect(orderPath(orderId, "ok=updated"));
}

export async function expireUnpaidOrdersAction(): Promise<void> {
  await requireRole(["admin"]);

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("expire_unpaid_orders");
  if (error) {
    console.error("[orders] Could not expire unpaid orders.");
    redirect("/dashboard/orders?error=expire");
  }

  const count = typeof data === "number" ? data : 0;
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  redirect(`/dashboard/orders?ok=expired&count=${count}`);
}
