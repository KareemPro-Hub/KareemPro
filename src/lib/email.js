import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function stagePaymentTemplate({ clientName, projectTitle, stage, portalUrl }) {
  const amount = `${Number(stage.amount).toLocaleString("en-US")} ريال`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1440;padding:40px 16px;font-family:-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;" dir="rtl" lang="ar"><tr><td align="center"><table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#28224e;border:1px solid rgba(239,75,122,0.35);border-radius:18px;overflow:hidden;"><tr><td style="padding:0;line-height:0;"><div style="height:5px;width:100%;background-image:linear-gradient(90deg,#ffa826,#ff5535,#d9187a);"></div></td></tr><tr><td style="padding:32px 32px 8px 32px;text-align:center;"><img src="https://kareempro.com/logo-transparent.png" width="42" height="42" alt="Kareem Pro" style="display:block;margin:0 auto 8px auto;"/><div dir="ltr" style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;color:#ffffff;">KAREEM <span style="color:#ff6e8f;">PRO</span></div></td></tr><tr><td style="padding:24px 32px 8px 32px;text-align:center;"><h1 style="margin:0 0 14px 0;font-size:21px;color:#ffffff;">أهلاً ${clientName} 👋</h1><p style="margin:0 0 20px 0;font-size:15px;line-height:1.9;color:#cfd2ea;">مشروعك <strong style="color:#ffffff;">${projectTitle}</strong> وصل لمرحلة <strong style="color:#ffffff;">"${stage.title}"</strong>، وعشان نبدأ فيها فورًا محتاجين تأكيد سداد قيمة المرحلة:</p></td></tr><tr><td style="padding:0 32px 8px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;"><tr><td style="padding:16px 20px;text-align:center;"><div style="font-size:13px;color:#a9adcf;margin-bottom:4px;">المبلغ المطلوب</div><div style="font-size:28px;font-weight:900;color:#ffffff;">${amount}</div></td></tr></table></td></tr><tr><td style="padding:20px 32px 8px 32px;text-align:center;"><p style="margin:0;font-size:14px;line-height:1.9;color:#cfd2ea;">حوّل المبلغ عبر حساب "برق" (أو STC Pay على نفس الرقم)، وابعت صورة إيصال التحويل على واتساب <a href="https://wa.me/966507069605" style="color:#ff6e8f;font-weight:700;text-decoration:none;">966507069605+</a> عشان نبدأ التنفيذ فورًا.</p></td></tr><tr><td style="padding:24px 32px 32px 32px;text-align:center;"><a href="${portalUrl}" style="display:inline-block;padding:14px 40px;border-radius:10px;background-color:#ef4b7a;background-image:linear-gradient(90deg,#ffa826,#ff5535,#d9187a);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">عرض تفاصيل المشروع</a><p style="margin:22px 0 0 0;font-size:12px;color:#8b8fb5;">جميع الحقوق محفوظة © Kareem Pro</p></td></tr></table></td></tr></table>`;
}

// Sends the "please pay for this stage" email and returns the Resend message id.
export async function sendStagePaymentEmail({
  to,
  clientName,
  projectTitle,
  stage,
}) {
  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/portal`;
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to,
    subject: `مطلوب سداد مرحلة "${stage.title}" — ${projectTitle}`,
    html: stagePaymentTemplate({ clientName, projectTitle, stage, portalUrl }),
  });
  if (error) throw new Error(error.message || "فشل إرسال الإيميل");
  return data?.id;
}
