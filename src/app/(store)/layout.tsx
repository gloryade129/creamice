import { SiteFooter } from "@/components/store/SiteFooter";
import { SiteHeader, HeaderCategory } from "@/components/store/SiteHeader";
import { getCategories } from "@/lib/data/categories";
import { getPublicSiteLinks } from "@/lib/data/settings";

// Categories change rarely but the header and footer read the database,
// and without env vars at build time the fetch must not fail the build.
export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let categories: HeaderCategory[] = [];
  try {
    // Failures (no env yet, database unreachable) leave the navigation
    // without category links rather than breaking every storefront page.
    const rows = await getCategories();
    categories = rows.map((row) => ({ name: row.name, slug: row.slug }));
  } catch {
    categories = [];
  }

  const links = await getPublicSiteLinks();

  return (
    <div className="flex min-h-screen flex-col bg-jet text-offwhite">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-jet focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-offwhite focus:ring-2 focus:ring-gold"
      >
        Skip to content
      </a>
      <SiteHeader
        categories={categories}
        whatsappChannelUrl={links.whatsapp_channel_url}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
