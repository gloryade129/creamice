import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getPublicUpdate } from "@/lib/data/updates";
import {
  excerptFromBody,
  formatUpdateDate,
} from "@/lib/updates";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const update = await getPublicUpdate(slug);
  if (!update) return { title: "Update not found" };

  const description = excerptFromBody(update.body, 155);

  return {
    title: update.title,
    description,
    alternates: { canonical: `/updates/${update.slug}` },
    openGraph: {
      title: `${update.title} | Creamice`,
      description,
      url: `/updates/${update.slug}`,
      siteName: "Creamice",
      locale: "en_NG",
      type: "article",
      publishedTime: update.publishedAt,
      images: ["/opengraph-image"],
    },
  };
}

export default async function UpdatePage({ params }: Props) {
  const { slug } = await params;
  const update = await getPublicUpdate(slug);
  if (!update) notFound();

  return (
    <article className="container-page py-8 md:py-12">
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex flex-wrap items-center gap-1 text-xs text-muted"
      >
        <Link href="/" className="transition-colors hover:text-offwhite">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href="/updates" className="transition-colors hover:text-offwhite">
          Updates
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="line-clamp-1 text-offwhite">{update.title}</span>
      </nav>

      <header className="max-w-[760px] border-b border-border pb-6 md:pb-8">
        <time
          dateTime={update.publishedAt}
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-ink"
        >
          {formatUpdateDate(update.publishedAt)}
        </time>
        <h1 className="mt-3 font-oswald text-[30px] font-semibold uppercase leading-[1.08] tracking-[0.01em] text-offwhite md:text-[44px]">
          {update.title}
        </h1>
      </header>

      <div className="mt-6 max-w-[720px] whitespace-pre-line text-[15px] leading-8 text-offwhite md:mt-8 md:text-base">
        {update.body}
      </div>

      <div className="mt-10 border-t border-border pt-5">
        <Link
          href="/updates"
          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-offwhite transition-colors hover:text-gold-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All updates
        </Link>
      </div>
    </article>
  );
}
