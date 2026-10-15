"use server";

import { requireRole } from "@/lib/auth/session";
import { nairaStringToKobo } from "@/lib/money";
import { generateSlug } from "@/lib/utils";
import { getStoreSettings } from "@/lib/data/settings";
import {
  createProduct,
  getProduct,
  submitForApproval,
  submitPendingChanges,
  syncProductImages,
  syncProductVariants,
  updateProduct,
} from "@/lib/data/products";
import type { Product, ProductUpdate } from "@/lib/data/products";
import {
  decideUpdate,
  fieldsChanged,
  imagesChanged,
} from "@/lib/product-approval";
import type { PendingImage, PendingProductChanges } from "@/lib/product-approval";
import { productFormSchema } from "@/lib/validation/products";
import type { ProductFormInput } from "@/lib/validation/products";

// Product create/update as server actions: role check, zod, then money
// conversion on the server. The client only ever sends naira text.

export type SaveResult =
  | { ok: true; id: string; pending: boolean }
  | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firstIssue(error: { issues: { path: (string | number)[]; message: string }[] }): string {
  const issue = error.issues[0];
  if (!issue) return "Check the form and try again";
  const field = issue.path.join(".");
  return field ? `${field}: ${issue.message}` : issue.message;
}

// Never show SQL or driver text to a user; log it instead.
function describeDbError(err: unknown, fallback: string): string {
  const code = typeof err === "object" && err !== null && "code" in err
    ? String((err as { code?: unknown }).code)
    : "";
  const details = typeof err === "object" && err !== null && "details" in err
    ? String((err as { details?: unknown }).details ?? "")
    : "";

  if (code === "23505") {
    if (details.includes("slug")) return "That slug is already used by another product.";
    if (details.includes("sku")) return "That SKU is already used by another size.";
    return "That value is already in use.";
  }
  console.error("Product save failed:", err);
  return fallback;
}

interface ResolvedInput {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price_kobo: number;
  compare_at_price_kobo: number | null;
  variants: { size: string; color: string; sku: string; stock: number }[];
  images: PendingImage[];
  status?: Product["status"];
  is_featured?: boolean;
}

function resolve(input: ProductFormInput): ResolvedInput | { error: string } {
  const slug = input.slug || generateSlug(input.name);
  if (!slug) {
    return { error: "Add letters or numbers to the product name so a slug can be made" };
  }

  return {
    category_id: input.category_id,
    name: input.name,
    slug,
    description: input.description,
    price_kobo: nairaStringToKobo(input.price_naira),
    compare_at_price_kobo: input.compare_at_price_naira
      ? nairaStringToKobo(input.compare_at_price_naira)
      : null,
    variants: input.variants.map((variant) => ({
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      stock: variant.stock,
    })),
    images: input.images.map((image, index) => ({
      storage_path: image.storage_path,
      alt_text: image.alt_text,
      sort_order: index,
    })),
    status: input.status,
    is_featured: input.is_featured,
  };
}

export async function createProductAction(input: ProductFormInput): Promise<SaveResult> {
  const user = await requireRole(["admin", "partner"]);

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const values = resolve(parsed.data);
  if ("error" in values) return { ok: false, error: values.error };

  const settings = await getStoreSettings();
  const isAdmin = user.role === "admin";

  // Assumption (logged in PROGRESS): with approval off, a partner's product
  // goes straight to active; admins keep the status they pick.
  const status: Product["status"] = isAdmin
    ? (values.status ?? "draft")
    : settings.require_product_approval
      ? "pending_approval"
      : "active";
  const is_featured = isAdmin ? (values.is_featured ?? false) : false;

  try {
    const product = await createProduct({
      category_id: values.category_id,
      name: values.name,
      slug: values.slug,
      description: values.description,
      price_kobo: values.price_kobo,
      compare_at_price_kobo: values.compare_at_price_kobo,
      status,
      is_featured,
      created_by: user.id,
      variants: values.variants,
      images: values.images,
    });

    return { ok: true, id: product.id, pending: status === "pending_approval" };
  } catch (err) {
    return { ok: false, error: describeDbError(err, "Could not create the product. Try again.") };
  }
}

export async function updateProductAction(
  id: string,
  input: ProductFormInput
): Promise<SaveResult> {
  const user = await requireRole(["admin", "partner"]);
  if (!UUID.test(id)) return { ok: false, error: "Product not found" };

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const values = resolve(parsed.data);
  if ("error" in values) return { ok: false, error: values.error };

  const current = await getProduct(id);
  if (!current) return { ok: false, error: "Product not found" };

  const settings = await getStoreSettings();
  const isAdmin = user.role === "admin";

  const nextFields = {
    category_id: values.category_id,
    name: values.name,
    slug: values.slug,
    description: values.description,
    price_kobo: values.price_kobo,
    compare_at_price_kobo: values.compare_at_price_kobo,
  };
  const currentImages: PendingImage[] = (current.images ?? []).map((image) => ({
    storage_path: image.storage_path,
    alt_text: image.alt_text,
    sort_order: image.sort_order,
  }));
  const contentChanged =
    fieldsChanged(current, nextFields) || imagesChanged(currentImages, values.images);

  const decision = decideUpdate({
    isEditorAdmin: isAdmin,
    approvalRequired: settings.require_product_approval,
    currentStatus: current.status,
    contentChanged,
  });

  try {
    // Live product, gated content: variants and stock apply now, the rest waits.
    if (decision === "pending") {
      await syncProductVariants(id, values.variants);
      const changes: PendingProductChanges = {
        fields: nextFields,
        images: values.images,
      };
      await submitPendingChanges({
        product_id: id,
        submitted_by: user.id,
        changes,
      });
      return { ok: true, id, pending: true };
    }

    const patch: ProductUpdate = { ...nextFields };

    if (isAdmin) {
      if (values.status) patch.status = values.status;
      patch.is_featured = values.is_featured ?? false;
    } else if (
      !settings.require_product_approval &&
      (current.status === "draft" || current.status === "pending_approval")
    ) {
      patch.status = "active";
      patch.review_note = null;
    }

    const finalStatus = patch.status ?? current.status;
    if (!isAdmin && finalStatus === "pending_approval") {
      patch.pending_submitted_by = user.id;
      patch.pending_submitted_at = new Date().toISOString();
    }

    await updateProduct(id, patch);
    await syncProductImages(id, values.images);
    await syncProductVariants(id, values.variants);

    // A rejected draft that the partner edited again rejoins the queue.
    if (decision === "direct-and-resubmit") {
      await submitForApproval({ product_id: id, submitted_by: user.id });
      return { ok: true, id, pending: true };
    }

    return { ok: true, id, pending: false };
  } catch (err) {
    return { ok: false, error: describeDbError(err, "Could not save the product. Try again.") };
  }
}
