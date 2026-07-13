import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY غير مضبوط في بيئة التشغيل");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

// Lives in /public (not src/assets) specifically so Vercel's serverless
// function bundler always includes it — files outside /public that are only
// referenced via a runtime fs.readFileSync path (not a static import) can get
// silently dropped from the production bundle, which was causing the PDF to
// go missing from the email in production while working fine locally.
const BANK_BENEFICIARY_GUIDE_PATH = path.join(
  process.cwd(),
  "public/kareem-pro-bank-beneficiary-guide.pdf"
);
// Public download URL for the same file, used to link it from the client
// portal dashboard (a real email attachment obviously can't be linked there).
const BANK_BENEFICIARY_GUIDE_URL = "https://kareempro.com/kareem-pro-bank-beneficiary-guide.pdf";

// Shown by mail/notification clients under the subject (inbox list preview,
// lock-screen push preview) — kept short on purpose so the notification
// stays clean. The visible email body below is untouched.
const STAGE_PAYMENT_PREVIEW_TEXT = "مشروعك ينتظر أول خطوة نحو التنفيذ 🚀";
// Second line of the lock-screen notification (below the subject). A real
// blank string makes iOS fall back to repeating the subject as that second
// line, so this is a zero-width space instead — technically non-empty (no
// fallback duplication) but renders as nothing visible, giving a true
// single-line notification per Kareem's request.
const STAGE_PAYMENT_PREVIEW_SUBTEXT = "​";

// Per-stage-number subject (the only line shown on the lock screen) for the
// 4-stage payment plan used across current packages. `stage.stage_number`
// picks the phrase; any stage number outside 1-4 falls back to the generic
// phrase above.
const STAGE_PAYMENT_COPY_BY_NUMBER = {
  1: { subject: "دُفعة السداد الأولى تبدأ الحلم 🚀" },
  2: { subject: "دُفعة السداد الثانية تدفعنا للأمام ⭐️" },
  3: { subject: "دُفعة السداد الثالثة تُكمل الحلم 🎯" },
  4: { subject: "دُفعة السداد الرابعة تُتمّ الرحلة 🎉" },
};

function stagePaymentNotificationCopy(stageNumber) {
  const entry = STAGE_PAYMENT_COPY_BY_NUMBER[stageNumber];
  return {
    subject: entry ? entry.subject : STAGE_PAYMENT_PREVIEW_TEXT,
    subtext: STAGE_PAYMENT_PREVIEW_SUBTEXT,
  };
}

// Shared white riyal-symbol markup for the dark-background email templates
// below — never the plain word "ريال", always the actual symbol.
const RIYAL_IMG = `<img src="https://kareempro.com/riyal-symbol-white.png" alt="ريال" width="16" height="18" style="display:inline-block;vertical-align:-2px;margin:0 3px;" />`;

