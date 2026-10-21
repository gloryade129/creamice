import { z } from "zod";
import { NIGERIAN_STATES } from "@/lib/nigeria";

const name = z
  .string()
  .trim()
  .min(2, "Enter your full name.")
  .max(120, "That name is too long.");

const phone = z
  .string()
  .trim()
  .max(30, "That phone number is too long.")
  .regex(/^[0-9+()\-\s]*$/, "Use digits, spaces, +, - or brackets only.")
  .optional()
  .transform((value) => (value ? value : null));

export const profileSchema = z.object({
  fullName: name,
  phone,
});

export const registerSchema = z.object({
  fullName: name,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(200, "That email is too long."),
  phone,
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Keep the password under 72 characters."),
});

export const addressSchema = z.object({
  label: z
    .string()
    .trim()
    .max(40, "Keep the label under 40 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  recipientName: name,
  phone: z
    .string()
    .trim()
    .min(7, "Enter a phone number for the rider.")
    .max(30, "That phone number is too long.")
    .regex(/^[0-9+()\-\s]+$/, "Use digits, spaces, +, - or brackets only."),
  address: z
    .string()
    .trim()
    .min(4, "Enter the delivery address.")
    .max(300, "That address is too long."),
  city: z
    .string()
    .trim()
    .min(2, "Enter the city or town.")
    .max(100, "That city name is too long."),
  state: z
    .string()
    .trim()
    .refine(
      (value) => (NIGERIAN_STATES as readonly string[]).includes(value),
      "Choose a Nigerian state."
    ),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the details and try again.";
}
