"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { sendStagePaymentEmail } from "@/lib/email";

// ── Invite a new client: creates their Supabase Auth user (magic-link invite
// email goes out automatically) and a matching row in `clients`. ──
export async function inviteClient(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const full_name = formData.get("full_name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;

  if (!full_name || !email) throw new Error("الاسم والبريد مطلوبين");

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/portal`,
    });

  if (inviteError) {
    // If the user already exists, just look them up instead of failing.
    if (!inviteError.message?.includes("already")) {
      throw new Error(inviteError.message);
    }
  }

  const userId =
    invited?.user?.id ??
    (
      await admin.auth.admin.listUsers().then((r) =>
        r.data.users.find((u) => u.email === email)
      )
    )?.id;

  if (!userId) throw new Error("تعذر إنشاء/إيجاد حساب العميل");

  const { error: upsertError } = await admin
    .from("clients")
    .upsert({ id: userId, full_name, email, phone }, { onConflict: "id" });

  if (upsertError) throw new Error(upsertError.message);

  revalidatePath("/admin");
  redirect("/admin");
}

// ── Create a project with its stages for an existing client. ──
export async function createProject(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const client_id = formData.get("client_id")?.toString();
  const title = formData.get("title")?.toString().trim();
  const package_name = formData.get("package_name")?.toString().trim();
  const package_price = Number(formData.get("package_price"));

  const stageTitles = formData.getAll("stage_title[]").map((v) => v.toString());
  const stageAmounts = formData.getAll("stage_amount[]").map((v) => Number(v));
  const stageDescriptions = formData
    .getAll("stage_description[]")
    .map((v) => v.toString());

  if (!client_id || !title || !package_name || !package_price) {
    throw new Error("كل الحقول الأساسية مطلوبة");
  }
  if (stageTitles.length === 0) throw new Error("أضف مرحلة واحدة على الأقل");

  const { data: project, error: projectError } = await admin
    .from("projects")
    .insert({ client_id, title, package_name, package_price })
    .select()
    .single();

  if (projectError) throw new Error(projectError.message);

  const stagesPayload = stageTitles.map((stageTitle, i) => ({
    project_id: project.id,
    stage_number: i + 1,
    title: stageTitle,
    description: stageDescriptions[i] || null,
    amount: stageAmounts[i] || 0,
    status: "upcoming",
  }));

  const { error: stagesError } = await admin.from("stages").insert(stagesPayload);
  if (stagesError) throw new Error(stagesError.message);

  revalidatePath("/admin");
  redirect(`/admin/projects/${project.id}`);
}

// ── Advance a stage's status. When moving into "awaiting_payment", fires the
// payment-reminder email to the client. ──
export async function advanceStage(stageId, targetStatus) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: stage, error: stageError } = await admin
    .from("stages")
    .select("*, projects(*, clients(*))")
    .eq("id", stageId)
    .single();

  if (stageError) throw new Error(stageError.message);

  const timestampField =
    {
      awaiting_payment: "payment_requested_at",
      paid: "paid_at",
      in_progress: "started_at",
      completed: "completed_at",
    }[targetStatus] || null;

  const update = { status: targetStatus };
  if (timestampField) update[timestampField] = new Date().toISOString();

  const { error: updateError } = await admin
    .from("stages")
    .update(update)
    .eq("id", stageId);

  if (updateError) throw new Error(updateError.message);

  if (targetStatus === "awaiting_payment") {
    const client = stage.projects.clients;
    const messageId = await sendStagePaymentEmail({
      to: client.email,
      clientName: client.full_name,
      projectTitle: stage.projects.title,
      stage,
    });

    await admin.from("payment_reminders").insert({
      stage_id: stageId,
      email_to: client.email,
      resend_message_id: messageId || null,
    });
  }

  revalidatePath(`/admin/projects/${stage.project_id}`);
}
