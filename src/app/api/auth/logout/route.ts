import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}