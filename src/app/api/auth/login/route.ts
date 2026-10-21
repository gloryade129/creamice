import { createServerClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // RLS keeps profiles out of the browser client; read the flag server-side.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .single();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
  }

  return NextResponse.json({ user: data.user });
}