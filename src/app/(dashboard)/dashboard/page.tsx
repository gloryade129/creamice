import { requireRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getProducts } from "@/lib/data/products";
import { publicImageUrl } from "@/lib/images";

export default async function DashboardPage() {
  // Each role lands somewhere it is allowed to be; requireRole alone would
  // bounce partners and the board to /login from their own nav links.
  const user = await requireRole(["admin", "partner", "board"]);

  if (user.role === "partner") {
    redirect("/dashboard/products");
  }

  if (user.role === "board") {
    const upcoming = await getProducts({ status: "upcoming" });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em]">
            Upcoming
          </h1>
          <p className="text-muted mt-1">Products set to Upcoming by the admin. Read only.</p>
        </div>

        {upcoming.length === 0 ? (
          <div className="bg-surface rounded-[4px] border border-border p-12 text-center">
            <p className="text-muted">No upcoming products yet.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((product) => {
              const src = publicImageUrl(product.images?.[0]?.storage_path);
              return (
                <li
                  key={product.id}
                  className="bg-surface border border-border rounded-[4px] overflow-hidden"
                >
                  <div className="relative aspect-[4/5] bg-charcoal">
                    {src && (
                      <Image
                        src={src}
                        alt={product.images?.[0]?.alt_text || product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <h2 className="font-oswald font-medium text-lg uppercase tracking-[0.02em]">
                      {product.name}
                    </h2>
                    <p className="text-xs text-muted">{product.category?.name || "—"}</p>
                    <p className="text-sm text-muted line-clamp-3">{product.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em]">
          Dashboard
        </h1>
        <p className="text-muted mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-montserrat font-medium text-muted">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-oswald font-semibold">—</div>
            <p className="text-xs text-muted mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-montserrat font-medium text-muted">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-oswald font-semibold">₦0</div>
            <p className="text-xs text-muted mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-montserrat font-medium text-muted">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-oswald font-semibold">0</div>
            <p className="text-xs text-muted mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-montserrat font-medium text-muted">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-oswald font-semibold">0</div>
            <p className="text-xs text-muted mt-1">Active products</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-montserrat font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/dashboard/products/new"
              className="block p-3 bg-charcoal rounded-[4px] border border-border hover:border-gold transition-colors"
            >
              <span className="font-montserrat font-medium">Add New Product</span>
              <p className="text-xs text-muted mt-0.5">Create a new product listing</p>
            </Link>
            <Link
              href="/dashboard/products/approval"
              className="block p-3 bg-charcoal rounded-[4px] border border-border hover:border-gold transition-colors"
            >
              <span className="font-montserrat font-medium">Approval Queue</span>
              <p className="text-xs text-muted mt-0.5">Review partner product submissions</p>
            </Link>
            <Link
              href="/dashboard/orders"
              className="block p-3 bg-charcoal rounded-[4px] border border-border hover:border-gold transition-colors"
            >
              <span className="font-montserrat font-medium">View Orders</span>
              <p className="text-xs text-muted mt-0.5">Manage and fulfill orders</p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-montserrat font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted text-sm">No recent activity yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
