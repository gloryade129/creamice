import { z } from "zod";
import { nairaStringToKobo } from "@/lib/money";

// Server-side validation for product create/edit payloads (AGENTS: zod on the
// server). Prices arrive as naira text because that is what the form shows;
// the server converts them to integer kobo with nairaStringToKobo.

export const NAIRA_AMOUNT = /^\d{1,10}(\.\d{1,2})?$/;

const nairaAmount = z
  .string()
  .trim()
  .regex(NAIRA_AMOUNT, "Enter an amount in naira, e.g. 25000 or 25000.50");

export const PRODUCT_STATUSES = [
  "draft",
  "pending_approval",
  "active",
  "upcoming",
  "archived",
] as const;

const storagePath = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .refine((v) => !v.includes("..") && !v.startsWith("/"), "Invalid image path");

const imageSchema = z.object({
  storage_path: storagePath,
  alt_text: z.string().trim().max(200, "Alt text is too long"),
  sort_order: z.number().int().min(0).max(100),
});

const variantSchema = z.object({
  size: z.string().trim().min(1, "Every size needs a name").max(20),
  color: z.string().trim().max(40),
  sku: z.string().trim().max(60),
  stock: z.number().int("Stock must be a whole number").min(0, "Stock cannot be negative").max(1000000),
});

export const productFormSchema = z
  .object({
    category_id: z.string().uuid("Choose a category"),
    name: z.string().trim().min(2, "Product name is too short").max(120, "Product name is too long"),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(140, "Slug is too long")
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
    description: z.string().trim().max(4000, "Description is too long"),
    price_naira: nairaAmount.refine(
      // Refinements still run when the regex failed, so only compare kobo
      // when the text is well formed and let the regex report the format.
      (v) => !NAIRA_AMOUNT.test(v) || nairaStringToKobo(v) > 0,
      "Price must be greater than 0"
    ),
    compare_at_price_naira: z
      .union([z.literal(""), z.string().trim().regex(NAIRA_AMOUNT, "Enter an amount in naira")])
      .optional(),
    // Status and featured are honoured for admins only; the server action
    // overrides them for partners based on require_product_approval.
    status: z.enum(PRODUCT_STATUSES).optional(),
    is_featured: z.boolean().optional(),
    variants: z.array(variantSchema).min(1, "Add at least one size").max(30),
    images: z.array(imageSchema).max(10, "A product can have at most 10 images"),
  })
  .superRefine((data, ctx) => {
    if (
      data.compare_at_price_naira &&
      NAIRA_AMOUNT.test(data.price_naira) &&
      NAIRA_AMOUNT.test(data.compare_at_price_naira)
    ) {
      const price = nairaStringToKobo(data.price_naira);
      const compareAt = nairaStringToKobo(data.compare_at_price_naira);
      if (compareAt <= price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["compare_at_price_naira"],
          message: "Compare-at price must be higher than the price",
        });
      }
    }

    // product_variants_unique_idx is (product_id, size, coalesce(color, '')).
    const seen = new Set<string>();
    data.variants.forEach((variant, index) => {
      const key = `${variant.size.toLowerCase()}|${variant.color.toLowerCase()}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", index, "size"],
          message: "Duplicate size",
        });
      }
      seen.add(key);
    });
  });

export type ProductFormInput = z.infer<typeof productFormSchema>;

// Rejection notes must not be empty; approve notes are optional.
export const approveNoteSchema = z
  .string()
  .trim()
  .max(500, "Note is too long")
  .optional()
  .or(z.literal(""));

export const rejectNoteSchema = z
  .string()
  .trim()
  .min(1, "Write a short note so the partner knows what to change")
  .max(500, "Note is too long");
