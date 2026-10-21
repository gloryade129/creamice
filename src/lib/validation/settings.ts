import { z } from "zod";

// Admin settings input stays text in the browser. Money and percentages are
// parsed on the server so the database never receives a float-rounded value.

const optionalUrl = z
  .string()
  .trim()
  .max(300, "That link is too long.")
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a full link starting with https://")
  .transform((value) => (value ? value : null));

export function percentStringToBps(value: string): number | null {
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const bps = whole * 100 + fraction;
  return bps <= 10000 ? bps : null;
}

export function bpsToPercentInput(bps: number): string {
  const whole = Math.trunc(bps / 100);
  const rest = ((bps % 100) + 100) % 100;
  return rest === 0 ? String(whole) : `${whole}.${String(rest).padStart(2, "0")}`;
}

export const nairaAmountSchema = z
  .string()
  .trim()
  .regex(
    /^\d{1,7}(?:\.\d{1,2})?$/,
    "Enter an amount in naira, for example 3500 or 3500.50."
  );

export const storeSettingsSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(1, "Enter the store name.")
    .max(80, "Keep the store name under 80 characters."),
  whatsappNumber: z
    .string()
    .trim()
    .max(30, "That phone number is too long.")
    .refine(
      (value) => !value || /^[0-9+()\-\s]{7,}$/.test(value),
      "Use digits, spaces, +, - or brackets only."
    )
    .transform((value) => (value ? value : null)),
  whatsappChannelUrl: optionalUrl,
  supportEmail: z
    .string()
    .trim()
    .max(200, "That email is too long.")
    .refine(
      (value) => !value || z.string().email().safeParse(value).success,
      "Enter a valid email address."
    )
    .transform((value) => (value ? value : null)),
  requireProductApproval: z.boolean(),
  commissionPercent: z
    .string()
    .trim()
    .refine(
      (value) => percentStringToBps(value) !== null,
      "Enter a percentage from 0 to 100, with up to two decimals."
    ),
  builderSubaccountId: z
    .string()
    .trim()
    .max(100, "That subaccount ID is too long.")
    .refine(
      (value) => !value || /^RS_[A-Za-z0-9_-]+$/.test(value),
      "A Flutterwave subaccount ID starts with RS_."
    )
    .transform((value) => (value ? value : null)),
});

export const shippingSettingsSchema = z.object({
  defaultFee: nairaAmountSchema,
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the details and try again.";
}
