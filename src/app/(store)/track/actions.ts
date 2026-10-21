"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { findOrderForTracking } from "@/lib/data/checkout";
import { createOrderToken } from "@/lib/order-token";

export interface TrackState {
  error?: string;
}

const schema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^CRM-[0-9]+$/, "Enter the order number, for example CRM-1001."),
  email: z.string().trim().toLowerCase().email("Enter the email used for the order."),
});

export async function trackOrder(
  _previous: TrackState,
  formData: FormData
): Promise<TrackState> {
  const parsed = schema.safeParse({
    orderNumber: formData.get("orderNumber"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details and try again." };
  }

  let found: string | null = null;
  try {
    found = await findOrderForTracking(parsed.data.orderNumber, parsed.data.email);
  } catch {
    return { error: "Could not look up the order just now. Please try again." };
  }

  if (!found) {
    // Same message for an unknown order and a wrong email, so the page cannot
    // be used to learn which order numbers exist.
    return {
      error:
        "No order matches that number and email. Check the confirmation email and try again.",
    };
  }

  redirect(
    `/order/${encodeURIComponent(found)}?token=${createOrderToken(found)}`
  );
}
