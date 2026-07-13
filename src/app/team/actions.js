"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// ── Team member marks one of their own tasks as done (or re-opens it) —
// ownership-checked the same way every other client-facing action in this
// codebase is: verify the session, then confirm the row actually belongs to
// this user before writing through the admin client. ──
export async function setMyTaskDone(taskId, isDone) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  if (!taskId) throw new Error("معرّف المهمة مفقود");

  const admin = createAdminClient();
  const { data: task, error: fetchError } = await admin
    .from("team_tasks")
    .select("assignee_id")
    .eq("id", taskId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (task.assignee_id !== user.id) throw new Error("غير مصرح لك بهذا الإجراء");

  const { error } = await admin
    .from("team_tasks")
    .update({ status: isDone ? "done" : "open", completed_at: isDone ? new Date().toISOString() : null })
    .eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath("/team");
  revalidatePath("/admin/team");
}
