import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageCircle, Search } from "lucide-react";
import { TrackForm } from "@/components/store/TrackForm";
import { getStoreSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Find your Creamice order with your order number and email.",
  alternates: { canonical: "/track" },
  openGraph: {
    title: "Track your order | Creamice",
    description: "Find your Creamice order with your order number and email.",
    url: "/track",
    siteName: "Creamice",
    locale: "en_NG",
    type: "website",
    images: ["/opengraph-image"],
  },
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const settings = await getStoreSettings();
  const defaultOrder = typeof params.order === "string" ? params.order : "";
  const whatsappHref = settings.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`
    : null;

  return (
    <div className="container-page py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-offwhite">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-offwhite">Track order</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <h1 className="font-oswald text-[32px] font-semibold uppercase tracking-[0.02em] text-offwhite md:text-[42px]">
            Track your order
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Enter the order number from your confirmation email, and the email
            address you used at checkout. Both must match.
          </p>

          <div className="mt-8 max-w-md rounded-xl border border-border bg-surface p-5 md:p-6">
            <TrackForm defaultOrder={defaultOrder} />
          </div>

          <p className="mt-5 max-w-md text-xs leading-relaxed text-muted">
            Order links are private. If you cannot find your confirmation email,
            contact us with the name and phone number used for the order.
          </p>
        </div>

        <aside className="rounded-xl border border-border bg-charcoal p-5 md:p-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gold-ink" aria-hidden="true" />
            <h2 className="font-montserrat text-sm font-semibold uppercase tracking-[0.1em] text-offwhite">
              Before you search
            </h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li>The order number looks like CRM-1001.</li>
            <li>Use the same email that received the receipt.</li>
            <li>Payment updates can take a moment to appear; reload the order if you just paid.</li>
          </ul>

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-5 text-sm font-semibold text-offwhite transition-colors hover:border-offwhite"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Message us on WhatsApp
            </a>
          ) : null}

          {settings.support_email ? (
            <a
              href={`mailto:${settings.support_email}`}
              className="mt-2 inline-flex min-h-[40px] w-full items-center justify-center text-xs font-medium text-muted transition-colors hover:text-offwhite"
            >
              {settings.support_email}
            </a>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
