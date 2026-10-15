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
