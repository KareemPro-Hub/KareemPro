"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { sendStagePaymentEmail } from "@/lib/email";

// ══════════════════ Default proposal template ══════════════════
// Automatically attached to every new client on invite, so they see the
// full technical & financial offer the moment they log in — no manual step.
// Edit these constants any time to change the standard packages everyone gets.
const DEFAULT_PROPOSAL_TITLE = "باقات طموحك الإبداعي";
const DEFAULT_PACKAGES = [
  {
    name: "الباقة الاقتصادية للانطلاق السريع بأقل تكلفة",
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
    name: "الباقة المتميزة الأفضل لمعظم المشاريع",
    price: 4500,
    is_featured: true,
    features: [
      "كل مميزات الباقة الاقتصادية.",
      "تطبيق آيفون وأندرويد بنظام WebView.",
      "نشر التطبيق رسميًا على Google Play وApp Store.",
      "وصول أسهل للمستخدمين من خلال تطبيق الجوال.",
      "دعم فني لمدة 6 أشهر بعد التسليم.",
      "الخيار الأنسب لمن يريد حضورًا أقوى وتجربة أكثر احترافية.",
      "طريقة السداد: ثلاث دفعات.",
    ].join("\n"),
  },
  {
    name: "الباقة الاحترافية للمشاريع الاحترافية القابلة للتوسع",
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

  if (!userId) throw new Error("تعذر إنشاء/إيجاد حساب العميل");

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

// ── Resend the account-setup link to a client — reuses Supabase's own
// password-reset flow (works whether they already set a password or never
// finished onboarding), routed through our /auth/set-password screen. Handy
// when the original invite link expired, got pre-clicked by an email
// scanner, or just got lost. ──
export async function resendInvite(clientId) {
  await requireAdmin();
  const admin = createAdminClient();

  if (!clientId) throw new Error("معرّف العميل مفقود");

  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("email")
    .eq("id", clientId)
    .single();

  if (clientError || !client) throw new Error("تعذر العثور على العميل");

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

  if (!clientId) throw new Error("معرّف العميل مفقود");

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
  if (!client_name || !quote) throw new Error("اسم العميل ونص الرأي مطلوبين");

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

  if (!client_id || !project_title) throw new Error("العميل وعنوان المشروع مطلوبين");
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
