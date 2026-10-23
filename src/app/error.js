"use client";

// Branded Arabic error boundary — shown instead of Next.js's default English
// crash screen if anything throws while rendering a page. `reset()` re-renders
// the segment, which recovers from transient hiccups (network blip, etc.).
export default function Error({ error, reset }) {
  return (
    <div className="admin-auth-page">
      <div className="admin-auth-glow admin-auth-glow-1" />
      <div className="admin-auth-glow admin-auth-glow-2" />
      <div className="admin-auth-glow admin-auth-glow-3" />

      <div className="admin-auth-content">
        <a href="/" className="admin-auth-brand">
          <img src="/logo-transparent.png" alt="Kareem Pro" />
          <span>KAREEM PRO</span>
        </a>

        <div className="admin-auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "44px", lineHeight: 1.3 }}><svg className="ui-icon" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="/icons/ui.svg#info"></use></svg></div>
          <h1 className="title">حصل خطأ غير متوقع</h1>
          <p className="muted" style={{ marginBottom: "1.6rem" }}>
            معلش، حاجة ما مشيتش صح. جرب تاني — ولو المشكلة استمرت كلمنا على الواتساب.
          </p>
          <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={() => reset()}>
            إعادة المحاولة
          </button>
          <a href="/" className="muted" style={{ display: "block", marginTop: "14px", fontSize: "13px" }}>
            أو الرجوع للصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
