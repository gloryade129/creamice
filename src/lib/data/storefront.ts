import { createAdminClient } from "@/lib/supabase/admin";
import { publicImageUrl } from "@/lib/images";
import { demoProducts, type DemoProduct } from "@/lib/demo-data";

// Public catalogue reads. Server only: it uses the service role client so a
// renamed or newly added relation never depends on an anon RLS policy, and it
// still selects catalogue columns only (never orders, customers or payments).

export interface StorefrontVariant {
  id: string;
  size: string;
  color: string | null;
  stock: number;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: { name: string; slug: string } | null;
  priceKobo: number;
  compareAtPriceKobo: number | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  variants: StorefrontVariant[];
  images: { url: string; alt: string }[];
  isDemo: boolean;
}

export type StorefrontSort = "newest" | "price-asc" | "price-desc";

export interface StorefrontFilters {
  q?: string;
  category?: string;
  size?: string;
  minKobo?: number;
  maxKobo?: number;
  sort?: StorefrontSort;
  page?: number;
  perPage?: number;
  featuredOnly?: boolean;
}

export interface StorefrontResult {
  products: StorefrontProduct[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  usingDemo: boolean;
}

const PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  price_kobo,
  compare_at_price_kobo,
  is_featured,
  created_at,
  category:categories (name, slug),
  variants:product_variants (id, size, color, stock),
  images:product_images (storage_path, alt_text, sort_order)
`;

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_kobo: number;
  compare_at_price_kobo: number | null;
  is_featured: boolean;
  created_at: string;
  category: { name: string; slug: string } | null;
  variants: StorefrontVariant[] | null;
  images: { storage_path: string; alt_text: string; sort_order: number }[] | null;
}

function fromRow(row: ProductRow, newArrivalIds: Set<string>): StorefrontProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    priceKobo: row.price_kobo,
    compareAtPriceKobo: row.compare_at_price_kobo,
    isFeatured: row.is_featured,
    isNewArrival: newArrivalIds.has(row.id),
    variants: (row.variants ?? []).slice().sort((a, b) => a.size.localeCompare(b.size)),
    images: (row.images ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        url: publicImageUrl(image.storage_path) ?? "",
        alt: image.alt_text,
      }))
      .filter((image) => image.url.length > 0),
    isDemo: false,
  };
}

function fromDemo(row: DemoProduct): StorefrontProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    priceKobo: row.priceKobo,
    compareAtPriceKobo: row.compareAtPriceKobo,
    isFeatured: row.isFeatured,
    isNewArrival: row.isNewArrival,
    variants: row.variants,
    images: [],
    isDemo: true,
  };
}

// The preview catalogue is on by default so the storefront can be reviewed
// before the owner supplies products. Set NEXT_PUBLIC_PREVIEW_CATALOG=off on
// the live deployment to show real empty states instead.
const PREVIEW_ENABLED = process.env.NEXT_PUBLIC_PREVIEW_CATALOG !== "off";

async function readCatalogue(): Promise<{
  products: StorefrontProduct[];
  usingDemo: boolean;
}> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as unknown as ProductRow[];
    if (rows.length === 0) {
      return PREVIEW_ENABLED
        ? { products: demoProducts.map(fromDemo), usingDemo: true }
        : { products: [], usingDemo: false };
    }

    const newArrivalIds = new Set(rows.slice(0, 8).map((row) => row.id));
    return {
      products: rows.map((row) => fromRow(row, newArrivalIds)),
      usingDemo: false,
    };
  } catch {
    // Without database access the storefront still renders a complete preview
    // instead of an empty shell. The preview notice makes the state explicit.
    return PREVIEW_ENABLED
      ? { products: demoProducts.map(fromDemo), usingDemo: true }
      : { products: [], usingDemo: false };
  }
}

export async function getStorefrontProducts(
  filters: StorefrontFilters = {}
): Promise<StorefrontResult> {
  const { products, usingDemo } = await readCatalogue();

  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const perPage = Math.max(1, Math.floor(filters.perPage ?? 24));

  let result = products;

  if (filters.q) {
    const needle = filters.q.trim().toLowerCase();
    if (needle) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(needle) ||
          (product.category?.name ?? "").toLowerCase().includes(needle)
      );
    }
  }

  if (filters.category) {
    result = result.filter((product) => product.category?.slug === filters.category);
  }

  if (filters.size) {
    result = result.filter((product) =>
      product.variants.some(
        (variant) => variant.size.toLowerCase() === filters.size!.toLowerCase()
      )
    );
  }

  if (typeof filters.minKobo === "number") {
    const min = filters.minKobo;
    result = result.filter((product) => product.priceKobo >= min);
  }

  if (typeof filters.maxKobo === "number") {
    const max = filters.maxKobo;
    result = result.filter((product) => product.priceKobo <= max);
  }

  if (filters.featuredOnly) {
    result = result.filter((product) => product.isFeatured);
  }

  switch (filters.sort) {
    case "price-asc":
      result = result.slice().sort((a, b) => a.priceKobo - b.priceKobo);
      break;
    case "price-desc":
      result = result.slice().sort((a, b) => b.priceKobo - a.priceKobo);
      break;
    default:
      // The database query is already newest first; the demo list is curated.
      break;
  }

  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;

  return {
    products: result.slice(start, start + perPage),
    total,
    page: safePage,
    perPage,
    totalPages,
    usingDemo,
  };
}

export async function getStorefrontProduct(
  slug: string
): Promise<{ product: StorefrontProduct | null; related: StorefrontProduct[]; usingDemo: boolean }> {
  const { products, usingDemo } = await readCatalogue();
  const product = products.find((row) => row.slug === slug) ?? null;

  if (!product) return { product: null, related: [], usingDemo };

  const related = products
    .filter(
      (row) =>
        row.id !== product.id &&
        row.category?.slug &&
        row.category.slug === product.category?.slug
    )
    .slice(0, 4);

  return { product, related, usingDemo };
}

export async function getHomeCatalogue(): Promise<{
  newArrivals: StorefrontProduct[];
  featured: StorefrontProduct[];
  usingDemo: boolean;
}> {
  const { products, usingDemo } = await readCatalogue();

  const newArrivals = products.filter((product) => product.isNewArrival).slice(0, 8);
  const featured = products.filter((product) => product.isFeatured).slice(0, 8);

  return {
    newArrivals: newArrivals.length > 0 ? newArrivals : products.slice(0, 8),
    featured: featured.length > 0 ? featured : products.slice(0, 8),
    usingDemo,
  };
}

// The sitemap must only contain real, live products. The storefront falls
// back to demo products when the database is empty, and those preview slugs
// must never be submitted to search engines.
export async function getSitemapProducts(): Promise<
  { slug: string; updatedAt: string }[]
> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (error || !data) return [];
    return (data as { slug: string; updated_at: string }[]).map((row) => ({
      slug: row.slug,
      updatedAt: row.updated_at,
    }));
  } catch {
    return [];
  }
}

export function isSoldOut(product: StorefrontProduct): boolean {
  return product.variants.every((variant) => variant.stock <= 0);
}

export function isOnSale(product: StorefrontProduct): boolean {
  return (
    product.compareAtPriceKobo !== null &&
    product.compareAtPriceKobo > product.priceKobo
  );
}
