"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import {
  createUpdate,
  setUpdatePublished,
  updateUpdate,
} from "@/lib/data/updates";
import {
  firstUpdateError,
  updateFormSchema,
} from "@/lib/validation/updates";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface UpdateActionState {
  error?: string;
}

function revalidateUpdates(): void {
  revalidatePath("/");
  revalidatePath("/dashboard/updates");
  revalidatePath("/updates", "layout");
}

export async function createUpdateAction(
  _previous: UpdateActionState,
  formData: FormData
): Promise<UpdateActionState> {
  const user = await requireRole(["admin"]);

  const parsed = updateFormSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    intent: formData.get("intent"),
  });
  if (!parsed.success) return { error: firstUpdateError(parsed.error) };

  const result = await createUpdate({
    title: parsed.data.title,
    body: parsed.data.body,
    publish: parsed.data.intent === "publish",
    createdBy: user.id,
  });
  if (!result.ok) return { error: result.error };

  revalidateUpdates();
  redirect("/dashboard/updates?ok=created");
}

export async function updateUpdateAction(
  _previous: UpdateActionState,
  formData: FormData
): Promise<UpdateActionState> {
  await requireRole(["admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !UUID.test(id)) {
    return { error: "That update could not be found." };
  }

  const parsed = updateFormSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    intent: formData.get("intent"),
  });
  if (!parsed.success) return { error: firstUpdateError(parsed.error) };

  const saved = await updateUpdate({
    id,
    title: parsed.data.title,
    body: parsed.data.body,
    publish: parsed.data.intent === "publish",
  });
  if (!saved) return { error: "Could not save the update. Try again." };

  revalidateUpdates();
  redirect("/dashboard/updates?ok=updated");
}

export async function setPublishedAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const id = formData.get("id");
  const published = formData.get("published") === "1";
  if (typeof id !== "string" || !UUID.test(id)) {
    redirect("/dashboard/updates?error=not-found");
  }

  const saved = await setUpdatePublished(id, published);
  if (!saved) {
    redirect("/dashboard/updates?error=save");
  }

  revalidateUpdates();
  redirect(`/dashboard/updates?ok=${published ? "published" : "unpublished"}`);
}
