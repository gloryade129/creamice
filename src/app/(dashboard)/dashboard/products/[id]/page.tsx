import { requireRole } from "@/lib/auth/session";
import { getCategories } from "@/lib/data/categories";
import { getStoreSettings } from "@/lib/data/settings";
import { getProduct, getProfileNames } from "@/lib/data/products";
import { describePendingChanges } from "@/lib/product-approval";
import { notFound } from "next/navigation";
import ProductForm from "@/components/ProductForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const user = await requireRole(["admin", "partner"]);

  const { id } = await params;
  const [product, categories, settings] = await Promise.all([
    getProduct(id),
    getCategories(),
    getStoreSettings(),
  ]);

  if (!product) {
    notFound();
  }

  const pending = product.pending_changes;
  const submitterNames = pending
    ? await getProfileNames([product.pending_submitted_by])
    : {};
  const submitterName = product.pending_submitted_by
    ? submitterNames[product.pending_submitted_by]
    : undefined;

  const pendingEntries = pending
    ? describePendingChanges(
        product,
        pending,
        (product.images ?? []).length
      )
    : [];

  const isAwaiting =
    product.status === "pending_approval" || Boolean(product.pending_changes);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em]">
          Edit Product
        </h1>
        <p className="text-muted mt-1">{product.name}</p>
      </div>

      {product.review_note && (
        <div className="p-4 bg-error/10 border border-error rounded-[4px]" role="status">
          <p className="font-montserrat font-medium text-error text-sm">Admin note</p>
          <p className="text-sm text-offwhite mt-1">{product.review_note}</p>
        </div>
      )}

      {isAwaiting && (
        <div className="p-4 bg-charcoal border border-gold/40 rounded-[4px] space-y-2">
          <p className="font-montserrat font-medium text-gold text-sm">
            {product.pending_changes
              ? "Changes awaiting admin approval"
              : "Waiting for admin approval"}
          </p>
          <p className="text-sm text-muted">
            {product.pending_submitted_at
              ? `Submitted ${new Date(product.pending_submitted_at).toLocaleString("en-NG", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}${submitterName ? ` by ${submitterName}` : ""}`
              : "Submitted for review."}
          </p>
          {pending ? (
            pendingEntries.length > 0 ? (
              <ul className="text-sm text-offwhite space-y-1">
                {pendingEntries.map((entry) => (
                  <li key={entry.label}>
                    <span className="text-muted">{entry.label}:</span> {entry.from} → {entry.to}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-offwhite">Submitted changes to images.</p>
            )
          ) : (
            <p className="text-sm text-muted">
              The values on this form are what the admin will review.
            </p>
          )}
        </div>
      )}

      <ProductForm
        initialData={product}
        categories={categories}
        role={user.role}
        approvalRequired={settings.require_product_approval}
      />
    </div>
  );
}
