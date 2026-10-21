import { requireRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Package,
  Plus,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { getApprovalQueue, getProducts } from "@/lib/data/products";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-charcoal text-gold">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 font-oswald text-[32px] font-semibold leading-none tabular-nums text-offwhite">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-muted">{hint}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireRole(["admin", "partner", "board"]);

  if (user.role === "partner") {
    redirect("/dashboard/products");
  }

  if (user.role === "board") {
    const upcoming = await getProducts({ status: "upcoming" });

    return (
      <div>
        <PageHeader
          eyebrow="Board"
          title="Upcoming"
          description="Products marked Upcoming by the admin. Read only."
        />

        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
            <Package className="mx-auto h-7 w-7 text-muted" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted">No upcoming products yet.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((product) => (
              <li
                key={product.id}
                className="overflow-hidden rounded-xl border border-border bg-surface"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-charcoal">
                  <Package className="h-8 w-8 text-border-strong" aria-hidden="true" />
                </div>
                <div className="space-y-1 p-4">
                  <h2 className="font-montserrat text-sm font-semibold text-offwhite">
                    {product.name}
                  </h2>
                  <p className="text-xs text-muted">{product.category?.name || "—"}</p>
                  <p className="line-clamp-3 text-sm text-muted">{product.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const [activeProducts, approvalQueue] = await Promise.all([
    getProducts({ status: "active" }),
    getApprovalQueue(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Store admin"
        title="Overview"
        description="What is live, what needs review, and what needs attention."
        actions={
          <Link
            href="/dashboard/products/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gold px-4 text-xs font-semibold uppercase tracking-[0.04em] text-on-gold transition-colors hover:bg-gold-hover"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add product
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active products"
          value={String(activeProducts.length)}
          hint="Visible in the storefront"
          icon={Package}
        />
        <StatCard
          label="Awaiting approval"
          value={String(approvalQueue.length)}
          hint="Partner submissions and edits"
          icon={ClipboardCheck}
        />
        <StatCard
          label="Orders today"
          value="—"
          hint="Orders module is the next build"
          icon={ShoppingBag}
        />
        <StatCard
          label="Revenue this month"
          value="—"
          hint="Shown once orders are live"
          icon={Settings}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="font-montserrat text-sm font-semibold text-offwhite">
              Quick actions
            </h2>
          </div>
          <div className="divide-y divide-border">
            <QuickAction
              href="/dashboard/products/new"
              title="Add a product"
              description="Create a listing with sizes, stock and images."
              icon={Plus}
            />
            <QuickAction
              href="/dashboard/products/approval"
              title="Review the approval queue"
              description="Approve or reject partner submissions."
              icon={ClipboardCheck}
              badge={approvalQueue.length > 0 ? String(approvalQueue.length) : undefined}
            />
            <QuickAction
              href="/dashboard/orders"
              title="Orders"
              description="Manage payment, fulfilment and delivery."
              icon={ShoppingBag}
            />
            <QuickAction
              href="/dashboard/settings"
              title="Store settings"
              description="Contact details, shipping and commission."
              icon={Settings}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="font-montserrat text-sm font-semibold text-offwhite">
              Needs attention
            </h2>
            {approvalQueue.length > 0 && (
              <Badge variant="gold" size="sm">
                {approvalQueue.length} waiting
              </Badge>
            )}
          </div>
          <div className="p-5">
            {approvalQueue.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border-strong bg-charcoal px-4 py-8 text-center">
                <p className="text-sm text-muted">
                  Nothing waiting. New partner submissions and edits will appear
                  here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {approvalQueue.slice(0, 4).map((product) => (
                  <li key={product.id}>
                    <Link
                      href="/dashboard/products/approval"
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-charcoal"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-offwhite">
                          {product.name}
                        </span>
                        <span className="text-[11px] text-muted">
                          {product.pending_changes
                            ? "Edit waiting for review"
                            : "New submission"}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="font-montserrat text-sm font-semibold text-offwhite">
            Recent orders
          </h2>
          <Link
            href="/dashboard/orders"
            className="text-xs font-medium text-muted transition-colors hover:text-offwhite"
          >
            View all
          </Link>
        </div>
        <div className="px-5 py-12 text-center">
          <ShoppingBag className="mx-auto h-7 w-7 text-muted" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted">
            No orders yet. New online orders will appear here after payment is
            confirmed.
          </p>
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof Package;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-charcoal"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-charcoal text-gold">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-offwhite">{title}</span>
        <span className="block text-[11px] text-muted">{description}</span>
      </span>
      {badge ? (
        <Badge variant="gold" size="sm">
          {badge}
        </Badge>
      ) : (
        <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      )}
    </Link>
  );
}
