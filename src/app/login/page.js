"use client";

import { useState, useEffect, Suspense } from "react";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { usePathname, useSearchParams } from "next/navigation";

function EyeIcon({ off }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.94 4.24M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Shared login screen for the two staff roles — the tab picked determines
// which sign-in endpoint gets hit and where a successful login lands.
// Deep-linking (e.g. middleware bouncing an unauthenticated /admin/clients
// visit here) sets both ?role= and ?next= so the right tab is preselected
// and the redirect still lands exactly where they were headed.
//
// Project owners deliberately have NO tab here: they never sign in with an
// email or a password — they enter only through the one-time WhatsApp login
// link. A client tab was removed once (ea05c99) and accidentally restored by
// a later sweep (bd94902); do not add one back.
const ROLES = {
  admin: {
    label: "المدير",
    heading: "بوابة مدير المنصة",
    sub: "دخول آمن للمدير — سجّل دخولك بالبريد وكلمة السر.",
    endpoint: "/auth/admin-signin",
    loginPath: "/admin/login",
    defaultNext: "/admin",
  },
  team: {
    label: "فريق العمل",
    heading: "بوابة فريق العمل",
    sub: "سجّلي دخولك بالبريد الإلكتروني وكلمة السر.",
    endpoint: "/auth/signin",
    loginPath: "/team/login",
    defaultNext: "/team",
  },
};

// Fingerprint glyph for the passkey button (no emoji icons on this site).
function FingerprintIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 11c0 3.5-1 6.5-2.6 9" />
      <path d="M8.5 7.6A5 5 0 0 1 17 11c0 1.3-.1 2.6-.4 3.8" />
      <path d="M5.7 9.2A8 8 0 0 1 19.9 9.5" />
      <path d="M6.4 16.3A15 15 0 0 0 7 11a5 5 0 0 1 .4-2" />
      <path d="M14.6 21c.4-1.3.8-2.8 1-4.4" />
      <path d="M4.3 13.3c.2-.9.3-1.6.3-2.3 0-1.4.3-2.7.9-3.9" />
    </svg>
  );
}

function LoginForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedRole =
    pathname === "/team/login"
      ? "team"
      : pathname === "/admin/login"
        ? "admin"
        : searchParams.get("role");
  const role = ROLES[requestedRole] ? requestedRole : "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | error | sent
  const [errorMsg, setErrorMsg] = useState(null);
  const [mode, setMode] = useState("login"); // login | forgot
  // Passkey sign-in (admin only). Rendered only when the browser supports
  // WebAuthn — checked after mount, since the server has no `window`.
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState(null);

  useEffect(() => {
    setPasskeySupported(browserSupportsWebAuthn());
  }, []);

  async function handlePasskey() {
    setPasskeyError(null);
    setPasskeyLoading(true);
    try {
      const optionsRes = await fetch("/auth/passkey/login-options", { method: "POST" });
      if (!optionsRes.ok) throw new Error("options");
      const optionsJSON = await optionsRes.json();
      const assertion = await startAuthentication({ optionsJSON });
      const res = await fetch("/auth/passkey/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setPasskeyError(body?.error || "تعذّر الدخول بالبصمة.");
        setPasskeyLoading(false);
        return;
      }
      window.location.href = searchParams.get("next") || ROLES.admin.defaultNext;
    } catch (e) {
      setPasskeyLoading(false);
      // Cancelled, or this device holds no Kareem Pro passkey yet — the
      // browser reports both the same way, so one message covers both.
      setPasskeyError(
        e?.name === "NotAllowedError"
          ? "تم الإلغاء. لو البصمة مش مفعّلة على الجهاز ده، ادخل بكلمة السر مرة وفعّلها من القائمة الجانبية."
          : "تعذّر الدخول بالبصمة على هذا الجهاز."
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    const res = await fetch(ROLES[role].endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ROLES[role].passwordless ? { email } : { email, password }),
    });

    if (!res.ok) {
      // Surface the server's own message when it has one (e.g. "this isn't
      // an admin account") — fall back to the generic wrong-credentials line.
      const body = await res.json().catch(() => null);
      setErrorMsg(body?.error && res.status === 403 ? body.error : null);
      setStatus("error");
      return;
    }

    if (ROLES[role].passwordless) {
      setStatus("sent");
      return;
    }

    // Hand the credentials to the browser's password manager right away, so
    // the next visit is one tap (Face ID / Touch ID on Apple devices, the
    // saved-password prompt on Chrome). PasswordCredential exists in Chromium
    // browsers only; Safari/iCloud Keychain picks the login up from the named
    // form fields below instead. Never blocks the redirect.
    try {
      if (window.PasswordCredential && navigator.credentials?.store) {
        await navigator.credentials.store(new window.PasswordCredential({ id: email, password, name: email }));
      }
    } catch {}

    window.location.href = searchParams.get("next") || ROLES[role].defaultNext;
  }

  async function handleForgot(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    const res = await fetch("/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

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

        <div className="admin-auth-card">
          <div className="role-tabs">
            {Object.entries(ROLES).map(([key, r]) => (
              <a
                key={key}
                href={r.loginPath}
                className={`role-tab${role === key ? " active" : ""}`}
                aria-current={role === key ? "page" : undefined}
                onClick={() => {
                  setStatus("idle");
                  setErrorMsg(null);
                  setMode("login");
                }}
              >
                {r.label}
              </a>
            ))}
          </div>

          <h1 className="title">{mode === "forgot" ? "استعادة كلمة السر" : ROLES[role].heading}</h1>
          <p className="muted">
            {mode === "forgot"
              ? "اكتب بريدك الإلكتروني وهنبعت لك رابط تعيين كلمة سر جديدة."
              : ROLES[role].sub}
          </p>

          {role === "admin" && mode === "login" && passkeySupported && (
            <>
              <button type="button" className="passkey-btn" onClick={handlePasskey} disabled={passkeyLoading}>
                <FingerprintIcon />
                {passkeyLoading ? "لحظة واحدة..." : "الدخول بالبصمة"}
              </button>
              {passkeyError && (
                <div className="notice notice-error" style={{ marginTop: "0.8rem", textAlign: "start" }}>
                  {passkeyError}
                </div>
              )}
              <div className="auth-divider">أو بالبريد وكلمة السر</div>
            </>
          )}

          <form method="post" action={ROLES[role].loginPath} onSubmit={mode === "forgot" ? handleForgot : handleSubmit}>
            <div className="field">
              <label htmlFor="login-email">البريد الإلكتروني</label>
              <input
                id="login-email"
                name="username"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                dir="ltr"
                autoComplete="username"
              />
            </div>

            {mode === "login" && !ROLES[role].passwordless && (
              <div className="field">
                <label htmlFor="login-password">كلمة السر</label>
                <div className="password-field-wrap">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
                    tabIndex={-1}
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="notice notice-error">
                {errorMsg ||
                  (mode === "forgot"
                    ? "حصل خطأ، جرب تاني."
                    : ROLES[role].passwordless
                      ? "حصل خطأ، جرب تاني."
                      : "البريد أو كلمة السر غير صحيحة.")}
              </div>
            )}

            {status === "sent" && (
              <div className="notice" style={{ background: "rgba(46,204,113,.12)", border: "1px solid rgba(46,204,113,.35)", color: "#7be0a8" }}>
                {ROLES[role].passwordless
                  ? <>لو البريد ده مسجل عندنا، هيوصله رابط الدخول خلال دقائق. افحص صندوق الوارد و&quot;الرسائل غير المرغوبة&quot;.</>
                  : <>لو البريد ده مسجل عندنا، هيوصله رابط تعيين كلمة سر جديدة خلال دقائق. افحص صندوق الوارد و&quot;الرسائل غير المرغوبة&quot;.</>}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={status === "loading" || status === "sent"}
            >
              {status === "loading"
                ? "لحظة واحدة..."
                : mode === "forgot"
                ? "إرسال رابط الاستعادة"
                : ROLES[role].passwordless
                  ? "إرسال رابط الدخول"
                  : "تسجيل الدخول"}
            </button>

            {!ROLES[role].passwordless && <button
                type="button"
                className="muted"
                style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}
                onClick={() => {
                  setMode(mode === "forgot" ? "login" : "forgot");
                  setStatus("idle");
                  setErrorMsg(null);
                }}
              >
                {mode === "forgot" ? "رجوع لتسجيل الدخول" : "نسيت كلمة السر ؟"}
              </button>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
