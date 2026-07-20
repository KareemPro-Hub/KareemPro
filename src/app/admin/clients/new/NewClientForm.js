"use client";

import { useState, useTransition } from "react";
import { inviteClient } from "@/app/admin/actions";
import { buildWhatsAppUrl, welcomeMessage } from "@/lib/whatsapp";

// Country dial codes for the WhatsApp number — any-country support, Saudi
// first (most clients) then the rest of the region alphabetically-ish.
const DIAL_CODES = [
  { code: "966", label: "🇸🇦 السعودية +966" },
  { code: "20", label: "🇪🇬 مصر +20" },
  { code: "971", label: "🇦🇪 الإمارات +971" },
  { code: "965", label: "🇰🇼 الكويت +965" },
  { code: "974", label: "🇶🇦 قطر +974" },
  { code: "973", label: "🇧🇭 البحرين +973" },
  { code: "968", label: "🇴🇲 عُمان +968" },
  { code: "962", label: "🇯🇴 الأردن +962" },
  { code: "964", label: "🇮🇶 العراق +964" },
  { code: "218", label: "🇱🇾 ليبيا +218" },
  { code: "213", label: "🇩🇿 الجزائر +213" },
  { code: "212", label: "🇲🇦 المغرب +212" },
  { code: "216", label: "🇹🇳 تونس +216" },
  { code: "249", label: "🇸🇩 السودان +249" },
  { code: "967", label: "🇾🇪 اليمن +967" },
  { code: "961", label: "🇱🇧 لبنان +961" },
  { code: "970", label: "🇵🇸 فلسطين +970" },
  { code: "963", label: "🇸🇾 سوريا +963" },
  { code: "1", label: "🇺🇸 أمريكا/كندا +1" },
  { code: "44", label: "🇬🇧 بريطانيا +44" },
];

// WhatsApp-first onboarding: after the account is created (and the backup
// welcome email goes out automatically), the admin gets a big green button
// that opens the client's WhatsApp chat with the approved welcome message —
// including a fresh one-time direct-login link — already typed. One tap on
// Send and the client is onboarded without ever opening email.
export default function NewClientForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function handleSubmit(formData) {
    setError(null);

    // Combine the dial-code select + local number into one full
    // international number (strip any leading zeros the admin typed).
    const dial = formData.get("dial")?.toString() || "";
    const local = (formData.get("phone_local")?.toString() || "").replace(/\D/g, "").replace(/^0+/, "");
    if (!local) {
      setError("اكتب رقم الواتساب");
      return;
    }
    formData.set("phone", `+${dial}${local}`);

    startTransition(async () => {
      try {
        const res = await inviteClient(formData);
        setResult(res);
      } catch (e) {
        setError(e.message || "حصل خطأ أثناء إضافة صاحب المشروع");
      }
    });
  }

  if (result) {
    const waUrl = buildWhatsAppUrl(
      result.phone,
      welcomeMessage({ clientName: result.full_name, loginUrl: result.loginUrl })
    );
    return (
      <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>✅</div>
        <h2 className="title" style={{ marginBottom: "8px" }}>
          تم إنشاء حساب {result.full_name} بنجاح
        </h2>
        <p className="muted" style={{ marginBottom: "1.4rem", lineHeight: 1.9 }}>
          فاضل خطوة واحدة: ابعت له رسالة الترحيب على الواتساب — الرسالة جاهزة
          مكتوبة وفيها رابط الدخول المباشر، انت بس تضغط إرسال.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 34px",
            borderRadius: "12px",
            background: "#25d366",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 8px 20px rgba(37,211,102,.35)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          إرسال الترحيب على الواتساب
        </a>
        <div style={{ marginTop: "1.6rem" }}>
          <a href="/admin/clients" className="muted" style={{ fontSize: "13px" }}>
            الرجوع لقائمة العملاء ←
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={handleSubmit}>
      <div className="field">
        <label>اسم صاحب المشروع</label>
        <input type="text" name="full_name" required />
      </div>
      <div className="field">
        <label>البريد الإلكتروني</label>
        <input type="email" name="email" required dir="ltr" />
      </div>
      <div className="field">
        <label>رقم الواتساب</label>
        <div style={{ display: "flex", gap: "8px" }} dir="ltr">
          <select
            name="dial"
            defaultValue="966"
            style={{
              width: "150px",
              flexShrink: 0,
              padding: "10px 8px",
              borderRadius: "10px",
              border: "1px solid #e2d8cb",
              background: "#fff",
              fontFamily: "inherit",
              fontSize: "13px",
              direction: "rtl",
            }}
          >
            {DIAL_CODES.map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </select>
          <input
            type="tel"
            name="phone_local"
            required
            dir="ltr"
            placeholder="5xxxxxxxx"
            style={{ flex: 1 }}
          />
        </div>
        <small className="muted" style={{ display: "block", marginTop: "4px" }}>
          اختر الدولة واكتب الرقم بدون الصفر الأول — يدعم أي دولة.
        </small>
      </div>
      {error && (
        <div className="notice notice-error" style={{ marginBottom: "0.8rem" }}>
          {error}
        </div>
      )}
      <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={isPending}>
        {isPending ? "جارِ الإنشاء..." : "إنشاء الحساب وتجهيز رسالة الواتساب"}
      </button>
    </form>
  );
}
