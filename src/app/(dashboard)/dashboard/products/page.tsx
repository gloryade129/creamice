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

interface Props {
  searchParams: Promise<{ ok?: string; error?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const user = await requireRole(["admin", "partner"]);
  const params = await searchParams;
  const isAdmin = user.role === "admin";

  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em]">
            Products
          </h1>
          <p className="text-muted mt-1">Manage the product catalog.</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>+ New Product</Button>
        </Link>
      </div>

      {params.ok && (
        <div
          className="p-4 bg-success/10 border border-success rounded-[4px] text-success text-sm"
          role="status"
        >
          Product archived.
        </div>
      )}
      {params.error && (
        <div
          className="p-4 bg-error/10 border border-error rounded-[4px] text-error text-sm"
          role="alert"
        >
          {params.error === "not-found"
            ? "That product could not be found."
            : "Could not archive the product. Try again."}
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-surface rounded-[4px] border border-border p-12 text-center">
          <p className="text-muted mb-4">No products yet.</p>
          <Link href="/dashboard/products/new">
            <Button>Create your first product</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="bg-surface border border-border rounded-[4px] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="font-oswald font-medium text-lg uppercase tracking-[0.02em] hover:text-gold transition-colors"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted truncate">{product.slug}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant="default"
                    className={cn("border", statusStyles[product.status] || "")}
                  >
                    {product.status.replace(/_/g, " ")}
                  </Badge>
                  {product.pending_changes && (
                    <Badge variant="default" className="border border-gold bg-gold/10 text-gold">
                      changes pending
                    </Badge>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                <div>
                  <dt className="text-muted">Category</dt>
                  <dd className="font-montserrat">{product.category?.name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Price</dt>
                  <dd className="font-montserrat font-semibold">
                    {formatNairaWithSign(product.price_kobo)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Sizes</dt>
                  <dd className="font-montserrat">{product.variants?.length || 0}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/dashboard/products/${product.id}`}>
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                </Link>
                {isAdmin && product.status !== "archived" && (
                  <form
                    action={`/api/products/${product.id}/archive`}
                    method="POST"
                    className="inline"
                  >
                    <Button type="submit" variant="danger" size="sm">
                      Archive
                    </Button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
