// Update copy is plain text. These helpers keep slugs stable and make list
// excerpts without pulling in a markdown or HTML renderer.
const MAX_SLUG_LENGTH = 80;

export function slugifyUpdateTitle(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return slug || "update";
}

export function excerptFromBody(body: string, limit = 180): string {
  const clean = body.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;

  const cut = clean.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  const end = lastSpace > limit * 0.6 ? lastSpace : limit;
  return `${cut.slice(0, end).replace(/[.,;:!?-]+$/, "")}…`;
}

export function formatUpdateDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
