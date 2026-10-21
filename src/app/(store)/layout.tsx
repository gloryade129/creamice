import { SiteFooter } from "@/components/store/SiteFooter";
import { SiteHeader, HeaderCategory } from "@/components/store/SiteHeader";
import { getCategories } from "@/lib/data/categories";

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

  return (
    <div className="min-h-screen flex flex-col bg-jet text-offwhite">
      <SiteHeader categories={categories} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
