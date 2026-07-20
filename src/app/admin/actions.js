"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import {
  sendStagePaymentEmail,
  sendTimelineProgressEmail,
  sendDiscountEmail,
  sendPaymentReceivedEmail,
  sendMagicLinkEmail,
} from "@/lib/email";
import { generatePaymentReceiptPdf } from "@/lib/pdfReceipt";

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
import { getAdminTimeline } from "@/lib/timeline";
import { createSignedFileUrl } from "@/lib/projectFiles";

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

// ── Generate a one-time passwordless login link for an existing auth user.
// Uses Supabase's generateLink (token_hash flavor) so WE control the email —
// the branded Resend template — instead of Supabase's generic mailer. The
// link goes through /auth/confirm which verifies the token server-side and
// drops the client straight into their portal, fully signed in. ──
async function createClientLoginUrl(admin, email) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error) throw new Error(error.message);
  const tokenHash = data?.properties?.hashed_token;
  if (!tokenHash) throw new Error("تعذر إنشاء رابط الدخول");
  return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=/portal`;
}

// ── Invite a new client — passwordless. Creates their Supabase Auth user
// (no password, email pre-confirmed) + a matching `clients` row, then sends
// the branded welcome email whose button logs them straight into the portal.
// No username, no password, ever. ──
export async function inviteClient(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const full_name = formData.get("full_name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const phone = formData.get("phone")?.toString().trim() || null;

  // Phone is mandatory now — the whole onboarding runs over WhatsApp
  // (clients come from ads straight into WhatsApp; many never open email).
  if (!full_name || !email || !phone) throw new Error("الاسم والبريد ورقم الواتساب مطلوبين");

  // No password is ever set — the account can only be entered via the
  // one-time email links. email_confirm skips the separate "confirm your
  // email" step since the login link itself proves inbox ownership.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createError) {
    // If the user already exists, just look them up instead of failing.
    const alreadyExists =
      createError.message?.includes("already") || createError.code === "email_exists";
    if (!alreadyExists) throw new Error(createError.message);
  }

  const userId =
    created?.user?.id ??
    (
      await admin.auth.admin.listUsers().then((r) =>
        r.data.users.find((u) => u.email?.toLowerCase() === email)
      )
    )?.id;

  if (!userId) throw new Error("تعذر إنشاء/إيجاد حساب صاحب المشروع");

  // ONE login link shared by both the welcome email and the WhatsApp
  // message. Generating a second link would silently INVALIDATE the first
  // (Supabase keeps only the latest OTP per user — this exact bug shipped
  // once: the email's link was dead on arrival because a second link was
  // generated right after for WhatsApp). Single-use is fine here: whichever
  // one the client taps first signs them in; the other becomes irrelevant.
  const actionUrl = await createClientLoginUrl(admin, email);
  await sendMagicLinkEmail({ to: email, clientName: full_name, actionUrl, isWelcome: true });

  const { error: upsertError } = await admin
    .from("clients")
    .upsert({ id: userId, full_name, email, phone }, { onConflict: "id" });

  if (upsertError) throw new Error(upsertError.message);

  // Automation: the client sees the full technical & financial offer (with
  // its 3 standard packages) the moment they log in — no manual admin step.
  await ensureDefaultProposal(admin, userId);

  revalidatePath("/admin");

  // Same single link as the email (see the invalidation note above).
  return { ok: true, loginUrl: actionUrl, full_name, phone };
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
// ── Remove a stage's auto-generated PDF payment receipt(s) from both storage
// and the client's "الملفات والتسليمات" — used when a payment confirmation is
// undone ("إلغاء") or the stage is deleted ("حذف"), so the client never keeps
// a receipt for a payment that officially no longer exists. Receipts are
// matched by their storage_path pattern (…-receipt-<stageId>.pdf), which is
// unique per stage. Failures are logged, never thrown — cleanup must not
// block the undo/delete action itself. ──
async function deleteStageReceiptFiles(admin, stageId, projectId) {
  try {
    const { data: receipts } = await admin
      .from("project_files")
      .select("id, storage_path")
      .eq("project_id", projectId)
      .eq("type", "invoice")
      .like("storage_path", `%receipt-${stageId}%`);

    if (!receipts?.length) return;

    const paths = receipts.map((r) => r.storage_path).filter(Boolean);
    if (paths.length) {
      const { error: removeError } = await admin.storage.from("project-files").remove(paths);
      if (removeError) console.error("[payment-receipt] storage cleanup failed:", removeError.message);
    }
    await admin
      .from("project_files")
      .delete()
      .in("id", receipts.map((r) => r.id));
  } catch (cleanupError) {
    console.error("[payment-receipt] cleanup failed:", cleanupError);
  }
}

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

  // Every email/notification below only fires on forward progress — not on
  // the "إلغاء" undo, which reuses this same function to step a stage back
  // (e.g. paid → awaiting_payment). Before this check existed, undoing a
  // paid stage back to "awaiting_payment" would silently resend the client
  // the whole "please pay" email + log a duplicate payment_reminders row.
  const STAGE_STATUS_ORDER = { upcoming: 0, awaiting_payment: 1, paid: 2, in_progress: 3, completed: 4 };
  const isForwardProgress = STAGE_STATUS_ORDER[targetStatus] > STAGE_STATUS_ORDER[stage.status];

  // Undoing a confirmed payment ("إلغاء": paid → awaiting_payment or lower)
  // invalidates the PDF receipt that was auto-attached on confirmation — pull
  // it back out of the client's files so no receipt exists for a payment
  // that's no longer confirmed.
  if (STAGE_STATUS_ORDER[stage.status] >= STAGE_STATUS_ORDER.paid && STAGE_STATUS_ORDER[targetStatus] < STAGE_STATUS_ORDER.paid) {
    await deleteStageReceiptFiles(admin, stageId, stage.project_id);
  }

  if (isForwardProgress && targetStatus === "awaiting_payment") {
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

  if (isForwardProgress) {
    const NOTIFY_MESSAGE = {
      awaiting_payment: `بانتظار السداد: "${stage.title}" — تم إرسال تفاصيل الدفع لبريدك الإلكتروني.`,
      paid: `تم تأكيد استلام "${stage.title}". شكرًا لك.`,
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

    if (targetStatus === "paid" && stage.projects.clients?.email) {
      try {
        await sendPaymentReceivedEmail({
          to: stage.projects.clients.email,
          clientName: stage.projects.clients.full_name,
          projectTitle: stage.projects.title,
          stage,
        });
      } catch {
        // The payment is already marked received and the in-app notification
        // above still lands — a Resend hiccup shouldn't fail the whole action.
      }
    }

    // Drop a branded PDF receipt straight into the client's own "الملفات
    // والتسليمات" section — same table/bucket as any admin-uploaded file, so
    // it shows up automatically with zero extra steps. A rendering/upload
    // hiccup here shouldn't fail the whole "confirm payment" action.
    if (targetStatus === "paid") {
      try {
        const { data: allStages } = await admin
          .from("stages")
          .select("amount, status")
          .eq("project_id", stage.project_id);
        const PAID_LIKE = ["paid", "in_progress", "completed"];
        const collected = (allStages || []).reduce(
          (sum, s) => (PAID_LIKE.includes(s.status) ? sum + Number(s.amount || 0) : sum),
          0
        );
        const remaining = Math.max(Number(stage.projects.package_price || 0) - collected, 0);

        const now = new Date();
        const dateValue = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
        const dateLabel = `${now.getDate()} ${ARABIC_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
        const receiptNumber = `#${stage.id.slice(0, 8).toUpperCase()}`;

        const pdfBuffer = await generatePaymentReceiptPdf({
          receiptNumber,
          dateLabel,
          dateValue,
          clientName: stage.projects.clients?.full_name || "",
          projectTitle: stage.projects.title,
          stageTitle: stage.title,
          amount: stage.amount,
          remaining,
        });

        const storage_path = `${stage.project_id}/${Date.now()}-receipt-${stage.id}.pdf`;
        const { error: uploadError } = await admin.storage
          .from("project-files")
          .upload(storage_path, pdfBuffer, { contentType: "application/pdf" });
        if (uploadError) {
          console.error("[payment-receipt] storage upload failed:", uploadError.message);
        } else {
          await admin.from("project_files").insert({
            project_id: stage.project_id,
            client_id: stage.projects.client_id,
            name: `إيصال استلام ${stage.title}`,
            type: "invoice",
            stage_label: stage.title,
            storage_path,
            external_url: null,
            size_bytes: pdfBuffer.length,
          });
        }
      } catch (receiptError) {
        // Same reasoning as the email above — the payment itself already
        // succeeded, a PDF-generation hiccup shouldn't roll that back. Logged
        // (not silent) so failures are diagnosable via Vercel runtime logs.
        console.error("[payment-receipt] generation failed:", receiptError);
      }
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

  // Deleting a stage also deletes its auto-generated payment receipt (if the
  // stage was ever confirmed paid) from the client's files.
  await deleteStageReceiptFiles(admin, stageId, stage.project_id);

  const { error } = await admin.from("stages").delete().eq("id", stageId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${stage.project_id}`);
  revalidatePath("/portal");
}

// ── Apply a discount to a project's total price. Reduces package_price by
// the discount amount, then spreads the new total evenly across the
// *unpaid* stages only, using clean round-100 figures for every stage
// except the last — which absorbs whatever's left so the sum lands exactly
// right (e.g. 1500/2000/2000/2000 with a 1,600 discount becomes
// 1500/1500/1500/1400, not the whole cut dumped on one stage).
// Already-paid/in-progress/completed stages are never touched. The very
// first time a discount lands on a project, the pre-discount stage amounts
// are snapshotted so cancelProjectDiscount (below) can fully undo it later.
// Fires a client-facing in-app notification + email, same as every other
// payment event. ──
export async function applyProjectDiscount(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const project_id = formData.get("project_id")?.toString();
  const discountAmount = Number(formData.get("discount_amount"));
  const note = formData.get("note")?.toString().trim() || null;

  if (!project_id) throw new Error("المشروع غير محدد");
  if (!discountAmount || discountAmount <= 0) throw new Error("مبلغ الخصم غير صحيح");

  const { data: project, error: fetchError } = await admin
    .from("projects")
    .select("*, clients(email, full_name), stages(*)")
    .eq("id", project_id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const PAID_STATUSES = ["paid", "in_progress", "completed"];
  const unpaidStages = (project.stages || [])
    .filter((s) => !PAID_STATUSES.includes(s.status))
    .sort((a, b) => a.stage_number - b.stage_number); // ascending — last one absorbs the remainder

  const unpaidTotal = unpaidStages.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const n = unpaidStages.length;
  if (n === 0) throw new Error("لا يوجد مراحل غير مدفوعة لتطبيق الخصم عليها");
  if (discountAmount > unpaidTotal) {
    throw new Error(`الخصم أكبر من المتبقي على العميل (${unpaidTotal.toLocaleString("en-US")} ريال)`);
  }

  // Snapshot the pre-discount stage amounts the first time a discount ever
  // lands on this project — this is what makes a full, exact cancel later
  // possible, even after several discounts stack up.
  const isFirstDiscount = project.original_price == null;
  const stageSnapshot = isFirstDiscount
    ? Object.fromEntries((project.stages || []).map((s) => [s.id, Number(s.amount || 0)]))
    : project.original_stage_amounts;

  const newUnpaidTotal = unpaidTotal - discountAmount;
  let share = Math.round(newUnpaidTotal / n / 100) * 100;
  if (share < 0) share = 0;
  if (share * (n - 1) > newUnpaidTotal) {
    // Rounding pushed the shared amount too high for the last stage to
    // absorb (small discount edge case) — fall back to a plain, unrounded
    // even split instead.
    share = Math.floor(newUnpaidTotal / n);
  }

  for (let i = 0; i < n; i++) {
    const stage = unpaidStages[i];
    const newAmount = i === n - 1 ? newUnpaidTotal - share * (n - 1) : share;
    const { error: stageError } = await admin
      .from("stages")
      .update({ amount: newAmount })
      .eq("id", stage.id);
    if (stageError) throw new Error(stageError.message);
  }

  const oldPrice = Number(project.package_price) || 0;
  const newPrice = oldPrice - discountAmount;

  const { error: updateError } = await admin
    .from("projects")
    .update({
      package_price: newPrice,
      original_price: project.original_price ?? oldPrice,
      original_stage_amounts: stageSnapshot,
      discount_amount: (Number(project.discount_amount) || 0) + discountAmount,
      discount_note: note || project.discount_note,
      discount_applied_at: new Date().toISOString(),
    })
    .eq("id", project_id);
  if (updateError) throw new Error(updateError.message);

  await notifyClient(admin, {
    clientId: project.client_id,
    projectId: project_id,
    type: "payment",
    message: `🎉 خبر سعيد! قررنا نطبّق خصم خاص بقيمة ${discountAmount.toLocaleString("en-US")} ريال على مشروعك — القيمة الإجمالية الجديدة أصبحت ${newPrice.toLocaleString("en-US")} ريال بدلاً من ${oldPrice.toLocaleString("en-US")} ريال. نتمنى لك تجربة رائعة معنا! ✨`,
    link: "/portal#payments",
  });

  if (project.clients?.email) {
    try {
      await sendDiscountEmail({
        to: project.clients.email,
        clientName: project.clients.full_name,
        projectTitle: project.title,
        oldPrice,
        newPrice,
        discountAmount,
      });
    } catch {
      // The discount already applied and the in-app notification above still
      // lands — a Resend hiccup shouldn't fail the whole action.
    }
  }

  revalidatePath(`/admin/projects/${project_id}`);
  revalidatePath("/admin/clients");
  revalidatePath("/admin/wallet");
  revalidatePath("/admin");
  revalidatePath("/portal");
}

// ── Fully undo every discount ever applied to a project — "as if it never
// happened". Restores package_price and every stage's amount from the
// snapshot taken by applyProjectDiscount the first time a discount landed,
// then clears all discount-tracking fields. Silent on purpose (no client
// notification/email) since this corrects an internal decision, not
// something that happened to the client. ──
export async function cancelProjectDiscount(projectId) {
  await requireAdmin();
  const admin = createAdminClient();

  if (!projectId) throw new Error("المشروع غير محدد");

  const { data: project, error: fetchError } = await admin
    .from("projects")
    .select("*, stages(*)")
    .eq("id", projectId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  if (project.original_price == null || !project.original_stage_amounts) {
    throw new Error("لا يوجد خصم مطبّق على هذا المشروع");
  }

  const snapshot = project.original_stage_amounts;
  for (const stage of project.stages || []) {
    if (Object.prototype.hasOwnProperty.call(snapshot, stage.id)) {
      const { error: stageError } = await admin
        .from("stages")
        .update({ amount: Number(snapshot[stage.id]) })
        .eq("id", stage.id);
      if (stageError) throw new Error(stageError.message);
    }
  }

  const { error: updateError } = await admin
    .from("projects")
    .update({
      package_price: project.original_price,
      original_price: null,
      original_stage_amounts: null,
      discount_amount: 0,
      discount_note: null,
      discount_applied_at: null,
    })
    .eq("id", projectId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/clients");
  revalidatePath("/admin/wallet");
  revalidatePath("/admin");
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
    const stepInfo = getAdminTimeline(project.package_name).find((s) => s.key === stepKey);
    const stepTitle = stepInfo?.title;
    if (stepTitle) {
      if (project.clients?.email) {
        try {
          await sendTimelineProgressEmail({
            to: project.clients.email,
            clientName: project.clients.full_name,
            projectTitle: project.title,
            stepTitle,
            stepDesc: stepInfo?.desc,
          });
        } catch {
          // The step already moved and the in-app notification below still
          // lands — an email hiccup shouldn't fail the whole action.
        }
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
    .select("email, full_name")
    .eq("id", clientId)
    .single();

  if (clientError || !client) throw new Error("تعذر العثور على صاحب المشروع");

  // Passwordless: resending an "invite" now just means a fresh branded
  // email whose button logs them straight in — no set-password step.
  const actionUrl = await createClientLoginUrl(admin, client.email);
  await sendMagicLinkEmail({
    to: client.email,
    clientName: client.full_name,
    actionUrl,
    isWelcome: true,
  });
}

// ── Update an existing client's basic details. Mainly here so clients who
// were added before the WhatsApp-first system (and therefore have no phone
// on file) can get a number added — without one, the WhatsApp buttons have
// nothing to open. ──
export async function updateClient(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const client_id = formData.get("client_id")?.toString();
  const full_name = formData.get("full_name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;

  if (!client_id || !full_name) throw new Error("الاسم مطلوب");

  const { error } = await admin
    .from("clients")
    .update({ full_name, phone })
    .eq("id", client_id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
}

// ── Generate a one-time direct-login URL for a client and hand it back to
// the admin UI — for sending manually over WhatsApp. The client taps the
// link and lands in their portal signed in, typing nothing. Same one-time
// token as the email flow, so a leaked/used link is worthless afterwards. ──
export async function generateClientLoginLink(clientId) {
  await requireAdmin();
  const admin = createAdminClient();

  if (!clientId) throw new Error("معرّف صاحب المشروع مفقود");

  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("email")
    .eq("id", clientId)
    .single();

  if (clientError || !client) throw new Error("تعذر العثور على صاحب المشروع");

  return await createClientLoginUrl(admin, client.email);
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

// ══════════════════ Project files (real uploads/deliverables) ══════════════════
const FILE_TYPES = ["design", "doc", "contract", "invoice", "link"];

// ── Admin uploads a file (or adds a link) to a project's "الملفات
// والتسليمات" list. formData carries either a real file (uploaded to the
// private storage bucket) or an external_url for type "link". ──
export async function addProjectFile(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const project_id = formData.get("project_id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const type = formData.get("type")?.toString();
  const stage_label = formData.get("stage_label")?.toString().trim() || null;
  const external_url = formData.get("external_url")?.toString().trim() || null;
  const file = formData.get("file");

  if (!project_id || !name || !FILE_TYPES.includes(type)) {
    throw new Error("بيانات الملف غير مكتملة");
  }

  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("client_id")
    .eq("id", project_id)
    .single();
  if (projectError) throw new Error(projectError.message);

  let storage_path = null;
  let size_bytes = null;

  if (type === "link") {
    if (!external_url) throw new Error("لازم تكتب رابط");
  } else {
    if (!file || typeof file === "string" || !file.size) {
      throw new Error("لازم ترفع ملف");
    }
    const ext = file.name?.split(".").pop() || "bin";
    storage_path = `${project_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("project-files")
      .upload(storage_path, file, { contentType: file.type || undefined });
    if (uploadError) throw new Error(uploadError.message);
    size_bytes = file.size;
  }

  const { error } = await admin.from("project_files").insert({
    project_id,
    client_id: project.client_id,
    name,
    type,
    stage_label,
    storage_path,
    external_url: type === "link" ? external_url : null,
    size_bytes,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${project_id}`);
  revalidatePath("/portal");
}

// ── Admin deletes a file — removes the DB row and, if it was a real
// upload (not a link), the underlying storage object too. ──
export async function deleteProjectFile(fileId) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!fileId) throw new Error("معرّف الملف مفقود");

  const { data: file, error: fetchError } = await admin
    .from("project_files")
    .select("project_id, storage_path")
    .eq("id", fileId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  if (file.storage_path) {
    await admin.storage.from("project-files").remove([file.storage_path]);
  }

  const { error } = await admin.from("project_files").delete().eq("id", fileId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${file.project_id}`);
  revalidatePath("/portal");
}

// ── Admin gets a real download/open URL for a file — a signed storage URL
// for real uploads, or the external URL as-is for "link" type entries. ──
export async function getProjectFileUrl(fileId) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: file, error } = await admin
    .from("project_files")
    .select("storage_path, external_url")
    .eq("id", fileId)
    .single();
  if (error) throw new Error(error.message);
  if (file.external_url) return file.external_url;
  return createSignedFileUrl(file.storage_path);
}

