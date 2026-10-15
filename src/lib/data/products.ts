import { createAdminClient } from "@/lib/supabase/admin";
import type { PendingImage, PendingProductChanges } from "@/lib/product-approval";

// Server-side product data access only. Nothing in here may be imported from a
// client component: createAdminClient carries the service role key.

const IMAGE_BUCKET = "product-images";

const PRODUCT_SELECT = `
  *,
  category:categories (id, name, slug),
  variants:product_variants (id, size, color, sku, stock),
  images:product_images (id, storage_path, alt_text, sort_order)
`;

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string | null;
  sku: string | null;
  stock: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  price_kobo: number;
  compare_at_price_kobo: number | null;
  status: "draft" | "pending_approval" | "active" | "upcoming" | "archived";
  is_featured: boolean;
  pending_changes: PendingProductChanges | null;
  pending_submitted_by: string | null;
  pending_submitted_at: string | null;
  review_note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
  images?: ProductImage[];
  category?: { id: string; name: string; slug: string };
}

// Only real table columns, so callers cannot spread relation data into an
// UPDATE by accident.
export interface ProductUpdate {
  category_id?: string | null;
  name?: string;
  slug?: string;
  description?: string;
  price_kobo?: number;
  compare_at_price_kobo?: number | null;
  status?: Product["status"];
  is_featured?: boolean;
  pending_changes?: PendingProductChanges | null;
  pending_submitted_by?: string | null;
  pending_submitted_at?: string | null;
  review_note?: string | null;
}

export interface VariantInput {
  size: string;
  color: string;
  sku: string;
  stock: number;
}

type Supabase = ReturnType<typeof createAdminClient>;

