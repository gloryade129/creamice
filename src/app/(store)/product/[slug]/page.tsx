import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  getStorefrontProduct,
  isOnSale,
  isSoldOut,
} from "@/lib/data/storefront";
import { formatNaira } from "@/lib/money";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductPurchase } from "@/components/store/ProductPurchase";
import { ProductCard } from "@/components/store/ProductCard";
import {
  PreviewNotice,
  SectionHeading,
} from "@/components/store/SectionHeading";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getStorefrontProduct(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | Creamice`,
      description: product.description.slice(0, 160),
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const { product, related, usingDemo } = await getStorefrontProduct(slug);

  if (!product) notFound();

  const soldOut = isSoldOut(product);
  const onSale = isOnSale(product);
  const shareText = encodeURIComponent(`${product.name} — Creamice`);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: product.category?.name,
    image: product.images.map((image) => image.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: (product.priceKobo / 100).toFixed(2),
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: siteUrl ? `${siteUrl}/product/${product.slug}` : undefined,
    },
  };

  return (
    <div>
      {usingDemo && <PreviewNotice />}

      <script
        type="application/ld+json"
        // JSON.stringify escapes the values; no user HTML is interpolated here.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-page py-6 md:py-10">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-muted">
          <Link href="/" className="transition-colors hover:text-offwhite">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link href="/shop" className="transition-colors hover:text-offwhite">
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <Link
                href={`/shop?category=${encodeURIComponent(product.category.slug)}`}
                className="transition-colors hover:text-offwhite"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-offwhite">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery
            images={product.images}
            name={product.name}
            category={product.category?.name ?? null}
          />

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-ink">
              {product.category?.name ?? "Creamice"}
            </p>

            <h1 className="mt-2 font-oswald text-[28px] font-semibold uppercase leading-tight tracking-[0.02em] text-offwhite md:text-[38px]">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-semibold tabular-nums text-offwhite">
                {formatNaira(product.priceKobo)}
              </span>
              {onSale && product.compareAtPriceKobo !== null && (
                <>
                  <span className="text-base tabular-nums text-muted line-through">
                    {formatNaira(product.compareAtPriceKobo)}
                  </span>
                  <span className="rounded-md bg-gold px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-on-gold">
                    Sale
                  </span>
                </>
              )}
              {soldOut && (
                <span className="rounded-md bg-charcoal px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                  Sold out
                </span>
              )}
            </div>

            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted md:text-[15px]">
              {product.description}
            </p>

            <div className="mt-7 border-t border-border pt-7">
              <ProductPurchase
                productId={product.id}
                slug={product.slug}
                name={product.name}
                priceKobo={product.priceKobo}
                imageUrl={product.images[0]?.url ?? null}
                variants={product.variants}
              />
            </div>

            <ul className="mt-6 grid gap-2 text-xs text-muted sm:grid-cols-2">
              <li className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-gold-ink" aria-hidden="true" />
                Delivery fee shown at checkout
              </li>
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gold-ink" aria-hidden="true" />
                Secure payment by Flutterwave
              </li>
            </ul>

            <div className="mt-7 divide-y divide-border border-y border-border">
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-offwhite">
                  Delivery
                  <span className="text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  We deliver to all 36 states and the FCT. The delivery fee for
                  your state is added at checkout before you pay.
                </p>
              </details>
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-offwhite">
                  Returns
                  <span className="text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Read the{" "}
                  <Link href="/delivery-returns" className="underline hover:text-offwhite">
                    Delivery and Returns
                  </Link>{" "}
                  page before ordering, or message us on WhatsApp.
                </p>
              </details>
              <div className="py-4">
                <a
                  href={`https://wa.me/?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-offwhite transition-colors hover:text-gold-ink"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Share on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-border bg-charcoal py-10 md:py-14">
          <div className="container-page">
            <SectionHeading
              title="You may also like"
              href={`/shop?category=${encodeURIComponent(product.category?.slug ?? "")}`}
            />
            <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
