import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { UpdateForm } from "@/components/dashboard/UpdateForm";

export default async function NewUpdatePage() {
  await requireRole(["admin"]);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/updates"
        className="inline-flex min-h-[44px] items-center gap-1 text-sm text-muted transition-colors hover:text-offwhite"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All updates
      </Link>
      <PageHeader
        eyebrow="Admin"
        title="New update"
        description="Write the announcement, then publish it to the public archive."
      />
      <UpdateForm mode="create" />
    </div>
  );
}
