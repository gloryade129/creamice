import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreSettings } from "@/lib/data/settings";

export interface ShippingConfig {
  defaultFeeKobo: number;
  rates: Record<string, number>;
}

// Public checkout data: the fee per state and the fallback fee. No other
// store settings are exposed to the client.
export async function getShippingConfig(): Promise<ShippingConfig> {
  const settings = await getStoreSettings();

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shipping_rates")
      .select("state, fee_kobo")
      .eq("is_active", true);

    if (error) throw error;

    const rates: Record<string, number> = {};
    for (const row of data ?? []) {
      rates[row.state] = row.fee_kobo;
    }

    return { defaultFeeKobo: settings.default_shipping_fee_kobo, rates };
  } catch {
    return { defaultFeeKobo: settings.default_shipping_fee_kobo, rates: {} };
  }
}
