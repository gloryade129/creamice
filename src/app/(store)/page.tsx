import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, Shield, Truck } from "lucide-react";
import { getCategories } from "@/lib/data/categories";
import { demoProducts, fallbackCategories, type DemoProduct } from "@/lib/demo-data";
import { formatNaira } from "@/lib/money";

export const dynamic = "force-dynamic";

function ProductCard({ product }: { product: DemoProduct }) {
  const hasDiscount =
    product.compareAtPriceKobo !== null &&
    product.compareAtPriceKobo > product.priceKobo;

  return (
    <article className="group flex flex-col bg-surface border border-border rounded-[4px] overflow-hidden">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] bg-charcoal overflow-hidden"
      >
        {/* Product photos are owner task O-6. Until they arrive the card
            stays an honest placeholder instead of showing a stock image. */}
        <span className="absolute inset-0 flex items-center justify-center text-xs text-muted">
          Photo coming soon
        </span>
        {(product.soldOut || product.isNewArrival) && (
          <span className="absolute top-2 left-2 bg-charcoal text-offwhite text-xs px-2 py-1 rounded-[2px] uppercase tracking-[0.04em]">
            {product.soldOut ? "Sold out" : "New"}
          </span>
        )}
        <span className="absolute inset-0 transition-transform duration-200 md:group-hover:scale-[1.03]" />
      </Link>
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-oswald text-base md:text-lg text-offwhite line-clamp-2 group-hover:text-gold transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-montserrat font-semibold text-gold tabular-nums">
            {formatNaira(product.priceKobo)}
          </span>
          {hasDiscount && (
            <span className="font-montserrat text-sm text-muted line-through tabular-nums">
              {formatNaira(product.compareAtPriceKobo!)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function SectionHeader({
  title,
  href,
  actionText = "View all",
}: {
  title: string;
  href: string;
  actionText?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <h2 className="font-oswald font-semibold text-xl md:text-2xl uppercase tracking-[0.02em] text-offwhite">
        {title}
      </h2>
      <Link
        href={href}
        className="font-montserrat text-sm text-gold hover:text-gold-hover transition-colors inline-flex items-center gap-1 min-h-[44px]"
      >
        {actionText}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default async function Home() {
  let categories = fallbackCategories;
  try {
    const rows = await getCategories();
    if (rows.length > 0) {
      categories = rows.map((row) => ({ name: row.name, slug: row.slug }));
    }
  } catch {
    // No database yet: the fallback keeps the page reviewable.
  }

  const newArrivals = demoProducts.filter((p) => p.isNewArrival).slice(0, 8);
  const featured = demoProducts.filter((p) => p.isFeatured).slice(0, 8);

  return (
    <div className="flex flex-col flex-1 bg-jet text-offwhite">
      {/* Hero. PRD 5.2: one static hero, one-line headline, one gold button. */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 grid gap-8 md:grid-cols-2 items-center">
          <div>
            <h1 className="font-oswald font-semibold text-4xl md:text-5xl uppercase tracking-[0.02em] text-offwhite leading-tight">
              New Season Essentials
            </h1>
            <p className="font-montserrat text-base md:text-lg text-muted mt-4 max-w-[70ch]">
              Nigerian streetwear. Delivery across Nigeria, secure payment by Flutterwave.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 h-12 px-6 mt-8 bg-gold text-jet font-montserrat text-sm font-semibold uppercase tracking-[0.04em] rounded-[4px] hover:bg-gold-hover transition-colors"
            >
              Shop now
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
          <div className="relative aspect-[4/3] bg-black rounded-[4px] overflow-hidden">
            <Image
              src="/brand/logo-black-bg.jpeg"
              alt="Creamice"
              fill
              className="object-contain p-6"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Category tiles */}
      <section className="py-12 md:py-16 border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
          <SectionHeader title="Shop by category" href="/shop" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${encodeURIComponent(category.slug)}`}
                className="aspect-square bg-charcoal border border-border rounded-[4px] flex items-center justify-center p-4 text-center transition-colors duration-200 hover:border-gold"
              >
                <span className="font-oswald text-base md:text-lg uppercase tracking-[0.02em] text-offwhite">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="py-12 md:py-16 border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
          <SectionHeader title="New arrivals" href="/shop?sort=newest" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-12 md:py-16 border-b border-border bg-surface">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
          <SectionHeader title="Featured" href="/shop?featured=true" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand statement */}
      <section className="py-12 md:py-16 border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-[70ch]">
            <h2 className="font-oswald font-semibold text-2xl md:text-3xl uppercase tracking-[0.02em] text-offwhite mb-4">
              Creamice
            </h2>
            <p className="font-montserrat text-base text-muted">
              Nigerian streetwear made for everyday wear. Simple designs, honest prices and
              delivery across all 36 states and the FCT.
            </p>
          </div>
        </div>
      </section>

      {/* Trust row. The one light section on the page, per the design system. */}
      <section className="bg-offwhite text-jet">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-3">
            <Truck className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-oswald text-lg uppercase tracking-[0.02em]">
                Delivery across Nigeria
              </h3>
              <p className="font-montserrat text-sm text-text-muted-light">
                All 36 states and the FCT.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-oswald text-lg uppercase tracking-[0.02em]">
                Secure payment
              </h3>
              <p className="font-montserrat text-sm text-text-muted-light">
                Payments handled by Flutterwave.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageCircle className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-oswald text-lg uppercase tracking-[0.02em]">
                WhatsApp support
              </h3>
              <p className="font-montserrat text-sm text-text-muted-light">
                Ask us anything before you order.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest updates. Filled by T25; the empty state is real until then. */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
          <SectionHeader title="Latest updates" href="/updates" />
          <div className="border border-border rounded-[4px] p-8 text-center">
            <p className="font-montserrat text-sm text-muted">
              No updates yet. New drops and announcements will appear here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
