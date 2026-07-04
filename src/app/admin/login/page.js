"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      return;
    }

    window.location.href = "/admin";
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
          <span className="admin-auth-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            دخول آمن للمدير
          </span>

          <h1 className="title">
            لوحة <span className="g-text">التحكم</span>
          </h1>
          <p className="muted">دخول المدير فقط — بالبريد الإلكتروني وكلمة السر.</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@kareempro.com"
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
                بيانات الدخول غير صحيحة — تأكد من البريد وكلمة السر.
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={status === "loading"}
            >
              {status === "loading" ? "جارِ التحقق..." : "دخول لوحة التحكم"}
            </button>
          </form>
        </div>

        <p className="admin-auth-footnote">هذه اللوحة مخصصة لفريق Kareem Pro فقط</p>
      </div>
    </div>
  );
}
