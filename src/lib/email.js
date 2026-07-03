import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function stagePaymentTemplate({ clientName, projectTitle, stage, portalUrl }) {
  return `
  <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#0a0e26;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#161c46;border-radius:18px;padding:32px;border:1px solid rgba(217,24,122,0.25);">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:20px;font-weight:900;letter-spacing:2px;background:linear-gradient(135deg,#FFA826,#FF5535,#D9187A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">KAREEM PRO</span>
      </div>
      <h2 style="color:#f0e8f0;font-size:19px;margin:0 0 8px;">أهلاً ${clientName} 👋</h2>
      <p style="color:#a888a8;font-size:14px;line-height:1.9;margin:0 0 20px;">
        مشروعك <strong style="color:#f0e8f0;">${projectTitle}</strong> وصل لمرحلة
        <strong style="color:#f0e8f0;">"${stage.title}"</strong>، وعشان نبدأ فيها فورًا محتاجين
        تأكيد سداد قيمة المرحلة:
      </p>
      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <div style="color:#a888a8;font-size:13px;">المبلغ المطلوب</div>
        <div style="color:#fff;font-size:26px;font-weight:900;">${Number(stage.amount).toLocaleString("ar-SA")} ريال</div>
      </div>
      <p style="color:#a888a8;font-size:13px;line-height:1.9;margin:0 0 20px;">
        حوّل المبلغ عبر حساب "برق" (أو STC Pay على نفس الرقم)، وابعت صورة إيصال التحويل على
        واتساب <a href="https://wa.me/966507069605" style="color:#ff3fa4;">966507069605+</a>
        عشان نبدأ التنفيذ فورًا.
      </p>
      <div style="text-align:center;margin-top:28px;">
        <a href="${portalUrl}" style="background:linear-gradient(135deg,#FFA826,#FF5535,#D9187A);color:#fff;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:50px;display:inline-block;">
          عرض تفاصيل المشروع
        </a>
      </div>
    </div>
  </div>`;
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
