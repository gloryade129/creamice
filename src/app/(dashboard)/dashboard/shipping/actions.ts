"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { updateShippingFees } from "@/lib/data/shipping";
import { nairaStringToKobo } from "@/lib/money";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import {
  firstError,
  nairaAmountSchema,
  shippingSettingsSchema,
} from "@/lib/validation/settings";

export interface ShippingActionState {
  error?: string;
  success?: string;
}

export async function updateShippingAction(
  _previous: ShippingActionState,
  formData: FormData
): Promise<ShippingActionState> {
  await requireRole(["admin"]);

  const defaultFee = shippingSettingsSchema.safeParse({
    defaultFee: formData.get("default_fee"),
  });
  if (!defaultFee.success) return { error: firstError(defaultFee.error) };

  const fees: Record<string, number> = {};
  for (const [index, state] of NIGERIAN_STATES.entries()) {
    const parsed = nairaAmountSchema.safeParse(formData.get(`fee_${index}`));
    if (!parsed.success) {
      return { error: `${state}: ${firstError(parsed.error)}` };
    }
    fees[state] = nairaStringToKobo(parsed.data);
  }

  const saved = await updateShippingFees(
    nairaStringToKobo(defaultFee.data.defaultFee),
    fees
  );
  if (!saved) return { error: "Could not save the delivery fees. Try again." };

  revalidatePath("/dashboard/shipping");
  revalidatePath("/checkout");
  return { success: "Delivery fees saved." };
}
