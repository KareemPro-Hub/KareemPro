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
    .select("client_id, read_at")
    .eq("id", notificationId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (notif.client_id !== user.id) throw new Error("غير مصرح لك بهذا الإجراء");
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
  const { error } = await admin.from("notifications").delete().eq("client_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/portal");
}
