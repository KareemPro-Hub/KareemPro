"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { sendStagePaymentEmail, sendTimelineProgressEmail } from "@/lib/email";
import { getAdminTimeline } from "@/lib/timeline";

// ══════════════════ Client notifications ══════════════════
// Small helper so every real, client-facing event (payment request/confirm,
// stage progress, production-step move) drops a row the client sees as a
// notification in their portal — never fabricated, only fired from actual
// status changes below.
async function notifyClient(admin, { clientId, projectId, type, message, link }) {
  if (!clientId) return;
  await admin.from("notifications").insert({
    client_id: clientId,
    project_id: projectId || null,
    type,
    message,
    link: link || null,
  });
}

// ══════════════════ Admin notifications ══════════════════
// Fired from real client-side actions only (proposal accept/reject, in
// portal/proposal-actions.js) — never fabricated here.

// ── Admin fetches their own notification feed. ──
export async function getAdminNotifications() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .select("*")
    .eq("for_admin", true)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return data || [];
}

// ── Admin marks a single one of their own notifications as read. ──
export async function markAdminNotificationRead(notificationId) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!notificationId) return;
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("for_admin", true);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ── Admin marks all of their notifications as read at once. ──
export async function markAllAdminNotificationsRead() {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("for_admin", true)
    .is("read_at", null);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ── Admin permanently clears (deletes) all of their notifications, read or
// unread — separate from mark-all-read, this empties the list entirely. ──
export async function clearAllAdminNotifications() {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("notifications").delete().eq("for_admin", true);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ══════════════════ Default proposal template ══════════════════
// Automatically attached to every new client on invite, so they see the
// full technical & financial offer the moment they log in — no manual step.
// Edit these constants any time to change the standard packages everyone gets.
const DEFAULT_PROPOSAL_TITLE = "مشروعك مع Kareem Pro";
const DEFAULT_PACKAGES = [
  {
    name: "الباقة الاقتصادية|للبداية السريعة بأقل تكلفة",
    price: 1500,
    is_featured: false,
    features: [
      "موقع احترافي متكامل لعرض مشروعك أو خدماتك.",
      "تصميم متجاوب يعمل بكفاءة على الجوال والكمبيوتر.",
      "ربط مباشر بواتساب ووسائل التواصل الاجتماعي.",
      "نموذج تواصل لاستقبال طلبات أصحاب المشاريع.",
      "ربط الدومين الرسمي والتأكد من جاهزيته للإطلاق.",
      "مناسبة لأصحاب الأفكار والمشاريع في بدايتها.",
      "طريقة السداد: دفعتان.",
    ].join("\n"),
  },
  {
    name: "الباقة الأساسية|منصة احترافية بدون تطبيقات",
    price: 2500,
    is_featured: false,
    features: [
      "ابدأ منصتك بسرعة وبدون تعقيدات تقنية.",
      "موقع كامل جاهز لعرض خدماتك أو منتجاتك أو محتواك.",
      "للمنصات التعليمية: حماية محتواك من التحميل غير المصرّح به.",
      "تفعيل بوابة الدفع المناسبة: مدى، فيزا، Apple Pay، STC Bank.",
      "تفعيل تلقائي لإيميلات المستخدمين.",
      "ربط الدومين الرسمي بالمنصة والتأكد من جاهزيته قبل الإطلاق.",
      "مناسبة لاختبار الفكرة في السوق بأقل مخاطرة.",
      "بدون تطبيقات جوال.",
      "طريقة السداد: دفعتان.",
    ].join("\n"),
  },
  {
    name: "الباقة المتميزة|الأفضل لمعظم المشاريع",
    price: 5500,
    is_featured: true,
    features: [
      "كل مميزات الباقة الأساسية.",
      "تطبيق آيفون وأندرويد بنظام WebView.",
      "نشر التطبيق رسميًا على Google Play وApp Store.",
      "وصول أسهل للمستخدمين من خلال تطبيق الجوال.",
      "دعم فني لمدة 6 أشهر بعد التسليم.",
      "الخيار الأنسب لمن يريد حضورًا أقوى وتجربة أكثر احترافية.",
      "طريقة السداد: ثلاث دفعات.",
    ].join("\n"),
  },
  {
    name: "الباقة الاحترافية|للمشاريع الاحترافية القابلة للتوسع",
    price: 7500,
    is_featured: false,
    features: [
      "كل مميزات الباقة المتميزة.",
      "تطبيق آيفون وأندرويد أصليان Native.",
      "تجربة استخدام أسرع وأكثر سلاسة وثباتًا.",
      "بنية جاهزة لدمج الذكاء الاصطناعي حسب طبيعة المشروع.",
      "تحليلات ذكية تساعدك على فهم أداء المستخدمين وزيادة أرباحك.",
      "دعم فني لمدة عام كامل بعد التسليم.",
      "أولوية في المتابعة والصيانة بعد الإطلاق.",
      "الخيار الأنسب لمن يريد منصة قوية قابلة للنمو والتوسع.",
      "طريقة السداد: أربع دفعات.",
    ].join("\n"),
  },
];

// ── Creates the default 3-package proposal for a client, only if they don't
// already have one (so re-inviting an existing client never duplicates it). ──
async function ensureDefaultProposal(admin, clientId) {
  const { data: existing } = await admin
    .from("proposals")
    .select("id")
    .eq("client_id", clientId)
    .limit(1)
    .maybeSingle();

  if (existing) return;

  const { data: proposal, error: proposalError } = await admin
    .from("proposals")
    .insert({ client_id: clientId, project_title: DEFAULT_PROPOSAL_TITLE, status: "pending" })
    .select()
    .single();

  if (proposalError) throw new Error(proposalError.message);

  const packagesPayload = DEFAULT_PACKAGES.map((pkg, i) => ({
    proposal_id: proposal.id,
    name: pkg.name,
    price: pkg.price,
    features: pkg.features,
    is_featured: pkg.is_featured,
    sort_order: i,
  }));

  const { error: packagesError } = await admin.from("proposal_packages").insert(packagesPayload);
  if (packagesError) throw new Error(packagesError.message);
}

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
      // One click -> already authenticated -> straight to picking a password.
      // From then on it's a normal email+password login, no more emails needed.
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/set-password`,
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

  if (!userId) throw new Error("تعذر إنشاء/إيجاد حساب صاحب المشروع");

  const { error: upsertError } = await admin
    .from("clients")
    .upsert({ id: userId, full_name, email, phone }, { onConflict: "id" });

  if (upsertError) throw new Error(upsertError.message);

  // Automation: the client sees the full technical & financial offer (with
  // its 3 standard packages) the moment they log in — no manual admin step.
  await ensureDefaultProposal(admin, userId);

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

// ── Add a payment stage/milestone to an existing project (used once a
// project already exists — e.g. auto-created after contract signing — since
// the admin still needs to define the payment milestones for it). ──
export async function addStage(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const project_id = formData.get("project_id")?.toString();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const amount = Number(formData.get("amount"));

  if (!project_id || !title || !amount) throw new Error("العنوان والمبلغ مطلوبين");

  const { data: last } = await admin
    .from("stages")
    .select("stage_number")
    .eq("project_id", project_id)
    .order("stage_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("stages").insert({
    project_id,
    stage_number: (last?.stage_number || 0) + 1,
    title,
    description,
    amount,
    status: "upcoming",
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${project_id}`);
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
    const { count: totalStages } = await admin
      .from("stages")
      .select("id", { count: "exact", head: true })
      .eq("project_id", stage.project_id);
    const messageId = await sendStagePaymentEmail({
      to: client.email,
      clientName: client.full_name,
      projectTitle: stage.projects.title,
      stage,
      totalStages,
    });

    await admin.from("payment_reminders").insert({
      stage_id: stageId,
      email_to: client.email,
      resend_message_id: messageId || null,
    });
  }

  // Only notify on forward progress (not on the "إلغاء" undo, which reuses
  // this same function to step a stage back).
  const STAGE_STATUS_ORDER = { upcoming: 0, awaiting_payment: 1, paid: 2, in_progress: 3, completed: 4 };
  if (STAGE_STATUS_ORDER[targetStatus] > STAGE_STATUS_ORDER[stage.status]) {
    const NOTIFY_MESSAGE = {
      awaiting_payment: `بانتظار السداد: "${stage.title}" — تم إرسال تفاصيل الدفع لبريدك الإلكتروني.`,
      paid: `تم تأكيد استلام دفعة "${stage.title}". شكرًا لك.`,
      in_progress: `بدأنا العمل على مرحلة "${stage.title}".`,
      completed: `اكتملت مرحلة "${stage.title}" بنجاح.`,
    }[targetStatus];
    if (NOTIFY_MESSAGE) {
      await notifyClient(admin, {
        clientId: stage.projects.client_id,
        projectId: stage.project_id,
        type: "payment",
        message: NOTIFY_MESSAGE,
        link: "/portal#payments",
      });
    }
  }

  revalidatePath(`/admin/projects/${stage.project_id}`);
  revalidatePath("/portal");
}

