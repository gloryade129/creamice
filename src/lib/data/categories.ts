import { createAdminClient } from "@/lib/supabase/admin";

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  
  if (error) throw error;
  return data ?? [];
}

export async function getAllCategories(): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  
  if (error) throw error;
  return data ?? [];
}