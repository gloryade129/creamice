import { createAdminClient } from "@/lib/supabase/admin";

export interface StoreSettings {
  store_name: string;
  whatsapp_number: string | null;
  whatsapp_channel_url: string | null;
  support_email: string | null;
  default_shipping_fee_kobo: number;
  require_product_approval: boolean;
  commission_rate: number;
  builder_subaccount_id: string | null;
}

const DEFAULT_SETTINGS: StoreSettings = {
  store_name: "Creamice",
  whatsapp_number: null,
  whatsapp_channel_url: null,
  support_email: null,
  default_shipping_fee_kobo: 0,
  // Fail closed: without a readable switch, partner changes still need review.
  require_product_approval: true,
  commission_rate: 0.2,
  builder_subaccount_id: null,
};

export interface PublicSiteLinks {
  whatsapp_number: string | null;
  whatsapp_channel_url: string | null;
}

// Footer links for the public storefront. Selects only the public columns:
// the settings row also holds the commission rate and the builder
// subaccount, which must never be fetched by a public page.
export async function getPublicSiteLinks(): Promise<PublicSiteLinks> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("whatsapp_number, whatsapp_channel_url")
      .single();
    if (error || !data) return { whatsapp_number: null, whatsapp_channel_url: null };
    return {
      whatsapp_number: data.whatsapp_number ?? null,
      whatsapp_channel_url: data.whatsapp_channel_url ?? null,
    };
  } catch {
    return { whatsapp_number: null, whatsapp_channel_url: null };
  }
}

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("store_settings").select("*").single();
    if (error || !data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...data } as StoreSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export interface StoreSettingsUpdate {
  store_name: string;
  whatsapp_number: string | null;
  whatsapp_channel_url: string | null;
  support_email: string | null;
  require_product_approval: boolean;
  commission_rate: number;
  builder_subaccount_id: string | null;
}

// Admin-only write. The caller has already checked the role and validated
// every field; this function only talks to the database.
export async function updateStoreSettings(
  input: StoreSettingsUpdate
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("store_settings")
    .update(input)
    .eq("id", true)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("[settings] Could not update store settings.");
    return false;
  }
  return true;
}
