import { describe, it, expect } from "vitest";
import {
  fieldsChanged,
  imagesChanged,
  decideUpdate,
  describePendingChanges,
  type PendingImage,
  type PendingProductChanges,
  type ProductCoreForCompare,
  type ProductRowStatus,
} from "../product-approval";

const current: ProductCoreForCompare = {
  category_id: "cat-1",
  name: "Black Hoodie",
  slug: "black-hoodie",
  description: "Heavyweight fleece",
  price_kobo: 2500000,
  compare_at_price_kobo: 3000000,
};

const next = {
  category_id: "cat-1",
  name: "Black Hoodie",
  slug: "black-hoodie",
  description: "Heavyweight fleece",
  price_kobo: 2500000,
  compare_at_price_kobo: 3000000,
};

const images: PendingImage[] = [
  { storage_path: "product-images/a.webp", alt_text: "front", sort_order: 0 },
  { storage_path: "product-images/b.webp", alt_text: "back", sort_order: 1 },
];

describe("fieldsChanged", () => {
  it("returns false when nothing changed", () => {
    expect(fieldsChanged(current, next)).toBe(false);
  });

  it("treats a null category as an empty category", () => {
    expect(fieldsChanged({ ...current, category_id: null }, { ...next, category_id: "" })).toBe(false);
  });

  it("detects a name change", () => {
    expect(fieldsChanged(current, { ...next, name: "Cream Hoodie" })).toBe(true);
  });

  it("detects a slug change", () => {
    expect(fieldsChanged(current, { ...next, slug: "cream-hoodie" })).toBe(true);
  });

  it("detects a price change", () => {
    expect(fieldsChanged(current, { ...next, price_kobo: 2600000 })).toBe(true);
  });

  it("detects clearing the compare-at price", () => {
    expect(fieldsChanged(current, { ...next, compare_at_price_kobo: null })).toBe(true);
  });

  it("detects a description change", () => {
    expect(fieldsChanged(current, { ...next, description: "New copy" })).toBe(true);
  });

  it("detects a category change", () => {
    expect(fieldsChanged(current, { ...next, category_id: "cat-2" })).toBe(true);
  });
});

describe("imagesChanged", () => {
  it("returns false for the same images", () => {
    expect(imagesChanged(images, [...images])).toBe(false);
  });

  it("detects a reorder", () => {
    const reordered = [images[1], images[0]].map((img, i) => ({ ...img, sort_order: i }));
    expect(imagesChanged(images, reordered)).toBe(true);
  });

  it("detects an alt text change", () => {
    const changed = images.map((img, i) => (i === 0 ? { ...img, alt_text: "side" } : img));
    expect(imagesChanged(images, changed)).toBe(true);
  });

  it("detects an added image", () => {
    const added = [...images, { storage_path: "product-images/c.webp", alt_text: "", sort_order: 2 }];
    expect(imagesChanged(images, added)).toBe(true);
  });

  it("detects a removed image", () => {
    expect(imagesChanged(images, [images[0]])).toBe(true);
  });
});

describe("decideUpdate", () => {
  const run = (
    isEditorAdmin: boolean,
    approvalRequired: boolean,
    currentStatus: ProductRowStatus,
    contentChanged: boolean
  ) => decideUpdate({ isEditorAdmin, approvalRequired, currentStatus, contentChanged });

  it("applies admin edits directly even on a live product", () => {
    expect(run(true, true, "active", true)).toBe("direct");
  });

  it("applies partner edits directly when approval is off", () => {
    expect(run(false, false, "active", true)).toBe("direct");
  });

  it("stores partner edits to a live product as pending", () => {
    expect(run(false, true, "active", true)).toBe("pending");
  });

  it("applies a stock-only partner edit to a live product immediately", () => {
    expect(run(false, true, "active", false)).toBe("direct");
  });

  it("applies and resubmits an edit to a draft", () => {
    expect(run(false, true, "draft", true)).toBe("direct-and-resubmit");
    expect(run(false, true, "draft", false)).toBe("direct-and-resubmit");
  });

  it("edits a product already awaiting approval in place", () => {
    expect(run(false, true, "pending_approval", true)).toBe("direct");
  });

  it("edits upcoming and archived products in place", () => {
    expect(run(false, true, "upcoming", true)).toBe("direct");
    expect(run(false, true, "archived", true)).toBe("direct");
  });

  it("lets an admin resubmit nothing - draft stays a direct edit for admins", () => {
    expect(run(true, true, "draft", true)).toBe("direct");
  });
});

describe("describePendingChanges", () => {
  const pending: PendingProductChanges = {
    fields: { ...next, name: "Cream Hoodie", price_kobo: 2600000, compare_at_price_kobo: null },
    images,
  };

  it("lists the fields that differ", () => {
    const entries = describePendingChanges(current, pending, 2);
    const labels = entries.map((e) => e.label);
    expect(labels).toContain("Name");
    expect(labels).toContain("Price");
    expect(labels).toContain("Compare-at price");
    expect(labels).not.toContain("Slug");
    expect(labels).not.toContain("Images");
  });

  it("formats money for display only", () => {
    const entries = describePendingChanges(current, pending, 2);
    const price = entries.find((e) => e.label === "Price");
    expect(price?.from).toContain("25,000");
    expect(price?.to).toContain("26,000");
  });

  it("reports an image count change", () => {
    const entries = describePendingChanges(current, { ...pending, fields: next }, 1);
    expect(entries.map((e) => e.label)).toContain("Images");
  });

  it("returns an empty list when nothing changed", () => {
    const unchanged: PendingProductChanges = { fields: next, images };
    expect(describePendingChanges(current, unchanged, 2)).toEqual([]);
  });
});