export async function getProducts(filters?: { status?: string; category_id?: string }) {
  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.category_id) {
    query = query.eq("category_id", filters.category_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

// New submissions (status) plus live products with partner edits waiting (jsonb).
export async function getApprovalQueue(): Promise<Product[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .or("status.eq.pending_approval,pending_changes.not.is.null")
    .order("pending_submitted_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

// Names for the approval queue. Missing profiles just show as unknown rather
// than breaking the page.
export async function getProfileNames(
  ids: Array<string | null | undefined>
): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return {};

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);
  if (error || !data) return {};

  const names: Record<string, string> = {};
  for (const profile of data) names[profile.id] = profile.full_name;
  return names;
}

export async function createProduct(input: {
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  price_kobo: number;
  compare_at_price_kobo: number | null;
  status: Product["status"];
  is_featured: boolean;
  created_by: string;
  variants: VariantInput[];
  images: { storage_path: string; alt_text: string; sort_order: number }[];
}) {
  const supabase = createAdminClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      category_id: input.category_id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      price_kobo: input.price_kobo,
      compare_at_price_kobo: input.compare_at_price_kobo,
      status: input.status,
      is_featured: input.is_featured,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (productError) throw productError;

  if (input.variants.length > 0) {
    const { error: variantsError } = await supabase
      .from("product_variants")
      .insert(
        input.variants.map((v) => ({
          product_id: product.id,
          size: v.size,
          color: v.color || null,
          sku: v.sku || null,
          stock: v.stock,
        }))
      );
    if (variantsError) throw variantsError;
  }

  if (input.images.length > 0) {
    const { error: imagesError } = await supabase
      .from("product_images")
      .insert(input.images.map((img) => ({ ...img, product_id: product.id })));
    if (imagesError) throw imagesError;
  }

  return product;
}

export async function updateProduct(id: string, updates: ProductUpdate) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Partner creates a new product for review: the row itself is the proposal.
export async function submitForApproval(input: {
  product_id: string;
  submitted_by: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({
      status: "pending_approval",
      pending_changes: null,
      pending_submitted_by: input.submitted_by,
      pending_submitted_at: new Date().toISOString(),
      review_note: null,
    })
    .eq("id", input.product_id);

  if (error) throw error;
}

// Partner edits a live product: gated content waits, the live row keeps its
// values (PRD 6.2). Stock and variants were already applied by the caller.
export async function submitPendingChanges(input: {
  product_id: string;
  submitted_by: string;
  changes: PendingProductChanges;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({
      pending_changes: input.changes,
      pending_submitted_by: input.submitted_by,
      pending_submitted_at: new Date().toISOString(),
      review_note: null,
    })
    .eq("id", input.product_id);

  if (error) throw error;
}

// Apply a product's image list: add new rows, reorder and re-alt existing ones,
// drop rows that are gone. Storage objects are only deleted after the database
// succeeds, and only for paths that belonged to this product.
export async function syncProductImages(
  productId: string,
  next: PendingImage[]
): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing, error: readError } = await supabase
    .from("product_images")
    .select("id, storage_path, alt_text, sort_order")
    .eq("product_id", productId)
    .order("sort_order");
  if (readError) throw readError;

  const current = existing ?? [];
  const wanted = new Set(next.map((image) => image.storage_path));
  const removed = current.filter((row) => !wanted.has(row.storage_path));

  if (removed.length > 0) {
    const { error } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", productId)
      .in(
        "id",
        removed.map((row) => row.id)
      );
    if (error) throw error;
  }

  for (let index = 0; index < next.length; index++) {
    const image = next[index];
    const match = current.find((row) => row.storage_path === image.storage_path);

    if (match) {
      if (match.alt_text !== image.alt_text || match.sort_order !== index) {
        const { error } = await supabase
          .from("product_images")
          .update({ alt_text: image.alt_text, sort_order: index })
          .eq("id", match.id);
        if (error) throw error;
      }
    } else {
      const { error } = await supabase.from("product_images").insert({
        product_id: productId,
        storage_path: image.storage_path,
        alt_text: image.alt_text,
        sort_order: index,
      });
      if (error) throw error;
    }
  }

  await removeStorageObjects(removed.map((row) => row.storage_path));
}

// Replace a product's sizes. New sizes are added, changed stock is written
// straight away (PRD 6.2: stock never waits for approval), sizes taken out of
// the form are deleted; order_items.variant_id then reads as null, which the
// schema allows.
export async function syncProductVariants(
  productId: string,
  next: VariantInput[]
): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing, error: readError } = await supabase
    .from("product_variants")
    .select("id, size, color, sku, stock")
    .eq("product_id", productId);
  if (readError) throw readError;

  const current = existing ?? [];
  const key = (size: string, color: string | null) =>
    `${size.toLowerCase()}|${(color ?? "").toLowerCase()}`;
  const remaining = new Map(current.map((row) => [key(row.size, row.color), row]));

  for (const variant of next) {
    const match = remaining.get(key(variant.size, variant.color));
    if (match) {
      remaining.delete(key(variant.size, variant.color));
      const color = variant.color || null;
      const sku = variant.sku || null;
      if (match.stock !== variant.stock || match.color !== color || match.sku !== sku) {
        const { error } = await supabase
          .from("product_variants")
          .update({ stock: variant.stock, color, sku })
          .eq("id", match.id);
        if (error) throw error;
      }
    } else {
      const { error } = await supabase.from("product_variants").insert({
        product_id: productId,
        size: variant.size,
        color: variant.color || null,
        sku: variant.sku || null,
        stock: variant.stock,
      });
      if (error) throw error;
    }
  }

  const gone = [...remaining.values()];
  if (gone.length > 0) {
    const { error } = await supabase
      .from("product_variants")
      .delete()
      .in(
        "id",
        gone.map((row) => row.id)
      );
    if (error) throw error;
  }
}

