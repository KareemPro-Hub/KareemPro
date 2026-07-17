// Branded Arabic 404 — replaces Next.js's default English not-found screen.
// Reuses the same dark "auth" design language as the shared /login page.
export default function NotFound() {
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
          <div style={{ fontSize: "56px", fontWeight: 900, lineHeight: 1.2, background: "linear-gradient(135deg,#FFA826,#FF5535,#D9187A)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            404
          </div>
          <h1 className="title">الصفحة دي مش موجودة</h1>
          <p className="muted" style={{ marginBottom: "1.6rem" }}>
            يمكن الرابط اتكتب غلط، أو الصفحة اتنقلت لمكان تاني.
          </p>
          <a href="/" className="btn btn-primary" style={{ width: "100%", display: "inline-block", textAlign: "center", textDecoration: "none" }}>
            الرجوع للصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