// ── Fully edit an existing payment stage's details (title/description/amount)
// — same fields as when it was first created, no restrictions. ──
export async function updateStage(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const stage_id = formData.get("stage_id")?.toString();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const amount = Number(formData.get("amount"));

  if (!stage_id || !title || !amount) throw new Error("العنوان والمبلغ مطلوبين");

  const { data: stage, error: fetchError } = await admin
    .from("stages")
    .select("project_id")
    .eq("id", stage_id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error } = await admin
    .from("stages")
    .update({ title, description, amount })
    .eq("id", stage_id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${stage.project_id}`);
  revalidatePath("/portal");
}

// ── Permanently delete a payment stage — removes it from both the admin
// dashboard and the client's portal immediately. ──
export async function deleteStage(stageId) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: stage, error: fetchError } = await admin
    .from("stages")
    .select("project_id")
    .eq("id", stageId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error } = await admin.from("stages").delete().eq("id", stageId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${stage.project_id}`);
  revalidatePath("/portal");
}

// ── Advance/rewind a project's production-process timeline step (1-10). ──
export async function updateTimelineStep(projectId, stepKey) {
  await requireAdmin();
  const admin = createAdminClient();

  if (!projectId || !stepKey) throw new Error("بيانات المرحلة غير مكتملة");

  const { data: project, error: fetchError } = await admin
    .from("projects")
    .select("client_id, title, package_name, timeline_step, clients(email, full_name)")
    .eq("id", projectId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error } = await admin
    .from("projects")
    .update({ timeline_step: stepKey })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  // Only notify when actually moving forward (not the "رجوع مرحلة" undo) —
  // fires both an email and an in-app notification for every real step.
  const steps = getAdminTimeline(project.package_name).map((s) => s.key);
  const prevIdx = steps.indexOf(project.timeline_step);
  const nextIdx = steps.indexOf(stepKey);
  if (nextIdx > prevIdx) {
    const stepTitle = getAdminTimeline(project.package_name).find((s) => s.key === stepKey)?.title;
    if (stepTitle) {
      if (project.clients?.email) {
        await sendTimelineProgressEmail({
          to: project.clients.email,
          clientName: project.clients.full_name,
          projectTitle: project.title,
          stepTitle,
        });
      }

      await notifyClient(admin, {
        clientId: project.client_id,
        projectId,
        type: "progress",
        message: `تقدّم مشروعك لمرحلة: "${stepTitle}".`,
        link: "/portal#payments",
      });
    }
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/portal");
}

// ── Toggle one of the 3 delivery/closeout actions for a project (invoice
// issued / review requested / final receipt confirmed). Each is a real
// timestamp column, so "done" reflects something that actually happened —
// clicking again clears it in case it was marked by mistake. ──
const DELIVERY_ACTION_FIELDS = {
  invoice: "invoice_sent_at",
  review: "review_requested_at",
  confirm: "delivery_confirmed_at",
};

export async function toggleDeliveryAction(projectId, actionKey) {
  await requireAdmin();
  const admin = createAdminClient();

  const field = DELIVERY_ACTION_FIELDS[actionKey];
  if (!projectId || !field) throw new Error("بيانات غير صحيحة");

  const { data: project, error: fetchError } = await admin
    .from("projects")
    .select(field)
    .eq("id", projectId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const isDone = !!project[field];
  const { error } = await admin
    .from("projects")
    .update({ [field]: isDone ? null : new Date().toISOString() })
    .eq("id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/delivery");
}

// ── Change a project's status (active / on_hold / completed / cancelled) —
// separate from the production timeline_step, this is the high-level state
// shown as a badge across the dashboard. ──
export async function updateProjectStatus(projectId, status) {
  await requireAdmin();
  const admin = createAdminClient();

  const allowed = ["active", "completed", "on_hold", "cancelled"];
  if (!projectId || !allowed.includes(status)) throw new Error("بيانات غير صحيحة");

  const { error } = await admin.from("projects").update({ status }).eq("id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/delivery");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/portal");
}

// ── Permanently delete a project — cascades to its payment stages
// (stages_project_id_fkey is ON DELETE CASCADE) and disappears from the
// client's portal immediately. ──
export async function deleteProject(projectId) {
  await requireAdmin();
  const admin = createAdminClient();

  if (!projectId) throw new Error("معرّف المشروع مفقود");

  const { error } = await admin.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/delivery");
  revalidatePath("/portal");
}

// ── Resend the account-setup link to a client — reuses Supabase's own
// password-reset flow (works whether they already set a password or never
// finished onboarding), routed through our /auth/set-password screen. Handy
// when the original invite link expired, got pre-clicked by an email
// scanner, or just got lost. ──
export async function resendInvite(clientId) {
  await requireAdmin();
  const admin = createAdminClient();

  if (!clientId) throw new Error("معرّف صاحب المشروع مفقود");

  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("email")
    .eq("id", clientId)
    .single();

  if (clientError || !client) throw new Error("تعذر العثور على صاحب المشروع");

  const { error } = await admin.auth.resetPasswordForEmail(client.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/set-password`,
  });

  if (error) throw new Error(error.message);
}

// ── Permanently delete a client. Removing the auth user cascades through the
// DB (clients -> projects -> stages -> payment_reminders), and since the
// account itself is gone, the same email can sign up again as if brand new. ──
export async function deleteClient(clientId) {
  await requireAdmin();
  const admin = createAdminClient();

  if (!clientId) throw new Error("معرّف صاحب المشروع مفقود");

  const { error } = await admin.auth.admin.deleteUser(clientId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

// ══════════════════ Site content (About Us) ══════════════════

export async function updateAboutContent(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const title = formData.get("title")?.toString().trim();
  const body = formData.get("body")?.toString().trim();
  if (!title || !body) throw new Error("العنوان والنص مطلوبين");

  const { error } = await admin
    .from("site_content")
    .upsert({ key: "about_us", title, body, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

// ══════════════════ Portfolio items ══════════════════

export async function addPortfolioItem(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const image_url = formData.get("image_url")?.toString().trim() || null;
  const link_url = formData.get("link_url")?.toString().trim() || null;
  const stackRaw = formData.get("stack_count")?.toString().trim();
  const stack_count = stackRaw ? Number(stackRaw) : null;
  if (!title) throw new Error("عنوان النموذج مطلوب");

  const { error } = await admin
    .from("portfolio_items")
    .insert({ title, description, image_url, link_url, stack_count });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

export async function deletePortfolioItem(id) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!id) throw new Error("معرّف مفقود");
  const { error } = await admin.from("portfolio_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

// ══════════════════ Testimonials ══════════════════

export async function addTestimonial(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const client_name = formData.get("client_name")?.toString().trim();
  const role = formData.get("role")?.toString().trim() || null;
  const quote = formData.get("quote")?.toString().trim();
  const avatar_url = formData.get("avatar_url")?.toString().trim() || null;
  if (!client_name || !quote) throw new Error("اسم صاحب المشروع ونص الرأي مطلوبين");

  const { error } = await admin.from("testimonials").insert({ client_name, role, quote, avatar_url });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

export async function deleteTestimonial(id) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!id) throw new Error("معرّف مفقود");
  const { error } = await admin.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

// ══════════════════ Proposals (العرض الفني والمالي) ══════════════════

// ── Build a technical & financial proposal for a specific client, with 1+
// packages the client can choose between. ──
export async function createProposal(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const client_id = formData.get("client_id")?.toString();
  const project_title = formData.get("project_title")?.toString().trim();

  const names = formData.getAll("package_name[]").map((v) => v.toString().trim());
  const prices = formData.getAll("package_price[]").map((v) => Number(v));
  const features = formData.getAll("package_features[]").map((v) => v.toString().trim());
  const featured = formData.getAll("package_featured[]").map((v) => v.toString() === "true");

  if (!client_id || !project_title) throw new Error("صاحب المشروع وعنوان المشروع مطلوبان");
  if (names.length === 0 || !names[0]) throw new Error("أضف باقة واحدة على الأقل");

  const { data: proposal, error: proposalError } = await admin
    .from("proposals")
    .insert({ client_id, project_title, status: "pending" })
    .select()
    .single();

  if (proposalError) throw new Error(proposalError.message);

  const packagesPayload = names.map((name, i) => ({
    proposal_id: proposal.id,
    name,
    price: prices[i] || 0,
    features: features[i] || "",
    is_featured: featured[i] || false,
    sort_order: i,
  }));

  const { error: packagesError } = await admin.from("proposal_packages").insert(packagesPayload);
  if (packagesError) throw new Error(packagesError.message);

  revalidatePath("/admin");
  redirect("/admin");
}

// ── Delete a proposal (and its packages, via cascade) so the admin can
// rebuild/resend one after a client rejects it, or by mistake. ──
export async function deleteProposal(proposalId) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!proposalId) throw new Error("معرّف العرض مفقود");
  const { error } = await admin.from("proposals").delete().eq("id", proposalId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
