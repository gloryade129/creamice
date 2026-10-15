// Public URL for a stored product image. Rows keep only the storage path
// (e.g. "product-images/1712.webp"), so previews build the URL here instead of
// a /api/storage proxy that does not exist. Returns null when the path or the
// Supabase URL is missing so callers can render a placeholder.
export function publicImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${storagePath.replace(/^\/+/, "")}`;
}
