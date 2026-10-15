import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { approveProduct } from "@/lib/data/products";
import { approveNoteSchema } from "@/lib/validation/products";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function back(request: Request, key: "ok" | "error", value: string) {
  const url = new URL("/dashboard/products/approval", request.url);
  url.searchParams.set(key, value);
  // 303 turns the POST into a GET, so refresh never re-approves.
  return NextResponse.redirect(url, 303);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireRole(["admin"]);
  const { id } = await params;

  if (!UUID.test(id)) return back(request, "error", "not-found");

  const formData = await request.formData();
  const raw = formData.get("review_note");
  const note = approveNoteSchema.safeParse(typeof raw === "string" ? raw : "");
  if (!note.success) return back(request, "error", "invalid");

  try {
    await approveProduct({
      product_id: id,
      admin_id: user.id,
      review_note: note.data || undefined,
    });
  } catch (err) {
    console.error("Approve product failed:", err);
    const missing =
      err instanceof Error
        ? err.message.includes("not found")
        : typeof err === "object" && err !== null && "code" in err && err.code === "PGRST116";
    return back(request, "error", missing ? "not-found" : "failed");
  }

  return back(request, "ok", "approved");
}
