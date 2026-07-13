import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Confirms the logged-in user's email exists in the `admins` table.
// Redirects to the shared /login screen (admin tab) if not signed in or not
// an admin — signed-in-but-wrong-role also lands here rather than looping.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?role=admin");

  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  if (!adminRow) redirect("/login?role=admin");

  return { supabase, user };
}
