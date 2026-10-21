import Link from "next/link";
import { Instagram, MessageCircle } from "lucide-react";
import { getPublicSiteLinks } from "@/lib/data/settings";

// PRD 5.1 footer. Server component: links from the database come through
// getPublicSiteLinks (public columns only). The Instagram URL has no
// settings column yet, so it comes from the environment and the link is
// hidden until the owner supplies it.
export async function SiteFooter() {
  const links = await getPublicSiteLinks();
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || null;

  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <span className="font-oswald font-semibold text-xl uppercase tracking-[0.02em] text-gold">
            Creamice
          </span>
          <p className="text-sm text-muted max-w-[70ch]">
            Nigerian streetwear. Delivery across Nigeria, secure payment by Flutterwave.
          </p>
          <div className="flex items-center gap-2 pt-1">
            {links.whatsapp_channel_url && (
              <a
                href={links.whatsapp_channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 inline-flex items-center gap-2 px-3 text-sm text-offwhite hover:text-gold transition-colors border border-border-strong rounded-[4px]"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                WhatsApp Channel
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 inline-flex items-center gap-2 px-3 text-sm text-offwhite hover:text-gold transition-colors border border-border-strong rounded-[4px]"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
                Instagram
              </a>
            )}
          </div>
        </div>

        <FooterColumn
          heading="Shop"
          links={[
            { href: "/shop", label: "All products" },
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
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4 text-xs text-muted">
          © {new Date().getFullYear()} Creamice. All rights reserved.
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
      <p className="text-xs uppercase tracking-[0.04em] text-muted mb-3">{heading}</p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center min-h-[44px] text-sm text-offwhite hover:text-gold transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
