"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/portal";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [otpStatus, setOtpStatus] = useState("idle"); // idle | sending | sent | error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    window.location.href = next;
  }

  async function handleSendSetupLink() {
    if (!email) {
      setOtpStatus("error");
      return;
    }
    setOtpStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/set-password`,
      },
    });
    setOtpStatus(error ? "error" : "sent");
  }

  return (
    <div className="shell-narrow">
      <a href="/" className="brand-row">
        <img src="/logo-transparent.png" alt="Kareem Pro" />
        <span>KAREEM PRO</span>
      </a>

      <div className="card">
        <h1 className="title">
          بوابة <span className="g-text">العملاء</span>
        </h1>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          سجّل دخولك بالبريد الإلكتروني وكلمة السر بتاعة حسابك.
        </p>

        {otpStatus === "sent" ? (
          <div className="notice notice-ok">
            بعتنالك رابط على <strong dir="ltr">{email}</strong> — افتح بريدك واضغط عليه
            عشان تحدد كلمة سر لحسابك.
          </div>
        ) : (
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
              />
            </div>
            <div className="field">
              <label>كلمة السر</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
              />
            </div>

            {status === "error" && (
              <div className="notice notice-error">
                البريد أو كلمة السر غير صحيحة، أو لسه مفيش كلمة سر متحددة لحسابك.
              </div>
            )}
            {otpStatus === "error" && (
              <div className="notice notice-error">اكتب بريدك الإلكتروني الأول.</div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={status === "loading"}
            >
              {status === "loading" ? "جارِ الدخول..." : "تسجيل الدخول"}
            </button>

            <button
              type="button"
              onClick={handleSendSetupLink}
              className="muted"
              style={{
                background: "none",
                border: "none",
                textDecoration: "underline",
                cursor: "pointer",
                marginTop: "1.2rem",
                padding: 0,
                display: "block",
                width: "100%",
                textAlign: "center",
              }}
              disabled={otpStatus === "sending"}
            >
              {otpStatus === "sending"
                ? "جارِ الإرسال..."
                : "أول مرة تدخل ولسه معملتش كلمة سر؟"}
            </button>
          </form>
        )}
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
