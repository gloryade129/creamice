import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { archiveProduct } from "@/lib/data/products";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function back(request: Request, key: "ok" | "error", value: string) {
  const url = new URL("/dashboard/products", request.url);
  url.searchParams.set(key, value);
  return NextResponse.redirect(url, 303);
}

// Archive is admin only (PRD 6.3), so the button on the product list is a
// plain form POST to here rather than a hidden control.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireRole(["admin"]);
  const { id } = await params;

  if (!UUID.test(id)) return back(request, "error", "not-found");

  try {
    await archiveProduct(id);
  } catch (err) {
    console.error("Archive product failed:", err);
    const missing =
      err instanceof Error
        ? err.message.includes("not found")
        : typeof err === "object" && err !== null && "code" in err && err.code === "PGRST116";
    return back(request, "error", missing ? "not-found" : "failed");
  }

  return back(request, "ok", "archived");
}
