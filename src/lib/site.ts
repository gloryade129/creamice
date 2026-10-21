// One canonical origin for metadata, sitemap and robots. Production sets
// NEXT_PUBLIC_SITE_URL; local development falls back to the dev server.
const FALLBACK_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || FALLBACK_SITE_URL).replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${cleanPath}`;
}
