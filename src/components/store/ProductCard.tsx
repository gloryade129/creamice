import Link from "next/link";
import { ProductImage } from "@/components/store/ProductImage";
import { QuickAdd } from "@/components/store/QuickAdd";
import {
  isOnSale,
  isSoldOut,
  type StorefrontProduct,
} from "@/lib/data/storefront";
import { formatNaira } from "@/lib/money";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const soldOut = isSoldOut(product);
  const onSale = isOnSale(product);
  const imageUrl = product.images[0]?.url ?? null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-shadow duration-200 hover:shadow-lift">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-charcoal"
        aria-label={product.name}
      >
        <ProductImage
          url={imageUrl}
          alt={product.images[0]?.alt || product.name}
          category={product.category?.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="transition-transform duration-200 motion-safe:group-hover:scale-[1.03]"
        />

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <span className="rounded-md bg-[#121212]/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
              Sold out
            </span>
          ) : (
            <>
              {onSale && (
                <span className="rounded-md bg-gold px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-on-gold">
                  Sale
                </span>
              )}
              {product.isNewArrival && (
                <span className="rounded-md bg-offwhite px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-jet">
                  New
                </span>
              )}
            </>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted">
          {product.category?.name ?? "Creamice"}
        </p>

        <h3 className="font-montserrat text-sm font-medium leading-snug text-offwhite md:text-[15px]">
          <Link
            href={`/product/${product.slug}`}
            className="line-clamp-2 transition-colors hover:text-gold-ink"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-2">
          <span className="text-[15px] font-semibold tabular-nums text-offwhite md:text-base">
            {formatNaira(product.priceKobo)}
          </span>
          {onSale && product.compareAtPriceKobo !== null && (
            <span className="text-xs tabular-nums text-muted line-through">
              {formatNaira(product.compareAtPriceKobo)}
            </span>
          )}
        </div>

        <div className="pt-2.5">
          <QuickAdd
            productId={product.id}
            slug={product.slug}
            name={product.name}
            priceKobo={product.priceKobo}
            imageUrl={imageUrl}
            variants={product.variants}
          />
        </div>
      </div>
    </article>
  );
}
