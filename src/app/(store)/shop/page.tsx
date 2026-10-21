import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { getCategories } from "@/lib/data/categories";
import { fallbackCategories } from "@/lib/demo-data";
import {
  getStorefrontProducts,
  type StorefrontSort,
} from "@/lib/data/storefront";
import { ProductCard } from "@/components/store/ProductCard";
import { PreviewNotice } from "@/components/store/SectionHeading";
import { SortSelect } from "@/components/store/SortSelect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop Creamice hoodies, sweatshirts, joggers, sweatpants and more.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toKobo(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const naira = Number(value);
  if (!Number.isFinite(naira) || naira < 0) return undefined;
  return Math.round(naira * 100);
}

function buildQuery(
  params: Record<string, string | undefined>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  return search.toString();
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;

  const q = first(resolved.q)?.trim() || "";
  const category = first(resolved.category) || "";
  const size = first(resolved.size) || "";
  const sort = (first(resolved.sort) || "newest") as StorefrontSort;
  const page = Number(first(resolved.page) || "1") || 1;
  const featuredOnly = first(resolved.featured) === "true";
  const minNaira = first(resolved.min) || "";
  const maxNaira = first(resolved.max) || "";

  const minKobo = toKobo(minNaira);
  const maxKobo = toKobo(maxNaira);

  let categories: { name: string; slug: string }[] = fallbackCategories;
  try {
    const rows = await getCategories();
    if (rows.length > 0) {
      categories = rows.map((row) => ({ name: row.name, slug: row.slug }));
    }
  } catch {
    categories = fallbackCategories;
  }

  const result = await getStorefrontProducts({
    q,
    category,
    size,
    minKobo,
    maxKobo,
    sort,
    page,
    featuredOnly,
    perPage: 24,
  });

  const activeCategory = categories.find((row) => row.slug === category);
  const heading = activeCategory
    ? activeCategory.name
    : q
      ? `Results for “${q}”`
      : featuredOnly
        ? "Featured pieces"
        : "All products";

  const baseQuery = buildQuery({
    q: q || undefined,
    category: category || undefined,
    size: size || undefined,
    featured: featuredOnly ? "true" : undefined,
    min: minNaira || undefined,
    max: maxNaira || undefined,
  });

  const pageQuery = (target: number) => {
    const params = new URLSearchParams(baseQuery);
    if (sort !== "newest") params.set("sort", sort);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/shop?${query}` : "/shop";
  };

  return (
    <div>
      {result.usingDemo && <PreviewNotice />}

      <div className="border-b border-border bg-charcoal">
        <div className="container-page py-7 md:py-10">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-muted">
            <Link href="/" className="transition-colors hover:text-offwhite">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-offwhite">Shop</span>
            {activeCategory && (
              <>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-offwhite">{activeCategory.name}</span>
              </>
            )}
          </nav>

          <h1 className="font-oswald text-[30px] font-semibold uppercase tracking-[0.02em] text-offwhite md:text-[40px]">
            {heading}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {result.total} {result.total === 1 ? "product" : "products"}
            {q ? " matching your search" : ""}
          </p>
        </div>
      </div>

      <div className="container-page py-8 md:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Filters: inline on desktop, collapsed on mobile. */}
          <aside className="lg:w-[248px] lg:shrink-0">
            <details className="group rounded-xl border border-border bg-surface lg:hidden">
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-semibold text-offwhite">
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filters
                </span>
                <span className="text-xs font-normal text-muted group-open:hidden">
                  {result.total} products
                </span>
                <span className="hidden text-xs font-normal text-muted group-open:inline">
                  Close
                </span>
              </summary>
              <div className="border-t border-border p-4">
                <FilterForm
                  categories={categories}
                  q={q}
                  category={category}
                  size={size}
                  minNaira={minNaira}
                  maxNaira={maxNaira}
                  sort={sort}
                  featured={featuredOnly}
                />
              </div>
            </details>

            <div className="hidden lg:block">
              <h2 className="mb-4 font-montserrat text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Filters
              </h2>
              <FilterForm
                categories={categories}
                q={q}
                category={category}
                size={size}
                minNaira={minNaira}
                maxNaira={maxNaira}
                sort={sort}
                featured={featuredOnly}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
              <p className="hidden text-sm text-muted sm:block">
                Showing {result.products.length} of {result.total}
              </p>
              <div className="ml-auto">
                <SortSelect value={sort} baseQuery={baseQuery} />
              </div>
            </div>

            {result.products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-strong bg-charcoal px-6 py-16 text-center">
                <h2 className="font-montserrat text-lg font-semibold text-offwhite">
                  No products match these filters
                </h2>
                <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted">
                  Try a different category, size or price range. New pieces are
                  added regularly.
                </p>
                <Link
                  href="/shop"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#121212] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2b2b2b]"
                >
                  Clear filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {result.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {result.totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-10 flex items-center justify-center gap-2"
              >
                {Array.from({ length: result.totalPages }, (_, index) => index + 1).map(
                  (target) => (
                    <Link
                      key={target}
                      href={pageQuery(target)}
                      aria-current={target === result.page ? "page" : undefined}
                      className={
                        target === result.page
                          ? "inline-flex h-10 min-w-10 items-center justify-center rounded-lg bg-offwhite px-3 text-sm font-semibold text-jet"
                          : "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border border-border px-3 text-sm text-offwhite transition-colors hover:border-offwhite"
                      }
                    >
                      {target}
                    </Link>
                  )
                )}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterForm({
  categories,
  q,
  category,
  size,
  minNaira,
  maxNaira,
  sort,
  featured,
}: {
  categories: { name: string; slug: string }[];
  q: string;
  category: string;
  size: string;
  minNaira: string;
  maxNaira: string;
  sort: StorefrontSort;
  featured: boolean;
}) {
  return (
    <form action="/shop" method="get" className="space-y-6">
      {q && <input type="hidden" name="q" value={q} />}
      {featured && <input type="hidden" name="featured" value="true" />}
      {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-offwhite">
          Category
        </legend>
        <label className="flex min-h-[36px] items-center gap-2 text-sm text-muted">
          <input
            type="radio"
            name="category"
            value=""
            defaultChecked={!category}
            className="h-4 w-4 accent-[#121212]"
          />
          All categories
        </label>
        {categories.map((row) => (
          <label
            key={row.slug}
            className="flex min-h-[36px] items-center gap-2 text-sm text-muted"
          >
            <input
              type="radio"
              name="category"
              value={row.slug}
              defaultChecked={category === row.slug}
              className="h-4 w-4 accent-[#121212]"
            />
            {row.name}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-offwhite">
          Size
        </legend>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer">
            <input
              type="radio"
              name="size"
              value=""
              defaultChecked={!size}
              className="peer sr-only"
            />
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-muted transition-colors peer-checked:border-offwhite peer-checked:bg-offwhite peer-checked:text-jet">
              Any
            </span>
          </label>
          {["S", "M", "L", "XL"].map((label) => (
            <label key={label} className="cursor-pointer">
              <input
                type="radio"
                name="size"
                value={label}
                defaultChecked={size.toLowerCase() === label.toLowerCase()}
                className="peer sr-only"
              />
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-muted transition-colors peer-checked:border-offwhite peer-checked:bg-offwhite peer-checked:text-jet">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-offwhite">
          Price (₦)
        </legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="min"
            min="0"
            step="1000"
            placeholder="Min"
            defaultValue={minNaira}
            className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-offwhite placeholder:text-muted focus:border-gold focus:outline-none"
          />
          <span className="text-muted">—</span>
          <input
            type="number"
            name="max"
            min="0"
            step="1000"
            placeholder="Max"
            defaultValue={maxNaira}
            className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-offwhite placeholder:text-muted focus:border-gold focus:outline-none"
          />
        </div>
      </fieldset>

      <div className="space-y-2">
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#121212] text-sm font-semibold text-white transition-colors hover:bg-[#2b2b2b]"
        >
          Apply filters
        </button>
        <Link
          href="/shop"
          className="inline-flex min-h-[40px] w-full items-center justify-center text-sm text-muted transition-colors hover:text-offwhite"
        >
          Clear all
        </Link>
      </div>
    </form>
  );
}
