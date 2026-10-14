import { requireRole } from "@/lib/auth/session";

export default async function CommissionPage() {
  await requireRole(["admin"]);

  return (
    <div>
      <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em] mb-4">
        Commission Report
      </h1>
      <p className="text-muted">Commission report coming soon.</p>
    </div>
  );
}