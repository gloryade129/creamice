import { createServerClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // profiles has RLS on with no browser policy (by design), so the role read
  // must use the server-only client after the session is verified above.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single();
  
  if (!profile || !profile.is_active) return null;
  
  return {
    id: user.id,
    email: user.email!,
    fullName: profile.full_name,
    role: profile.role as UserRole,
  };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  if (!allowedRoles.includes(user.role)) {
    redirect("/login");
  }
  
  return user;
}

export async function getUserOrRedirect() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}