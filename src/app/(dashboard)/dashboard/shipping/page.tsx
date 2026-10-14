import { requireRole } from "@/lib/auth/session";

export default async function ShippingPage() {
  await requireRole(["admin"]);

  return (
    <div>
      <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em] mb-4">
        Shipping
      </h1>
      <p className="text-muted">Shipping settings coming soon.</p>
    </div>
  );
}