import { requireRole } from "@/lib/auth/session";
import { getProducts } from "@/lib/data/products";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatNairaWithSign } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-charcoal text-muted border-border",
  pending_approval: "bg-gold/10 text-gold border-gold",
  active: "bg-success/10 text-success border-success",
  upcoming: "bg-gold/10 text-gold border-gold",
  archived: "bg-charcoal text-muted border-border",
};

export default async function ProductsPage() {
  await requireRole(["admin", "partner"]);

  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em]">
            Products
          </h1>
          <p className="text-muted mt-1">Manage your product catalog.</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>+ New Product</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-surface rounded-[4px] border border-border p-12 text-center">
          <p className="text-muted mb-4">No products yet.</p>
          <Link href="/dashboard/products/new">
            <Button>Create your first product</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="pb-3 font-montserrat font-medium">Product</th>
                <th className="pb-3 font-montserrat font-medium hidden md:table-cell">Category</th>
                <th className="pb-3 font-montserrat font-medium hidden lg:table-cell">Price</th>
                <th className="pb-3 font-montserrat font-medium">Status</th>
                <th className="pb-3 font-montserrat font-medium hidden lg:table-cell">Variants</th>
                <th className="pb-3 font-montserrat font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-charcoal/50 transition-colors">
                  <td className="py-4">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="font-montserrat font-medium hover:text-gold transition-colors"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted truncate max-w-xs">{product.slug}</p>
                  </td>
                  <td className="py-4 hidden md:table-cell">
                    {product.category?.name || "—"}
                  </td>
                  <td className="py-4 hidden lg:table-cell font-montserrat font-semibold">
                    {formatNairaWithSign(product.price_kobo)}
                  </td>
                  <td className="py-4">
                    <Badge
                      variant="default"
                      className={cn("border", statusStyles[product.status] || "")}
                    >
                      {product.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-4 hidden lg:table-cell text-muted">
                    {product.variants?.length || 0} variants
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/products/${product.id}`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      {product.status === "active" && (
                        <Button variant="ghost" size="sm" className="text-error hover:text-error">
                          Archive
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}