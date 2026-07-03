"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/portal";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          next
        )}`,
      },
    });
    setStatus(error ? "error" : "sent");
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
          سجّل دخولك بالبريد الإلكتروني اللي تواصلنا بيه — هنبعتلك رابط دخول آمن، بدون كلمة سر.
        </p>

        {status === "sent" ? (
          <div className="notice notice-ok">
            تم إرسال رابط الدخول إلى <strong>{email}</strong> — افتح بريدك واضغط على الرابط لتسجيل الدخول.
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
            {status === "error" && (
              <div className="notice notice-error">
                حصل خطأ أثناء الإرسال — تأكد من البريد وحاول مرة أخرى.
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={status === "sending"}
            >
              {status === "sending" ? "جارِ الإرسال..." : "إرسال رابط الدخول"}
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