export async function approveProduct(input: {
  product_id: string;
  admin_id: string;
  review_note?: string;
}): Promise<void> {
  const supabase = createAdminClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("status, pending_changes, images:product_images (storage_path)")
    .eq("id", input.product_id)
    .single();
  if (error) throw error;
  if (!product) throw new Error("Product not found");

  const note = input.review_note?.trim() || null;

  // A live product with a partner edit: sync images first (idempotent), then
  // apply the stored fields and clear pending in one update. If either step
  // fails the submission stays in the queue, so approving again converges
  // instead of leaving a half-applied result.
  if (product.pending_changes) {
    const pending = product.pending_changes as unknown as PendingProductChanges;
    const fields = pending.fields;

    await syncProductImages(input.product_id, pending.images ?? []);

    const { error: fieldError } = await supabase
      .from("products")
      .update({
        category_id: fields.category_id || null,
        name: fields.name,
        slug: fields.slug,
        description: fields.description,
        price_kobo: fields.price_kobo,
        compare_at_price_kobo: fields.compare_at_price_kobo,
        pending_changes: null,
        pending_submitted_by: null,
        pending_submitted_at: null,
        review_note: note,
      })
      .eq("id", input.product_id);
    if (fieldError) throw fieldError;

    return;
  }

  // A brand new submission: the row already holds the proposal, just go live.
  if (product.status === "pending_approval") {
    const { error: statusError } = await supabase
      .from("products")
      .update({
        status: "active",
        pending_submitted_by: null,
        pending_submitted_at: null,
        review_note: note,
      })
      .eq("id", input.product_id);
    if (statusError) throw statusError;
    return;
  }

  throw new Error("Nothing to approve for this product");
}

export async function rejectProduct(input: {
  product_id: string;
  admin_id: string;
  review_note: string;
}): Promise<void> {
  const note = input.review_note.trim();
  if (!note) throw new Error("A rejection note is required");

  const supabase = createAdminClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("status, pending_changes, images:product_images (storage_path)")
    .eq("id", input.product_id)
    .single();
  if (error) throw error;
  if (!product) throw new Error("Product not found");

  // Live product: throw the edit away, the live row and its images stay put.
  if (product.pending_changes) {
    const pending = product.pending_changes as unknown as PendingProductChanges;
    const livePaths = new Set(
      ((product.images ?? []) as { storage_path: string }[]).map((img) => img.storage_path)
    );
    const { error: clearError } = await supabase
      .from("products")
      .update({
        pending_changes: null,
        pending_submitted_by: null,
        pending_submitted_at: null,
        review_note: note,
      })
      .eq("id", input.product_id);
    if (clearError) throw clearError;

    // Clean up uploads that only existed for the rejected edit.
    const orphanPaths = (pending.images ?? [])
      .map((image) => image.storage_path)
      .filter((path) => !livePaths.has(path));
    await removeStorageObjects(orphanPaths);
    return;
  }

  // New submission: send it back to draft with the note for the partner.
  if (product.status === "pending_approval") {
    const { error: revertError } = await supabase
      .from("products")
      .update({
        status: "draft",
        pending_changes: null,
        pending_submitted_by: null,
        pending_submitted_at: null,
        review_note: note,
      })
      .eq("id", input.product_id);
    if (revertError) throw revertError;
    return;
  }

  throw new Error("Nothing to reject for this product");
}

// Archive is admin only (PRD 6.3). Any partner edit waiting on this product
// goes with it, and uploads that only existed for that edit are cleaned up,
// so the approval queue never keeps an archived item forever.
export async function archiveProduct(productId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("pending_changes, images:product_images (storage_path)")
    .eq("id", productId)
    .single();
  if (error) throw error;
  if (!product) throw new Error("Product not found");

  const { error: updateError } = await supabase
    .from("products")
    .update({
      status: "archived",
      pending_changes: null,
      pending_submitted_by: null,
      pending_submitted_at: null,
    })
    .eq("id", productId);
  if (updateError) throw updateError;

  if (product.pending_changes) {
    const pending = product.pending_changes as unknown as PendingProductChanges;
    const livePaths = new Set(
      ((product.images ?? []) as { storage_path: string }[]).map((img) => img.storage_path)
    );
    await removeStorageObjects(
      (pending.images ?? [])
        .map((image) => image.storage_path)
        .filter((path) => !livePaths.has(path))
    );
  }
}

// Best effort: a file we failed to delete is harmless clutter, a file deleted
// before the database commit would break the storefront.
async function removeStorageObjects(paths: string[]): Promise<void> {
  const targets = paths.filter((path) => path.startsWith(`${IMAGE_BUCKET}/`));
  if (targets.length === 0) return;

  try {
    const supabase: Supabase = createAdminClient();
    await supabase.storage.from(IMAGE_BUCKET).remove(targets);
  } catch (err) {
    console.error("Failed to clean up storage objects:", err);
  }
}
