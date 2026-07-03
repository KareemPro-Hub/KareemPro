"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
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
          لوحة <span className="g-text">التحكم</span>
        </h1>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          دخول المدير فقط.
        </p>

        {status === "sent" ? (
          <div className="notice notice-ok">
            تم إرسال رابط الدخول إلى <strong>{email}</strong>.
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
                dir="ltr"
              />
            </div>
            {status === "error" && (
              <div className="notice notice-error">حصل خطأ — حاول تاني.</div>
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
