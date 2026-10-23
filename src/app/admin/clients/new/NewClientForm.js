"use client";

import { useState, useTransition } from "react";
import { inviteClient } from "@/app/admin/actions";
import { openWhatsApp, welcomeMessage, DIAL_CODES } from "@/lib/whatsapp";

// "blogger" and "pharmacy" are fully wired up (each auto-creates its own
// finalized proposal — see SERVICE_TEMPLATES in admin/actions.js). Blogger
// also hides the "نماذج أعمالنا" step in the client's funnel. The remaining
// options exist as real choices the admin can pick, but behave like a
// normal client until each one gets its own template.
const SERVICE_TYPES = [
  { value: "blogger", label: "إنشاء مدونة بلوجر ربحية" },
  { value: "platform", label: "إنشاء منصة رقمية" },
  { value: "platform-apps", label: "إنشاء منصة رقمية مع التطبيقات" },
  { value: "edu", label: "إنشاء منصة تعليمية" },
  { value: "store", label: "إنشاء متجر إلكتروني" },
  { value: "pharmacy", label: "منصة Urs SaaS لإدارة الصيدليات" },
  { value: "link", label: "منصة LINK السعودية" },
  { value: "articles", label: "باقات كتابة ونشر المقالات" },
];


// WhatsApp-only onboarding: no email is asked for and none is ever sent to
// the client. After the account is created the admin gets a big green button
// that opens the client's WhatsApp chat with the approved welcome message —
// including a fresh one-time direct-login link — already typed. One tap on
// Send and the client is onboarded.
export default function NewClientForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [waSent, setWaSent] = useState(false);

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
    const waText = welcomeMessage({ clientName: result.full_name, loginUrl: result.loginUrl });
    return (
      <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
        <div style={{ fontSize: "40px", marginBottom: "10px" }}><svg className="ui-icon" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="/icons/ui.svg#check"></use></svg></div>
        <h2 className="title" style={{ marginBottom: "8px" }}>
          تم إنشاء حساب {result.full_name} بنجاح
        </h2>
        {waSent ? (
          <p className="muted" style={{ marginBottom: "1.4rem", lineHeight: 1.9 }}>
            تم إرسال رسالة الترحيب على الواتساب — العميل جاهز يدخل على لوحته
            مباشرة.
          </p>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: "1.4rem", lineHeight: 1.9 }}>
              فاضل خطوة واحدة: ابعت له رسالة الترحيب على الواتساب — الرسالة جاهزة
              مكتوبة وفيها رابط الدخول المباشر، انت بس تضغط إرسال.
            </p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                openWhatsApp(result.phone, waText);
                setWaSent(true);
              }}
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
              <svg width="20" height="20" className="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#comment"></use></svg>
              إرسال الترحيب على الواتساب
            </a>
          </>
        )}
        <div style={{ marginTop: "1.6rem" }}>
          <a href="/admin/clients" className="muted" style={{ fontSize: "13px" }}>
            الرجوع لقائمة العملاء <svg className="ui-icon" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="/icons/ui.svg#arrow-left"></use></svg>
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
      <div className="field">
        <label>نوع الخدمة</label>
        <select
          name="service_type"
          required
          defaultValue=""
          style={{
            width: "100%",
            padding: "10px 8px",
            borderRadius: "10px",
            border: "1px solid #e2d8cb",
            background: "#fff",
            fontFamily: "inherit",
            fontSize: "13px",
          }}
        >
          <option value="" disabled>
            اختر نوع الخدمة
          </option>
          {SERVICE_TYPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <small className="muted" style={{ display: "block", marginTop: "4px" }}>
          حاليًا العرض والخطوات الجاهزة تلقائيًا مفعّلة لمدونة بلوجر فقط، والباقي هيتفعّل تباعًا.
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
