import { z } from "zod";
import { NIGERIAN_STATES } from "@/lib/nigeria";

// A variant ID comes from the database. The preview catalogue uses readable
// ids such as "demo-heavyweight-hoodie-m", which must never reach checkout.
const variantId = z.string().uuid("This item is not available to buy.");

const item = z.object({
  variantId,
  quantity: z
    .number()
    .int("Choose a whole number.")
    .min(1, "Choose at least one.")
    .max(10, "Maximum 10 per item per order."),
});

const state = z
  .string()
  .trim()
  .refine(
    (value) => (NIGERIAN_STATES as readonly string[]).includes(value),
    "Choose a Nigerian state."
  );

const discountCode = z
  .string()
  .trim()
  .max(40, "That code is too long.")
  .optional()
  .transform((value) => (value ? value.toUpperCase() : undefined));

export const quoteSchema = z.object({
  items: z.array(item).min(1, "Your bag is empty.").max(30, "Too many items."),
  state: state.optional(),
  discountCode,
});

export const checkoutSchema = quoteSchema.extend({
  customerName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "That name is too long."),
  customerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(200, "That email is too long."),
  customerPhone: z
    .string()
    .trim()
    .min(7, "Enter a phone number we can call.")
    .max(30, "That phone number is too long.")
    .regex(/^[0-9+()\-\s]+$/, "Use digits, spaces, +, - or brackets only."),
  shippingAddress: z
    .string()
    .trim()
    .min(4, "Enter the delivery address.")
    .max(300, "That address is too long."),
  shippingCity: z
    .string()
    .trim()
    .min(2, "Enter the city or town.")
    .max(100, "That city name is too long."),
  shippingState: state,
  deliveryNote: z
    .string()
    .trim()
    .max(500, "Keep the note under 500 characters.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type QuoteInput = z.infer<typeof quoteSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Turn Zod issues into one message per field for the checkout form.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !result[key]) result[key] = issue.message;
  }
  return result;
}
