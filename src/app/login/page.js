"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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

// One shared login screen for all three roles — the tab picked determines
// which sign-in endpoint gets hit and where a successful login lands.
// Deep-linking (e.g. middleware bouncing an unauthenticated /admin/clients
// visit here) sets both ?role= and ?next= so the right tab is preselected
// and the redirect still lands exactly where they were headed.
const ROLES = {
  admin: {
    label: "المدير",
    heading: "بوابة مدير المنصة",
    sub: "دخول آمن للمدير — سجّل دخولك بالبريد وكلمة السر.",
    endpoint: "/auth/admin-signin",
    defaultNext: "/admin",
  },
  client: {
    label: "النخبة",
    heading: "بوابة صناع الإبداع",
    sub: "سجّل دخولك بالبريد الإلكتروني وكلمة السر.",
    endpoint: "/auth/signin",
    defaultNext: "/portal",
  },
  team: {
    label: "فريق العمل",
    heading: "بوابة فريق العمل",
    sub: "سجّلي دخولك بالبريد الإلكتروني وكلمة السر.",
    endpoint: "/auth/signin",
    defaultNext: "/team",
  },
};

function LoginForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role");
  const [role, setRole] = useState(ROLES[initialRole] ? initialRole : "client");
  const next = searchParams.get("next") || ROLES[role].defaultNext;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch(ROLES[role].endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    window.location.href = searchParams.get("next") || ROLES[role].defaultNext;
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
              <button
                key={key}
                type="button"
                className={`role-tab${role === key ? " active" : ""}`}
                onClick={() => {
                  setRole(key);
                  setStatus("idle");
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <h1 className="title">{ROLES[role].heading}</h1>
          <p className="muted">{ROLES[role].sub}</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                dir="ltr"
                autoComplete="username"
              />
            </div>

            <div className="field">
              <label>كلمة السر</label>
              <div className="password-field-wrap">
                <input
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

            {status === "error" && (
              <div className="notice notice-error">
                البريد أو كلمة السر غير صحيحة.
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={status === "loading"}
            >
              {status === "loading" ? "جارِ الدخول..." : "تسجيل الدخول"}
            </button>
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
