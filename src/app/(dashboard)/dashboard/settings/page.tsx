import { requireRole } from "@/lib/auth/session";
import { getStoreSettings } from "@/lib/data/settings";
import { bpsToPercentInput } from "@/lib/validation/settings";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export default async function SettingsPage() {
  await requireRole(["admin"]);
  const settings = await getStoreSettings();
  const commissionPercent = bpsToPercentInput(
    Math.round(settings.commission_rate * 10000)
  );

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Store settings"
        description="Contact details, product approval and the builder commission split. Delivery fees live on the Shipping page."
      />
      <SettingsForm settings={settings} commissionPercent={commissionPercent} />
    </div>
  );
}
