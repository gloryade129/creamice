import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyUpdateTitle } from "@/lib/updates";

export interface PublicUpdate {
  id: string;
  title: string;
  slug: string;
  body: string;
  publishedAt: string;
}

export interface AdminUpdate {
  id: string;
  title: string;
  slug: string;
  body: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface UpdateRow {
  id: string;
  title: string;
  slug: string;
  body: string;
  published_at: string | null;
  is_published: boolean;
  created_at: string;
}

function mapPublic(row: UpdateRow): PublicUpdate {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    body: row.body,
    publishedAt: row.published_at!,
  };
}

function mapAdmin(row: UpdateRow): AdminUpdate {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    body: row.body,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

// Only published public announcements reach the storefront. Drafts and the
// board audience stay behind the admin dashboard.
export async function getPublicUpdates(limit = 50): Promise<PublicUpdate[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("updates")
      .select("id, title, slug, body, published_at, is_published, created_at")
      .eq("audience", "public")
      .eq("is_published", true)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as UpdateRow[]).map(mapPublic);
  } catch {
    // A missing env var or a database outage should leave the archive empty,
    // not break the whole storefront layout.
    return [];
  }
}

export async function getPublicUpdate(
  slug: string
): Promise<PublicUpdate | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("updates")
      .select("id, title, slug, body, published_at, is_published, created_at")
      .eq("audience", "public")
      .eq("is_published", true)
      .eq("slug", slug)
      .not("published_at", "is", null)
      .maybeSingle();

    if (error || !data) return null;
    return mapPublic(data as UpdateRow);
  } catch {
    return null;
  }
}

export async function getAdminUpdates(): Promise<AdminUpdate[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("updates")
    .select("id, title, slug, body, published_at, is_published, created_at")
    .eq("audience", "public")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as UpdateRow[]).map(mapAdmin);
}

export async function getAdminUpdate(id: string): Promise<AdminUpdate | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("updates")
    .select("id, title, slug, body, published_at, is_published, created_at")
    .eq("id", id)
    .eq("audience", "public")
    .maybeSingle();

  if (error || !data) return null;
  return mapAdmin(data as UpdateRow);
}

export type CreateUpdateResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

export async function createUpdate(input: {
  title: string;
  body: string;
  publish: boolean;
  createdBy: string;
}): Promise<CreateUpdateResult> {
  const admin = createAdminClient();
  const base = slugifyUpdateTitle(input.title);
  const publishedAt = input.publish ? new Date().toISOString() : null;

  // A title can repeat. Try the clean slug first, then a numbered suffix, and
  // stop on any error that is not a unique-slug conflict.
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const slug = attempt === 1 ? base : `${base}-${attempt}`;
    const { data, error } = await admin
      .from("updates")
      .insert({
        title: input.title,
        slug,
        body: input.body,
        audience: "public",
        is_published: input.publish,
        published_at: publishedAt,
        created_by: input.createdBy,
      })
      .select("id, slug")
      .single();

    if (!error && data) {
      return { ok: true, id: data.id, slug: data.slug };
    }
    if (error?.code !== "23505") {
      console.error("[updates] Could not create the update.");
      return { ok: false, error: "Could not save the update. Try again." };
    }
  }

  return { ok: false, error: "Could not create a unique update address." };
}

export async function updateUpdate(input: {
  id: string;
  title: string;
  body: string;
  publish: boolean;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { data: existing, error: readError } = await admin
    .from("updates")
    .select("published_at")
    .eq("id", input.id)
    .eq("audience", "public")
    .maybeSingle();

  if (readError || !existing) return false;

  // Keep the first publication date when a post is edited or re-published, so
  // the archive does not jump around.
  const publishedAt = input.publish
    ? (existing.published_at ?? new Date().toISOString())
    : existing.published_at;

  const { data, error } = await admin
    .from("updates")
    .update({
      title: input.title,
      body: input.body,
      is_published: input.publish,
      published_at: publishedAt,
    })
    .eq("id", input.id)
    .eq("audience", "public")
    .select("id")
    .maybeSingle();

  return !error && Boolean(data);
}

export async function setUpdatePublished(
  id: string,
  publish: boolean
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: existing, error: readError } = await admin
    .from("updates")
    .select("published_at")
    .eq("id", id)
    .eq("audience", "public")
    .maybeSingle();

  if (readError || !existing) return false;

  const { data, error } = await admin
    .from("updates")
    .update({
      is_published: publish,
      published_at: publish
        ? (existing.published_at ?? new Date().toISOString())
        : existing.published_at,
    })
    .eq("id", id)
    .eq("audience", "public")
    .select("id")
    .maybeSingle();

  return !error && Boolean(data);
}