function stagePaymentTemplate({ clientName, projectTitle, stage, portalUrl }) {
  const amountValue = Number(stage.amount).toLocaleString("en-US");
  const riyal = RIYAL_IMG;
  // No hidden preheader here on purpose — the subject line already carries
  // the short phrase, and a separate preheader duplicated it as a second
  // line on the lock screen. Leaving this out avoids that duplicate.
  const preheader = "";
  return `${preheader}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1440;padding:40px 16px;font-family:-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;" dir="rtl" lang="ar"><tr><td align="center"><table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#28224e;border:1px solid rgba(239,75,122,0.35);border-radius:18px;overflow:hidden;"><tr><td style="padding:0;line-height:0;"><div style="height:5px;width:100%;background-image:linear-gradient(90deg,#ffa826,#ff5535,#d9187a);"></div></td></tr><tr><td style="padding:32px 32px 8px 32px;text-align:center;"><img src="https://kareempro.com/logo-transparent.png" width="42" height="42" alt="Kareem Pro" style="display:block;margin:0 auto 8px auto;"/><div dir="ltr" style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;color:#ffffff;">KAREEM <span style="color:#ff6e8f;">PRO</span></div></td></tr><tr><td style="padding:24px 32px 8px 32px;text-align:center;"><h1 style="margin:0 0 14px 0;font-size:21px;color:#ffffff;">حياك الله يا الغالي 🤝</h1><p style="margin:0 0 16px 0;font-size:15px;line-height:1.9;color:#cfd2ea;">مشروعك ينمو بكل شغف، ونحن جاهزون الآن لنبث الحياة في محطتنا القادمة: <strong style="color:#ffffff;">"${stage.title}"</strong>.</p><p style="margin:0 0 20px 0;font-size:15px;line-height:1.9;color:#cfd2ea;">لتنشيط هذه المرحلة ومباشرة العمل فورًا:</p></td></tr><tr><td style="padding:0 32px 8px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;"><tr><td style="padding:16px 20px;text-align:center;"><div style="font-size:13px;color:#a9adcf;margin-bottom:4px;">المبلغ المستحق</div><div style="font-size:28px;font-weight:900;color:#ffffff;">${amountValue}${riyal}</div></td></tr></table></td></tr><tr><td style="padding:20px 32px 8px 32px;text-align:center;"><p style="margin:0 0 10px 0;font-size:14px;line-height:1.9;color:#cfd2ea;">التحويل يكون <strong style="color:#ffffff;">دوليًا من بنك الراجحي إلى بنك مصر</strong>. مرفق مع هذا الإيميل <strong style="color:#ffffff;">ملف PDF</strong> يوضح بيانات المستفيد خطوة بخطوة — نزّله وأضف المستفيد في تطبيق الراجحي لكي يتم التحويل الدولي بنجاح. لو الملف ما ظهرش كمرفق، حمّله من هنا: <a href="${BANK_BENEFICIARY_GUIDE_URL}" style="color:#ff6e8f;font-weight:700;text-decoration:none;">بيانات المستفيد.pdf</a>.</p><p style="margin:0;font-size:14px;line-height:1.9;color:#cfd2ea;">بعد التحويل، فضلاً زودنا بصورة الإيصال عبر الواتساب على الرقم <a href="https://wa.me/966507069605" style="color:#ff6e8f;font-weight:700;text-decoration:none;">966507069605+</a> لننطلق مباشرة.</p></td></tr><tr><td style="padding:24px 32px 32px 32px;text-align:center;"><a href="${portalUrl}" style="display:inline-block;padding:14px 40px;border-radius:10px;background-color:#ef4b7a;background-image:linear-gradient(90deg,#ffa826,#ff5535,#d9187a);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">عرض تفاصيل المشروع</a><p style="margin:22px 0 0 0;font-size:12px;color:#8b8fb5;">جميع الحقوق محفوظة © Kareem Pro</p></td></tr></table></td></tr></table>`;
}

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "egy.kareem.pro@gmail.com";

