"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// ── Client marks a single notification as read (their own only). ──
export async function markNotificationRead(notificationId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  if (!notificationId) return;

  const admin = createAdminClient();
  const { data: notif, error: fetchError } = await admin
    .from("notifications")
    .select("client_id, read_at, for_admin")
    .eq("id", notificationId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  // for_admin rows carry the client's id too (as "who triggered this"), so
  // ownership alone isn't enough — a client must never touch admin rows.
  if (notif.client_id !== user.id || notif.for_admin) throw new Error("غير مصرح لك بهذا الإجراء");
  if (notif.read_at) return;

  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw new Error(error.message);

  revalidatePath("/portal");
}

// ── Client marks all of their own notifications as read at once. ──
export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");

  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("client_id", user.id)
    .eq("for_admin", false)
    .is("read_at", null);
  if (error) throw new Error(error.message);

  revalidatePath("/portal");
}

// ── Client permanently clears (deletes) all of their own notifications,
// read or unread. Distinct from markAllNotificationsRead — this empties the
// list entirely instead of just clearing the unread badge. ──
export async function clearAllNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");

  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .delete()
    .eq("client_id", user.id)
    .eq("for_admin", false);
  if (error) throw new Error(error.message);

  revalidatePath("/portal");
}
