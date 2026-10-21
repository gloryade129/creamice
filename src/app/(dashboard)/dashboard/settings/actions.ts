"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { updateStoreSettings } from "@/lib/data/settings";
import {
  firstError,
  percentStringToBps,
  storeSettingsSchema,
} from "@/lib/validation/settings";

export interface SettingsActionState {
  error?: string;
  success?: string;
}

export async function updateSettingsAction(
  _previous: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireRole(["admin"]);

  const parsed = storeSettingsSchema.safeParse({
    storeName: formData.get("store_name"),
    whatsappNumber: formData.get("whatsapp_number"),
    whatsappChannelUrl: formData.get("whatsapp_channel_url"),
    supportEmail: formData.get("support_email"),
    requireProductApproval: formData.get("require_product_approval") === "on",
    commissionPercent: formData.get("commission_percent"),
    builderSubaccountId: formData.get("builder_subaccount_id"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const bps = percentStringToBps(parsed.data.commissionPercent);
  if (bps === null) {
    return { error: "Enter a commission percentage from 0 to 100." };
  }

  const saved = await updateStoreSettings({
    store_name: parsed.data.storeName,
    whatsapp_number: parsed.data.whatsappNumber,
    whatsapp_channel_url: parsed.data.whatsappChannelUrl,
    support_email: parsed.data.supportEmail,
    require_product_approval: parsed.data.requireProductApproval,
    commission_rate: bps / 10000,
    builder_subaccount_id: parsed.data.builderSubaccountId,
  });
  if (!saved) return { error: "Could not save the settings. Try again." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");
  return { success: "Settings saved." };
}