// ══════════════════ Admin checklist (تخطيط وإدارة) ══════════════════
// A simple standing to-do/notes list for the admin — extra client requests,
// reminders, anything worth not forgetting. Checking an item off never
// deletes it, it just flips `is_checked` (and stamps `checked_at`) so it can
// sort to the bottom with a strikethrough on the client side.

// ── Admin adds a new checklist line and gets the inserted row back, so the
// client component can push it straight into local state. ──
export async function addChecklistItem(text, projectId) {
  await requireAdmin();
  const admin = createAdminClient();
  const clean = (text || "").toString().trim();
  if (!clean) throw new Error("اكتب ملاحظة أولاً");

  const { data, error } = await admin
    .from("admin_checklist")
    .insert({ text: clean, project_id: projectId || null })
    .select("*, projects(title)")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/pipeline");
  return data;
}

// ── Toggles an item's checked state on/off (never deletes). ──
export async function toggleChecklistItem(itemId, isChecked) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!itemId) throw new Error("معرّف الملاحظة مفقود");

  const { error } = await admin
    .from("admin_checklist")
    .update({ is_checked: isChecked, checked_at: isChecked ? new Date().toISOString() : null })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/pipeline");
}

// ── Permanently removes a checklist line (e.g. added by mistake) — separate
// from checking it off, which is meant to persist. ──
export async function deleteChecklistItem(itemId) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!itemId) throw new Error("معرّف الملاحظة مفقود");

  const { error } = await admin.from("admin_checklist").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/pipeline");
}

