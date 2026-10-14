import { requireRole } from "@/lib/auth/session";

export default async function UpdatesPage() {
  await requireRole(["board"]);

  return (
    <div>
      <h1 className="font-oswald font-semibold text-2xl uppercase tracking-[0.02em] mb-4">
        Updates
      </h1>
      <p className="text-muted">Board updates coming soon.</p>
    </div>
  );
}