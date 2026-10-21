import { requireRole } from "@/lib/auth/session";
import { getApprovalQueue, getProfileNames } from "@/lib/data/products";
import { describePendingChanges } from "@/lib/product-approval";
import { formatNairaWithSign } from "@/lib/money";
import { publicImageUrl } from "@/lib/images";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ ok?: string; error?: string }>;
}

export default async function ApprovalQueuePage({ searchParams }: Props) {
  await requireRole(["admin"]);

  const params = await searchParams;
  const products = await getApprovalQueue();
  const names = await getProfileNames(products.map((p) => p.pending_submitted_by));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em]">
          Approval Queue
        </h1>
        <p className="text-muted mt-1">Review new products and changes to live products.</p>
      </div>

      {params.ok && (
        <div
          className="p-4 bg-success/10 border border-success rounded-lg text-success text-sm"
          role="status"
        >
          {params.ok === "approved" ? "Approved." : "Rejected and sent back to the partner."}
        </div>
      )}
      {params.error && (
        <div
          className="p-4 bg-error/10 border border-error rounded-lg text-error text-sm"
          role="alert"
        >
          {params.error === "note-required"
            ? "Write a short note so the partner knows what to change."
            : params.error === "not-found"
              ? "That product could not be found."
              : "Could not save your decision. Try again."}
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border p-12 text-center">
          <p className="text-muted">Nothing is waiting for review.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {products.map((product) => {
            const pending = product.pending_changes;
            const entries = pending
              ? describePendingChanges(product, pending, (product.images ?? []).length)
              : [];
            const submitter = product.pending_submitted_by
              ? names[product.pending_submitted_by]
              : undefined;
            const previewPath =
              pending?.images?.[0]?.storage_path ??
              (product.images ?? [])[0]?.storage_path ??
              null;
            const previewSrc = publicImageUrl(previewPath);
            const isNewSubmission = product.status === "pending_approval";

            return (
              <li
                key={product.id}
                className="bg-surface border border-border rounded-lg p-4 lg:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="font-oswald font-medium text-lg uppercase tracking-[0.02em] hover:text-gold transition-colors"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted">{product.slug}</p>
                    <p className="text-sm text-muted">
                      {product.category?.name || "No category"} ·{" "}
                      {formatNairaWithSign(product.price_kobo)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant="default"
                      className={cn(
                        "border",
                        isNewSubmission
                          ? "bg-gold/10 text-gold border-gold"
                          : "bg-charcoal text-offwhite border-border"
                      )}
                    >
                      {isNewSubmission ? "new product" : "changes to live product"}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-4">
                  {previewSrc && (
                    <div className="relative w-20 h-24 shrink-0 bg-charcoal rounded-lg overflow-hidden border border-border">
                      <Image
                        src={previewSrc}
                        alt={`Proposed image for ${product.name}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 space-y-2 text-sm">
                    <p className="text-muted">
                      Submitted{" "}
                      {product.pending_submitted_at
                        ? new Date(product.pending_submitted_at).toLocaleString("en-NG", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                      {submitter ? ` by ${submitter}` : ""}
                    </p>

                    {pending ? (
                      entries.length > 0 ? (
                        <ul className="space-y-1">
                          {entries.map((entry) => (
                            <li key={entry.label} className="font-montserrat">
                              <span className="text-muted">{entry.label}:</span>{" "}
                              <span className="line-through text-muted">{entry.from}</span>{" "}
                              <span className="text-offwhite">→ {entry.to}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted">Image order or alt text changed.</p>
                      )
                    ) : (
                      <p className="text-muted">
                        New submission: {product.variants?.length || 0} sizes,{" "}
                        {(product.images ?? []).length} images.
                      </p>
                    )}
                  </div>
                </div>

                <form
                  action={`/api/products/${product.id}/approve`}
                  method="POST"
                  className="space-y-3 border-t border-border pt-4"
                >
                  <label className="block" htmlFor={`note-${product.id}`}>
                    <span className="block text-sm font-montserrat font-medium mb-1 text-offwhite">
                      Note <span className="text-muted">(required to reject)</span>
                    </span>
                    <textarea
                      id={`note-${product.id}`}
                      name="review_note"
                      rows={2}
                      maxLength={500}
                      placeholder="e.g. Use a clearer price for the lounge pants"
                      className="w-full bg-charcoal border border-border-strong rounded-lg px-4 py-3 text-offwhite placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-jet"
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="submit"
                      formAction={`/api/products/${product.id}/approve`}
                      variant="primary"
                    >
                      Approve
                    </Button>
                    <Button
                      type="submit"
                      formAction={`/api/products/${product.id}/reject`}
                      variant="danger"
                    >
                      Reject
                    </Button>
                    <Link href={`/dashboard/products/${product.id}`}>
                      <Button variant="ghost" size="sm">
                        Open product
                      </Button>
                    </Link>
                  </div>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
