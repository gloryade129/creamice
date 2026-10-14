import { createServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
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