function proposalDecisionTemplate({ clientName, clientEmail, status, packageName, price, projectTitle, reason }) {
  const accepted = status === "accepted";
  const heading = accepted ? "صاحب مشروع وافق على العرض ✅" : "صاحب مشروع رفض العرض ⚠️";
  const accent = accepted
    ? "linear-gradient(90deg,#ffa826,#ff5535,#d9187a)"
    : "linear-gradient(90deg,#ff8a28,#ff5535,#d9187a)";
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin`;
  const cleanPackageName = packageName ? packageName.split("|")[0].trim() : "";
  const emailProjectTitle = projectTitle;

  const bodyText = accepted
    ? `<strong style="color:#ffffff;">${clientName}</strong> (<a href="mailto:${clientEmail}" style="color:#ffc266;font-weight:700;text-decoration:underline;text-decoration-color:rgba(255,194,102,.55);">${clientEmail}</a>) وافق على العرض ووقّع العقد. جاهز تبدأ تجهز المشروع من لوحة التحكم.`
    : `<strong style="color:#ffffff;">${clientName}</strong> (<a href="mailto:${clientEmail}" style="color:#ffc266;font-weight:700;text-decoration:underline;text-decoration-color:rgba(255,194,102,.55);">${clientEmail}</a>) رفض العرض المرسل له.`;

  const infoRows = accepted
    ? `<tr><td style="padding:6px 0;font-size:13px;color:#a9adcf;">المشروع</td><td style="padding:6px 0;font-size:14px;color:#ffffff;font-weight:700;text-align:left;">${emailProjectTitle}</td></tr><tr><td style="padding:6px 0;font-size:13px;color:#a9adcf;">الباقة المختارة</td><td style="padding:6px 0;font-size:14px;color:#ffffff;font-weight:700;text-align:left;">${cleanPackageName}</td></tr><tr><td style="padding:6px 0;font-size:13px;color:#a9adcf;">القيمة</td><td style="padding:6px 0;font-size:16px;color:#ffffff;font-weight:900;text-align:left;">${Number(price).toLocaleString("en-US")}${RIYAL_IMG}</td></tr>`
    : `<tr><td style="padding:6px 0;font-size:13px;color:#a9adcf;">العرض</td><td style="padding:6px 0;font-size:14px;color:#ffffff;font-weight:700;text-align:left;">${emailProjectTitle}</td></tr><tr><td colspan="2" style="padding:10px 0 2px 0;font-size:13px;color:#a9adcf;">سبب الرفض</td></tr><tr><td colspan="2" style="padding:0 0 4px 0;font-size:14px;color:#ffffff;font-weight:700;line-height:1.8;">${reason}</td></tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1440;padding:40px 16px;font-family:-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;" dir="rtl" lang="ar"><tr><td align="center"><table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#28224e;border:1px solid rgba(239,75,122,0.35);border-radius:18px;overflow:hidden;"><tr><td style="padding:0;line-height:0;"><div style="height:5px;width:100%;background-color:#ff5535;background-image:${accent};"></div></td></tr><tr><td style="padding:32px 32px 8px 32px;text-align:center;"><img src="https://kareempro.com/logo-transparent.png" width="42" height="42" alt="Kareem Pro" style="display:block;margin:0 auto 8px auto;"/><div dir="ltr" style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;color:#ffffff;">KAREEM <span style="color:#ff6e8f;">PRO</span></div></td></tr><tr><td style="padding:24px 32px 8px 32px;text-align:center;"><h1 style="margin:0 0 14px 0;font-size:21px;color:#ffffff;">${heading}</h1><p style="margin:0 0 16px 0;font-size:15px;line-height:1.9;color:#cfd2ea;">${bodyText}</p></td></tr><tr><td style="padding:0 32px 8px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;"><tr><td style="padding:14px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${infoRows}</table></td></tr></table></td></tr><tr><td style="padding:24px 32px 32px 32px;text-align:center;"><a href="${adminUrl}" style="display:inline-block;padding:14px 40px;border-radius:10px;background-color:#ef4b7a;background-image:linear-gradient(90deg,#ffa826,#ff5535,#d9187a);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">فتح لوحة التحكم</a><p style="margin:22px 0 0 0;font-size:12px;color:#8b8fb5;">جميع الحقوق محفوظة © Kareem Pro</p></td></tr></table></td></tr></table>`;
}

// Notifies the admin by email whenever a project owner accepts or rejects a proposal.
export async function sendProposalDecisionEmail(params) {
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: ADMIN_EMAIL,
    subject:
      params.status === "accepted"
        ? `✅ ${params.clientName} وافق على عرض "${params.projectTitle}"`
        : `⚠️ ${params.clientName} رفض عرض "${params.projectTitle}"`,
    html: proposalDecisionTemplate(params),
  });
  if (error) throw new Error(error.message || "فشل إرسال إشعار الإدارة");
  return data?.id;
}

// Sends the "please pay for this stage" email and returns the Resend message id.
export async function sendStagePaymentEmail({
  to,
  clientName,
  projectTitle,
  stage,
}) {
  const resend = getResend();
  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/portal`;
  const { subject, subtext } = stagePaymentNotificationCopy(stage.stage_number);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to,
    subject,
    text: subtext,
    html: stagePaymentTemplate({ clientName, projectTitle, stage, portalUrl }),
    attachments: [
      {
        filename: "بيانات المستفيد - Kareem Pro.pdf",
        content: fs.readFileSync(BANK_BENEFICIARY_GUIDE_PATH),
      },
    ],
  });
  if (error) throw new Error(error.message || "فشل إرسال الإيميل");
  return data?.id;
}
