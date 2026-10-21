import { headers } from "next/headers";

// The public origin for links in emails and redirects. NEXT_PUBLIC_SITE_URL
// wins in production; the request headers keep local and preview links right.
export async function getRequestOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`.replace(/\/+$/, "");
}
