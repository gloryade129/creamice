import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getAdminUpdate } from "@/lib/data/updates";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { UpdateForm } from "@/components/dashboard/UpdateForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditUpdatePage({ params }: Props) {
  await requireRole(["admin"]);
  const { id } = await params;
  const update = await getAdminUpdate(id);
  if (!update) notFound();

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
        title="Edit update"
        description={
          update.isPublished
            ? "Changes go live as soon as you save a published update."
            : "This is still a draft. Publish it when the wording is ready."
        }
      />
      <UpdateForm mode="edit" update={update} />
    </div>
  );
}
