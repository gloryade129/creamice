import { formatNaira } from "@/lib/money";

// Business rules for product approval (PRD 6.2, decision D-7).
// Pure functions only: no database, no framework. Tested in __tests__/approval.test.ts.

export type ProductRowStatus = "draft" | "pending_approval" | "active" | "upcoming" | "archived";

export interface ProductCoreFields {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price_kobo: number;
  compare_at_price_kobo: number | null;
}

export interface PendingImage {
  storage_path: string;
  alt_text: string;
  sort_order: number;
}

// What a partner submitted that is waiting for admin review. Only set on a
// live (active) product; the live row keeps its own values until approval.
// Images are included because PRD 6.2 puts images under approval. Variants
// and stock are NOT included: stock and size changes apply immediately
// (PRD 6.2 only gates name, price, description, images, category).
export interface PendingProductChanges {
  fields: ProductCoreFields;
  images: PendingImage[];
}

export interface ProductCoreForCompare {
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  price_kobo: number;
  compare_at_price_kobo: number | null;
}

function normalizeImages(images: PendingImage[]): string {
  return [...images]
    .map((img) => `${img.storage_path} ${img.alt_text} ${img.sort_order}`)
    .sort()
    .join("|");
}

export function fieldsChanged(
  current: ProductCoreForCompare,
  next: ProductCoreFields
): boolean {
  return (
    (current.category_id ?? "") !== next.category_id ||
    current.name !== next.name ||
    current.slug !== next.slug ||
    current.description !== next.description ||
    current.price_kobo !== next.price_kobo ||
    (current.compare_at_price_kobo ?? null) !== next.compare_at_price_kobo
  );
}

// Reorders count as a change: sort_order is part of the submitted state.
export function imagesChanged(current: PendingImage[], next: PendingImage[]): boolean {
  return normalizeImages(current) !== normalizeImages(next);
}

export type UpdateDecision =
  /** Apply everything now; live values change immediately. */
  | "direct"
  /** Live product with gated content changes: store in pending_changes, apply variants/stock now. */
  | "pending"
  /** Draft product: apply now and put it back in the approval queue. */
  | "direct-and-resubmit";

export interface UpdateInput {
  isEditorAdmin: boolean;
  approvalRequired: boolean;
  currentStatus: ProductRowStatus;
  contentChanged: boolean;
}

export function decideUpdate(input: UpdateInput): UpdateDecision {
  const partnerNeedsApproval = !input.isEditorAdmin && input.approvalRequired;

  if (!partnerNeedsApproval) return "direct";
  // Live product: gated content waits for an admin. A stock-only edit has
  // contentChanged === false and falls through to "direct".
  if (input.currentStatus === "active" && input.contentChanged) return "pending";
  // A rejected (draft) product is being resubmitted by the partner.
  if (input.currentStatus === "draft") return "direct-and-resubmit";
  // pending_approval, upcoming, archived: product is not live, edit in place.
  return "direct";
}

export interface DescriptionEntry {
  label: string;
  from: string;
  to: string;
}

// Readable old -> new list of what a pending submission changes, shown to the
// admin on the approval queue and the product edit page.
export function describePendingChanges(
  current: ProductCoreForCompare,
  pending: PendingProductChanges,
  currentImageCount: number
): DescriptionEntry[] {
  const out: DescriptionEntry[] = [];
  const f = pending.fields;

  if (current.name !== f.name) out.push({ label: "Name", from: current.name, to: f.name });
  if (current.slug !== f.slug) out.push({ label: "Slug", from: current.slug, to: f.slug });
  if (current.description !== f.description)
    out.push({ label: "Description", from: "edited", to: "edited" });
  if (current.price_kobo !== f.price_kobo)
    out.push({
      label: "Price",
      from: formatNaira(current.price_kobo),
      to: formatNaira(f.price_kobo),
    });
  if ((current.compare_at_price_kobo ?? null) !== f.compare_at_price_kobo)
    out.push({
      label: "Compare-at price",
      from: current.compare_at_price_kobo ? formatNaira(current.compare_at_price_kobo) : "none",
      to: f.compare_at_price_kobo ? formatNaira(f.compare_at_price_kobo) : "none",
    });
  if (currentImageCount !== pending.images.length)
    out.push({ label: "Images", from: `${currentImageCount}`, to: `${pending.images.length}` });

  return out;
}
