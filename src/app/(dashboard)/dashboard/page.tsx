import { requireRole } from "@/lib/auth/session";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default async function DashboardPage() {
  await requireRole(["admin"]);
  
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
              href="/dashboard/orders"
              className="block p-3 bg-charcoal rounded-[4px] border border-border hover:border-gold transition-colors"
            >
              <span className="font-montserrat font-medium">View Orders</span>
              <p className="text-xs text-muted mt-0.5">Manage and fulfill orders</p>
            </Link>
            <Link
              href="/dashboard/team"
              className="block p-3 bg-charcoal rounded-[4px] border border-border hover:border-gold transition-colors"
            >
              <span className="font-montserrat font-medium">Manage Team</span>
              <p className="text-xs text-muted mt-0.5">Add or edit team members</p>
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