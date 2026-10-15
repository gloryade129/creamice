import { describe, it, expect } from "vitest";
import { productFormSchema, rejectNoteSchema } from "../validation/products";
import type { ProductFormInput } from "../validation/products";

const base: ProductFormInput = {
  category_id: "11111111-1111-4111-8111-111111111111",
  name: "Black Hoodie",
  slug: "black-hoodie",
  description: "Heavyweight fleece",
  price_naira: "25000",
  compare_at_price_naira: "",
  variants: [{ size: "M", color: "", sku: "", stock: 3 }],
  images: [{ storage_path: "product-images/a.webp", alt_text: "front", sort_order: 0 }],
};

const withField = (patch: Partial<ProductFormInput>): ProductFormInput => ({
  ...base,
  ...patch,
});

describe("productFormSchema", () => {
  it("accepts a valid payload", () => {
    expect(productFormSchema.safeParse(base).success).toBe(true);
  });

  it("requires a category", () => {
    const result = productFormSchema.safeParse(withField({ category_id: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects prices that are not plain naira amounts", () => {
    expect(productFormSchema.safeParse(withField({ price_naira: "25,000" })).success).toBe(false);
    expect(productFormSchema.safeParse(withField({ price_naira: "25000.123" })).success).toBe(false);
    expect(productFormSchema.safeParse(withField({ price_naira: "-5" })).success).toBe(false);
    expect(productFormSchema.safeParse(withField({ price_naira: "" })).success).toBe(false);
  });

  it("rejects a zero price", () => {
    expect(productFormSchema.safeParse(withField({ price_naira: "0" })).success).toBe(false);
  });

  it("rejects a compare-at price that is not above the price", () => {
    expect(
      productFormSchema.safeParse(withField({ price_naira: "25000", compare_at_price_naira: "25000" }))
        .success
    ).toBe(false);
    expect(
      productFormSchema.safeParse(withField({ price_naira: "25000", compare_at_price_naira: "20000" }))
        .success
    ).toBe(false);
  });

  it("accepts a compare-at price above the price, in kobo terms", () => {
    expect(
      productFormSchema.safeParse(withField({ price_naira: "25000.50", compare_at_price_naira: "25001" }))
        .success
    ).toBe(true);
  });

  it("rejects a slug that is not URL safe", () => {
    expect(productFormSchema.safeParse(withField({ slug: "Black Hoodie" })).success).toBe(false);
    expect(productFormSchema.safeParse(withField({ slug: "-black-hoodie" })).success).toBe(false);
  });

  it("requires at least one size", () => {
    expect(productFormSchema.safeParse(withField({ variants: [] })).success).toBe(false);
  });

  it("rejects negative or fractional stock", () => {
    expect(
      productFormSchema.safeParse(
        withField({ variants: [{ size: "M", color: "", sku: "", stock: -1 }] })
      ).success
    ).toBe(false);
    expect(
      productFormSchema.safeParse(
        withField({ variants: [{ size: "M", color: "", sku: "", stock: 1.5 }] })
      ).success
    ).toBe(false);
  });

  it("rejects duplicate sizes in the same colour", () => {
    const result = productFormSchema.safeParse(
      withField({
        variants: [
          { size: "M", color: "Black", sku: "", stock: 1 },
          { size: "M", color: "black", sku: "", stock: 2 },
        ],
      })
    );
    expect(result.success).toBe(false);
  });

  it("allows the same size in different colours", () => {
    const result = productFormSchema.safeParse(
      withField({
        variants: [
          { size: "M", color: "Black", sku: "", stock: 1 },
          { size: "M", color: "White", sku: "", stock: 2 },
        ],
      })
    );
    expect(result.success).toBe(true);
  });

  it("rejects image paths that escape the storage folder", () => {
    expect(
      productFormSchema.safeParse(
        withField({ images: [{ storage_path: "../secrets.webp", alt_text: "", sort_order: 0 }] })
      ).success
    ).toBe(false);
    expect(
      productFormSchema.safeParse(
        withField({ images: [{ storage_path: "/etc/passwd", alt_text: "", sort_order: 0 }] })
      ).success
    ).toBe(false);
  });

  it("rejects more than 10 images", () => {
    const images = Array.from({ length: 11 }, (_, i) => ({
      storage_path: `product-images/${i}.webp`,
      alt_text: "",
      sort_order: i,
    }));
    expect(productFormSchema.safeParse(withField({ images })).success).toBe(false);
  });

  it("only accepts known statuses", () => {
    expect(
      productFormSchema.safeParse(withField({ status: "live" as ProductFormInput["status"] }))
        .success
    ).toBe(false);
    expect(productFormSchema.safeParse(withField({ status: "active" })).success).toBe(true);
  });
});

describe("rejectNoteSchema", () => {
  it("requires a note", () => {
    expect(rejectNoteSchema.safeParse("").success).toBe(false);
    expect(rejectNoteSchema.safeParse("   ").success).toBe(false);
  });

  it("trims and accepts a short note", () => {
    const result = rejectNoteSchema.safeParse("  Fix the price  ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("Fix the price");
  });

  it("rejects a note that is too long", () => {
    expect(rejectNoteSchema.safeParse("x".repeat(501)).success).toBe(false);
  });
});
