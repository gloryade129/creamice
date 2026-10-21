import Link from "next/link";
import { Instagram, MessageCircle } from "lucide-react";
import { getPublicSiteLinks } from "@/lib/data/settings";

// The footer is the one large dark block in the light storefront. Wrapping it
// in .theme-admin keeps the same components working with dark tokens.
export async function SiteFooter() {
  const links = await getPublicSiteLinks();
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || null;

  return (
    <footer className="theme-admin border-t border-border bg-jet text-offwhite">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 md:py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block font-oswald text-2xl font-semibold uppercase leading-none tracking-[0.12em] text-offwhite"
          >
            Creamice<span className="text-gold">.</span>
          </Link>
          <p className="max-w-[38ch] text-sm leading-relaxed text-muted">
            Nigerian streetwear. Simple pieces, honest prices, delivery across
            all 36 states and the FCT.
          </p>
          <div className="flex items-center gap-2 pt-1">
            {links.whatsapp_channel_url && (
              <a
                href={links.whatsapp_channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong px-3 text-sm text-offwhite transition-colors hover:border-gold hover:text-gold"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp Channel
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong px-3 text-sm text-offwhite transition-colors hover:border-gold hover:text-gold"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
                Instagram
              </a>
            )}
          </div>
        </div>

        <FooterColumn
          heading="Shop"
          links={[
            { href: "/shop", label: "All products" },
            { href: "/shop?sort=newest", label: "New in" },
            { href: "/updates", label: "Updates" },
            { href: "/track", label: "Track your order" },
          ]}
        />
        <FooterColumn
          heading="Help"
          links={[
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" },
            { href: "/delivery-returns", label: "Delivery and Returns" },
            { href: "/faq", label: "FAQ" },
          ]}
        />
        <FooterColumn
          heading="Legal"
          links={[
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms" },
          ]}
        />
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Creamice. All rights reserved.</p>
          <p>Secure online payment by Flutterwave</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={heading}>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {heading}
      </p>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-[40px] items-center text-sm text-offwhite transition-colors hover:text-gold"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
