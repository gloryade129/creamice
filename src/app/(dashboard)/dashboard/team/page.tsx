import { requireRole } from "@/lib/auth/session";

export default async function TeamPage() {
  await requireRole(["admin"]);

  return (
    <div>
      <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em] mb-4">
        Team
      </h1>
      <p className="text-muted">Team management coming soon.</p>
    </div>
  );
}