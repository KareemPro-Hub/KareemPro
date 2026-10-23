"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

// WhatsApp's native URL cannot report Send. This records the administrator's
// explicit acknowledgement, never merely opening a draft.
export async function markPaymentConfirmationSent(stageId) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: stage, error } = await admin.from("stages")
    .select("project_id,status,payment_confirmation_sent_at").eq("id", stageId).single();
  if (error || !stage) throw new Error("تعذر العثور على الدفعة");
  if (stage.status !== "paid") throw new Error("يجب تسجيل سداد الدفعة أولًا");
  if (stage.payment_confirmation_sent_at) return stage.payment_confirmation_sent_at;

  const sentAt = new Date().toISOString();
  const { data: saved, error: saveError } = await admin.from("stages")
    .update({ payment_confirmation_sent_at: sentAt }).eq("id", stageId)
    .eq("status", "paid").is("payment_confirmation_sent_at", null)
    .select("project_id,payment_confirmation_sent_at").maybeSingle();
  if (saveError || !saved) throw new Error("تعذر حفظ التأكيد؛ حدّث الصفحة وحاول مجددًا");
  revalidatePath(`/admin/projects/${saved.project_id}`);
  return saved.payment_confirmation_sent_at;
}
