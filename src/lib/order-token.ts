import { createHmac, timingSafeEqual } from "node:crypto";

// Guest order pages are reached by order number plus a signed token. The
// order number sequence is guessable, so the token is what proves the visitor
// was sent here after paying or after passing /track (number + email).
//
// The link stays valid across deploys because it is derived, not stored.
// Set ORDER_LINK_SECRET explicitly in production; the service role key is a
// safe fallback, but rotating that key would invalidate old links.
function linkSecret(): string {
  const secret = process.env.ORDER_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("ORDER_LINK_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set");
  return secret;
}

export function createOrderToken(orderNumber: string): string {
  return createHmac("sha256", linkSecret())
    .update(`order:${orderNumber}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyOrderToken(orderNumber: string, token: string | undefined): boolean {
  if (!token) return false;
  const expected = createOrderToken(orderNumber);
  const given = Buffer.from(token);
  const want = Buffer.from(expected);
  if (given.length !== want.length) return false;
  return timingSafeEqual(given, want);
}
