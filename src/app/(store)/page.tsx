import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Footprints,
  Layers,
  MessageCircle,
  Scissors,
  ShieldCheck,
  Shirt,
  Sparkles,
  Tag,
  Truck,
} from "lucide-react";
import { getCategories } from "@/lib/data/categories";
import { getHomeCatalogue } from "@/lib/data/storefront";
import { getPublicUpdates } from "@/lib/data/updates";
import { fallbackCategories } from "@/lib/demo-data";
import { excerptFromBody, formatUpdateDate } from "@/lib/updates";
import { ProductCard } from "@/components/store/ProductCard";
import {
  PreviewNotice,
  SectionHeading,
} from "@/components/store/SectionHeading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const categoryIcons = {
  hoodies: Shirt,
  sweatshirts: Shirt,
  joggers: Footprints,
  sweatpants: Footprints,
  jorts: Scissors,
  sweaters: Layers,
} as const;

function CategoryIcon({ slug }: { slug: string }) {
  const Icon = categoryIcons[slug as keyof typeof categoryIcons] ?? Tag;
  return <Icon className="h-5 w-5" aria-hidden="true" />;
}

function EmptyCatalogue() {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-charcoal px-6 py-14 text-center">
      <h3 className="font-montserrat text-base font-semibold text-offwhite">
        New pieces are being added
      </h3>
      <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted">
        Check back shortly, or follow the store updates for the next drop.
      </p>
      <Link
        href="/updates"
        className="mt-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-offwhite hover:text-gold-ink"
      >
        Visit updates
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  let categories: { name: string; slug: string }[] = fallbackCategories;
  try {
    const rows = await getCategories();
    if (rows.length > 0) {
      categories = rows.map((row) => ({ name: row.name, slug: row.slug }));
    }
  } catch {
    categories = fallbackCategories;
  }

  const [{ newArrivals, featured, usingDemo }, latestUpdates] =
    await Promise.all([getHomeCatalogue(), getPublicUpdates(3)]);

  return (
    <div>
      {usingDemo && <PreviewNotice />}

      {/* Hero: light marketplace, one clear action. */}
      <section className="border-b border-border bg-charcoal">
        <div className="container-page grid items-center gap-8 py-8 md:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-16">
          <div className="max-w-[560px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Shop the collection
            </p>

            <h1 className="mt-5 font-oswald text-[clamp(2.4rem,6vw,4rem)] font-semibold uppercase leading-[1.02] tracking-[0.01em] text-offwhite">
              Streetwear made
              <br />
              for every day.
            </h1>

            <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted">
              Hoodies, sweatshirts, joggers and more from Creamice. Shop online,
              pay securely and get it delivered anywhere in Nigeria.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#121212] px-7 text-sm font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#2b2b2b]"
              >
                Shop the collection
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/shop?sort=newest"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border-strong bg-surface px-7 text-sm font-semibold uppercase tracking-[0.04em] text-offwhite transition-colors hover:border-offwhite"
              >
                New arrivals
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
              <li className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-gold-ink" aria-hidden="true" />
                Delivery across Nigeria
              </li>
              <li className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-gold-ink" aria-hidden="true" />
                Secure online payment
              </li>
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#0B0B0B] shadow-lift">
            <div className="relative aspect-[4/3] lg:aspect-[5/4]">
              <Image
                src="/brand/logo-black-bg.jpeg"
                alt="Creamice"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-contain p-8 sm:p-12"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 border-t border-white/10 px-6 py-4">
                <p className="font-oswald text-sm uppercase tracking-[0.18em] text-[#C6A15B]">
                  Nigerian streetwear
                </p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                  Shop online
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category shortcuts */}
      <section className="border-b border-border bg-surface">
        <div className="container-page grid grid-cols-3 gap-2 py-5 sm:gap-3 md:grid-cols-6 md:py-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${encodeURIComponent(category.slug)}`}
              className="group flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-xl border border-transparent px-2 py-3 text-center transition-colors hover:border-border hover:bg-charcoal"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-charcoal text-offwhite transition-colors group-hover:bg-gold group-hover:text-on-gold">
                <CategoryIcon slug={category.slug} />
              </span>
              <span className="text-xs font-medium text-offwhite md:text-[13px]">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="bg-surface py-10 md:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Just landed"
            title="New arrivals"
            href="/shop?sort=newest"
          />
          {newArrivals.length === 0 ? (
            <EmptyCatalogue />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Dark promo band: the only large black block between header and footer. */}
      <section className="bg-[#0B0B0B] text-[#F5F2EB]">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center md:py-14">
          <div className="max-w-[620px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C6A15B]">
              Online checkout
            </p>
            <h2 className="mt-3 font-oswald text-[26px] font-semibold uppercase leading-tight tracking-[0.02em] md:text-[36px]">
              Pay online. Delivered to your door.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#B3AEA3] md:text-base">
              Card, bank transfer and USSD through Flutterwave. Every order is
              confirmed by email, and you can track it with your order number.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#F5F2EB] px-7 text-sm font-semibold uppercase tracking-[0.04em] text-[#0B0B0B] transition-colors hover:bg-white"
          >
            Start shopping
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Featured */}
      <section className="bg-surface py-10 md:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Picked for you"
            title="Featured pieces"
            href="/shop?featured=true"
          />
          {featured.length === 0 ? (
            <EmptyCatalogue />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brand statement */}
      <section className="border-y border-border bg-charcoal">
        <div className="container-page grid gap-8 py-10 md:py-16 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-ink">
              About Creamice
            </p>
            <h2 className="mt-3 font-oswald text-[26px] font-semibold uppercase leading-tight tracking-[0.02em] text-offwhite md:text-[36px]">
              Nigerian streetwear, built for daily wear.
            </h2>
          </div>
          <div>
            <p className="text-base leading-relaxed text-muted">
              Creamice makes everyday pieces with simple designs and honest
              prices. Shop online and get your order delivered anywhere in
              Nigeria.
            </p>
            <Link
              href="/about"
              className="mt-5 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-offwhite transition-colors hover:text-gold-ink"
            >
              Read our story
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="bg-surface py-10 md:py-12">
        <div className="container-page grid gap-6 md:grid-cols-3 md:gap-8">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal text-offwhite">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-montserrat text-sm font-semibold text-offwhite">
                Delivery across Nigeria
              </h3>
              <p className="mt-1 text-sm text-muted">
                All 36 states and the FCT, with a fee shown before you pay.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal text-offwhite">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-montserrat text-sm font-semibold text-offwhite">
                Secure payment
              </h3>
              <p className="mt-1 text-sm text-muted">
                Online payments are handled by Flutterwave. We never see your card.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal text-offwhite">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-montserrat text-sm font-semibold text-offwhite">
                WhatsApp support
              </h3>
              <p className="mt-1 text-sm text-muted">
                Questions before or after an order? Message us.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Updates */}
      <section className="border-t border-border bg-surface py-10 md:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="From the store"
            title="Latest updates"
            href="/updates"
          />
          {latestUpdates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-charcoal px-6 py-10 text-center">
              <p className="text-sm text-muted">
                No updates yet. New drops and announcements will appear here.
              </p>
              <Link
                href="/updates"
                className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-offwhite hover:text-gold-ink"
              >
                Visit updates
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-3">
              {latestUpdates.map((update) => (
                <li key={update.id}>
                  <Link
                    href={`/updates/${update.slug}`}
                    className="group flex h-full flex-col rounded-xl border border-border bg-charcoal p-5 transition-colors hover:border-border-strong"
                  >
                    <time
                      dateTime={update.publishedAt}
                      className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
                    >
                      {formatUpdateDate(update.publishedAt)}
                    </time>
                    <h3 className="mt-2 font-oswald text-lg font-medium uppercase leading-tight tracking-[0.02em] text-offwhite transition-colors group-hover:text-gold-ink">
                      {update.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                      {excerptFromBody(update.body, 140)}
                    </p>
                    <span className="mt-auto inline-flex min-h-[44px] items-center gap-1 pt-3 text-sm font-semibold text-offwhite">
                      Read update
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
