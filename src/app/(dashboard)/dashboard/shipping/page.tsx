import { requireRole } from "@/lib/auth/session";
import { getStoreSettings } from "@/lib/data/settings";
import { getShippingRatesForAdmin } from "@/lib/data/shipping";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShippingForm } from "@/components/dashboard/ShippingForm";

export default async function ShippingPage() {
  await requireRole(["admin"]);

  const [settings, rates] = await Promise.all([
    getStoreSettings(),
    getShippingRatesForAdmin(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Shipping"
        description="The fee charged for each state at checkout. Saving a fee makes that state active for new orders."
      />
      <ShippingForm
        rates={rates}
        defaultFeeKobo={settings.default_shipping_fee_kobo}
      />
    </div>
  );
}
