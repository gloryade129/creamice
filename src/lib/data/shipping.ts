import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreSettings } from "@/lib/data/settings";
import { NIGERIAN_STATES } from "@/lib/nigeria";

export interface ShippingConfig {
  defaultFeeKobo: number;
  rates: Record<string, number>;
}

export interface AdminShippingRate {
  state: string;
  feeKobo: number;
  isActive: boolean;
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

// Admin view: every saved state row, in the same order as the checkout state
// list. Missing states are filled in by the page from NIGERIAN_STATES.
export async function getShippingRatesForAdmin(): Promise<AdminShippingRate[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shipping_rates")
      .select("state, fee_kobo, is_active");
    if (error) throw error;

    const position = new Map(
      NIGERIAN_STATES.map((state, index) => [state, index] as const)
    );

    return (data ?? [])
      .map((row) => ({
        state: row.state,
        feeKobo: row.fee_kobo,
        isActive: row.is_active,
      }))
      .sort(
        (a, b) =>
          (position.get(a.state) ?? 999) - (position.get(b.state) ?? 999) ||
          a.state.localeCompare(b.state)
      );
  } catch {
    return [];
  }
}

// Admin-only write. Saving the form applies the fee to every state sent from
// the page, including states whose old rate was inactive.
export async function updateShippingFees(
  defaultFeeKobo: number,
  fees: Record<string, number>
): Promise<boolean> {
  const supabase = createAdminClient();

  const { error: settingsError } = await supabase
    .from("store_settings")
    .update({ default_shipping_fee_kobo: defaultFeeKobo })
    .eq("id", true);
  if (settingsError) {
    console.error("[shipping] Could not update the default fee.");
    return false;
  }

  const rows = Object.entries(fees).map(([state, feeKobo]) => ({
    state,
    fee_kobo: feeKobo,
    is_active: true,
  }));
  const { error } = await supabase
    .from("shipping_rates")
    .upsert(rows, { onConflict: "state" });

  if (error) {
    console.error("[shipping] Could not update state fees.");
    return false;
  }
  return true;
}
