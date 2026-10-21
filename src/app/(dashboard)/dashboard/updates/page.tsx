import Link from "next/link";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getAdminUpdates } from "@/lib/data/updates";
import { formatUpdateDate } from "@/lib/updates";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { setPublishedAction } from "./actions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function UpdatesPage({ searchParams }: Props) {
  await requireRole(["admin"]);
  const params = await searchParams;
  const updates = await getAdminUpdates();
  const ok = one(params.ok);
  const error = one(params.error);

  const successMessages: Record<string, string> = {
    created: "Update created.",
    updated: "Update saved.",
    published: "Update published to /updates.",
    unpublished: "Update moved back to draft.",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Updates"
        description="Public announcements on the storefront archive. Publish a drop note or store news in under a minute."
        actions={
          <Link href="/dashboard/updates/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New update
            </Button>
          </Link>
        }
      />

      {ok ? (
        <p
          role="status"
          className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
        >
          {successMessages[ok] ?? "Saved."}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
        >
          {error === "not-found"
            ? "That update could not be found."
            : "Could not save the update. Try again."}
        </p>
      ) : null}

      {updates.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center md:p-12">
          <p className="text-sm text-muted">
            No updates yet. The first published post appears on{" "}
            <Link
              href="/updates"
              className="text-offwhite underline underline-offset-2"
            >
              /updates
            </Link>{" "}
            and in the home page archive strip.
          </p>
          <Link href="/dashboard/updates/new" className="mt-4 inline-block">
            <Button>Write the first update</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {updates.map((update) => (
            <li
              key={update.id}
              className="rounded-xl border border-border bg-surface p-4 md:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/updates/${update.id}`}
                    className="font-oswald text-lg font-medium uppercase tracking-[0.02em] text-offwhite transition-colors hover:text-gold"
                  >
                    {update.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">/updates/{update.slug}</p>
                </div>
                <Badge variant={update.isPublished ? "success" : "muted"}>
                  {update.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-xs text-muted">
                  {update.publishedAt
                    ? update.isPublished
                      ? `Published ${formatUpdateDate(update.publishedAt)}`
                      : `First published ${formatUpdateDate(update.publishedAt)} · draft`
                    : `Created ${formatUpdateDate(update.createdAt)}`}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/updates/${update.id}`}>
                    <Button variant="outline">Edit</Button>
                  </Link>
                  <form action={setPublishedAction}>
                    <input type="hidden" name="id" value={update.id} />
                    <input
                      type="hidden"
                      name="published"
                      value={update.isPublished ? "0" : "1"}
                    />
                    <Button type="submit" variant="ghost">
                      {update.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
