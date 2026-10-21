"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { StoreSettings } from "@/lib/data/settings";
import {
  updateSettingsAction,
  type SettingsActionState,
} from "@/app/(dashboard)/dashboard/settings/actions";

const initialState: SettingsActionState = {};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
      <h2 className="font-montserrat text-sm font-semibold text-offwhite">{title}</h2>
      <p className="mt-1 max-w-[70ch] text-sm text-muted">{description}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsForm({
  settings,
  commissionPercent,
}: {
  settings: StoreSettings;
  commissionPercent: string;
}) {
  const [state, action, pending] = useActionState(updateSettingsAction, initialState);
  const [approval, setApproval] = useState(settings.require_product_approval);
  const [values, setValues] = useState({
    storeName: settings.store_name,
    supportEmail: settings.support_email ?? "",
    whatsappNumber: settings.whatsapp_number ?? "",
    whatsappChannelUrl: settings.whatsapp_channel_url ?? "",
    commissionPercent,
    builderSubaccountId: settings.builder_subaccount_id ?? "",
  });

  function update(key: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value }));
  }

  return (
    <form action={action} className="space-y-6">
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          role="status"
          className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
        >
          {state.success}
        </p>
      ) : null}

      <Section
        title="Store details"
        description="The name customers see and the address order alerts come from. The sender address itself is set in Brevo."
      >
        <Input
          label="Store name"
          name="store_name"
          value={values.storeName}
          onChange={update("storeName")}
          maxLength={80}
          required
        />
        <Input
          label="Support email"
          name="support_email"
          type="email"
          value={values.supportEmail}
          onChange={update("supportEmail")}
          placeholder="hello@example.com"
          hint="Shown on help pages and used as the reply address for order emails."
        />
      </Section>

      <Section
        title="WhatsApp"
        description="Used by the order page and track page help buttons. The Channel link appears in the footer."
      >
        <Input
          label="WhatsApp number"
          name="whatsapp_number"
          type="tel"
          inputMode="tel"
          value={values.whatsappNumber}
          onChange={update("whatsappNumber")}
          placeholder="+234 801 234 5678"
          hint="Include the country code. Punctuation is removed when building the link."
        />
        <Input
          label="WhatsApp Channel URL"
          name="whatsapp_channel_url"
          type="url"
          value={values.whatsappChannelUrl}
          onChange={update("whatsappChannelUrl")}
          placeholder="https://whatsapp.com/channel/..."
          hint="Leave empty to hide the footer link."
        />
      </Section>

      <Section
        title="Product approval"
        description="When this is on, new products and edits to live product details wait for an admin. Stock changes still apply immediately."
      >
        <label className="flex min-h-[44px] items-center gap-3 text-sm text-offwhite sm:col-span-2">
          <input
            type="checkbox"
            name="require_product_approval"
            checked={approval}
            onChange={(event) => setApproval(event.target.checked)}
            className="h-4 w-4 rounded border-border-strong accent-[#c6a15b]"
          />
          Require admin approval for product changes
        </label>
      </Section>

      <Section
        title="Builder commission"
        description="The percentage of product value after discount, excluding delivery. Flutterwave pays it to the builder's subaccount at payment time; Creamice keeps the rest and pays Flutterwave's fee."
      >
        <Input
          label="Commission rate (%)"
          name="commission_percent"
          inputMode="decimal"
          value={values.commissionPercent}
          onChange={update("commissionPercent")}
          placeholder="20"
          hint="0 to 100, up to two decimals."
          required
        />
        <Input
          label="Builder subaccount ID"
          name="builder_subaccount_id"
          value={values.builderSubaccountId}
          onChange={update("builderSubaccountId")}
          placeholder="RS_..."
          hint="Leave empty until the Flutterwave subaccount exists. No split is sent while this is empty."
        />
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          Save settings
        </Button>
        <p className="text-xs text-muted">
          Changes affect new orders only; existing commission snapshots do not
          change.
        </p>
      </div>
    </form>
  );
}