// ══════════════════ فريق العمل (team members + their tasks) ══════════════════
// A small internal work-assignment system — separate from clients — for
// Kareem's own team. Members get a real login (same invite-email pattern as
// inviteClient) to a stripped-down "/team" portal showing only their own
// assigned tasks; Kareem manages members/tasks/pay from here.

// ── Invite a new team member: Supabase Auth invite email + a matching
// `team_members` row. Mirrors inviteClient, but the post-invite redirect
// carries `role=team` so set-password sends them to /team instead of
// /portal once they pick a password. ──
export async function inviteTeamMember(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const full_name = formData.get("full_name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const role_title = formData.get("role_title")?.toString().trim() || null;

  if (!full_name || !email) throw new Error("الاسم والبريد مطلوبين");

  const nextParam = encodeURIComponent("/auth/set-password?role=team");
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${nextParam}`,
  });

  if (inviteError) {
    if (!inviteError.message?.includes("already")) {
      throw new Error(inviteError.message);
    }
  }

  const userId =
    invited?.user?.id ??
    (await admin.auth.admin.listUsers().then((r) => r.data.users.find((u) => u.email === email)))?.id;

  if (!userId) throw new Error("تعذر إنشاء/إيجاد حساب عضو الفريق");

  const { error: upsertError } = await admin
    .from("team_members")
    .upsert({ id: userId, full_name, email, role_title }, { onConflict: "id" });
  if (upsertError) throw new Error(upsertError.message);

  revalidatePath("/admin/team");
}

// ── Adds a new task, assigned to one team member, with an optional
// free-text project label (matches the design — not tied to a real
// `projects` row, since team work isn't always client-project-specific)
// and an optional price Kareem sets himself. ──
export async function addTeamTask(formData) {
  await requireAdmin();
  const admin = createAdminClient();

  const title = formData.get("title")?.toString().trim();
  const assignee_id = formData.get("assignee_id")?.toString().trim();
  const project_label = formData.get("project_label")?.toString().trim() || "عام";
  const due_date = formData.get("due_date")?.toString().trim() || null;
  const amountRaw = formData.get("amount")?.toString().trim();
  const amount = amountRaw ? Number(amountRaw) : null;

  if (!title || !assignee_id) throw new Error("عنوان المهمة والعضو المكلّف مطلوبين");

  const { error } = await admin
    .from("team_tasks")
    .insert({ title, assignee_id, project_label, due_date, amount });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/team");
  revalidatePath("/team");
}

// ── Admin can flip a task's done state too (not just the member). ──
export async function toggleTeamTaskDone(taskId, isDone) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!taskId) throw new Error("معرّف المهمة مفقود");

  const { error } = await admin
    .from("team_tasks")
    .update({ status: isDone ? "done" : "open", completed_at: isDone ? new Date().toISOString() : null })
    .eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/team");
  revalidatePath("/team");
}

// ── Marks a task's price as actually paid out — separate from task
// completion, same "money truth" pattern used for payment stages. ──
export async function markTeamTaskPaid(taskId) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!taskId) throw new Error("معرّف المهمة مفقود");

  const { error } = await admin
    .from("team_tasks")
    .update({ payment_status: "paid", paid_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/team");
}

// ── Permanently deletes a task (e.g. added by mistake). ──
export async function deleteTeamTask(taskId) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!taskId) throw new Error("معرّف المهمة مفقود");

  const { error } = await admin.from("team_tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/team");
  revalidatePath("/team");
}
