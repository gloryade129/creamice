import { requireRole } from "@/lib/auth/session";

export default async function OrdersPage() {
  await requireRole(["admin", "partner"]);

  return (
    <div>
      <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em] mb-4">
        Orders
      </h1>
      <p className="text-muted">Orders management coming soon.</p>
    </div>
  );
}