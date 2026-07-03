import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Confirms the logged-in user's email exists in the `admins` table.
// Redirects to /admin/login if not signed in or not an admin.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  if (!adminRow) redirect("/admin/login");

  return { supabase, user };
}
