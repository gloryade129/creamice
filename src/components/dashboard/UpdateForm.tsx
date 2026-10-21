"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { AdminUpdate } from "@/lib/data/updates";
import {
  createUpdateAction,
  updateUpdateAction,
  type UpdateActionState,
} from "@/app/(dashboard)/dashboard/updates/actions";

const initialState: UpdateActionState = {};

export function UpdateForm({
  mode,
  update,
}: {
  mode: "create" | "edit";
  update?: AdminUpdate;
}) {
  const [state, action, pending] = useActionState(
    mode === "create" ? createUpdateAction : updateUpdateAction,
    initialState
  );
  const [title, setTitle] = useState(update?.title ?? "");
  const [body, setBody] = useState(update?.body ?? "");

  return (
    <form action={action} className="space-y-6">
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
        >
          {state.error}
        </p>
      ) : null}

      <div className="rounded-xl border border-border bg-surface p-5 md:p-6">
        <div className="grid gap-5">
          {update ? <input type="hidden" name="id" value={update.id} /> : null}
          <Input
            label="Title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={140}
            required
            hint="Shown on the archive and at the top of the update."
          />
          <Textarea
            label="Update"
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={14}
            maxLength={20_000}
            required
            hint="Plain text. Blank lines become separate paragraphs."
            className="min-h-[260px]"
          />
        </div>

        {update ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted">
            <span>
              Address: <span className="text-offwhite">/updates/{update.slug}</span>
            </span>
            {update.isPublished ? (
              <Link
                href={`/updates/${update.slug}`}
                target="_blank"
                className="inline-flex min-h-[44px] items-center gap-1 text-offwhite transition-colors hover:text-gold"
              >
                View public page
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : (
              <span>Draft. Not visible on the storefront.</span>
            )}
          </div>
        ) : (
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted">
            The public address is created from the title.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" name="intent" value="publish" loading={pending}>
          {update?.isPublished ? "Save published update" : "Publish update"}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="draft"
          variant="outline"
          disabled={pending}
        >
          Save draft
        </Button>
        <Link
          href="/dashboard/updates"
          className="inline-flex h-11 items-center px-2 text-sm text-muted underline-offset-2 hover:text-offwhite hover:underline"
        >
          Cancel
        </Link>
      </div>
      {update?.isPublished ? (
        <p className="max-w-[70ch] text-xs leading-relaxed text-muted">
          Saving as a draft removes the update from the public archive but keeps
          its address and history.
        </p>
      ) : null}
    </form>
  );
}
