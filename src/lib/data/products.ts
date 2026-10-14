import { createAdminClient } from "@/lib/supabase/admin";

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
  pending_changes: Record<string, unknown> | null;
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

export async function getProducts(filters?: { status?: string; category_id?: string }) {
  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select(`
      *,
      category:categories (id, name, slug),
      variants:product_variants (id, size, color, sku, stock),
      images:product_images (id, storage_path, alt_text, sort_order)
    `)
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
    .select(`
      *,
      category:categories (id, name, slug),
      variants:product_variants (id, size, color, sku, stock),
      images:product_images (id, storage_path, alt_text, sort_order)
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
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
  variants: { size: string; color?: string; sku?: string; stock: number }[];
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
      .insert(input.variants.map((v) => ({ ...v, product_id: product.id })));
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

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id" | "created_at" | "created_by">>
) {
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

export async function deleteProduct(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}