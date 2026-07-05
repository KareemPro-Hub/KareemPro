"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Reached right after a client clicks their invite email link — they're
// already authenticated at this point (the code was exchanged in
// /auth/callback), they just need to pick a password so every future login
// is a normal email+password sign-in, no more emails required.
export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | error
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("كلمة السر لازم تكون 8 حروف/أرقام على الأقل");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا السر مش متطابقتين");
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setStatus("error");
      return;
    }

    window.location.href = "/portal";
  }

  return (
    <div className="shell-narrow">
      <a href="/" className="brand-row">
        <span>KAREEM PRO</span>
        <img src="/logo-transparent.png" alt="Kareem Pro" />
      </a>

      <div className="card">
        <h1 className="title">
          حسابك <span className="g-text">جاهز</span> تقريبًا
        </h1>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          خطوة أخيرة بسيطة — اختر كلمة سر لحسابك، وبعدها هتدخل بريدك وكلمة السر مباشرة في أي
          وقت من غير ما تستنى إيميل تاني.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>كلمة السر الجديدة</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="field">
            <label>تأكيد كلمة السر</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              dir="ltr"
            />
          </div>

          {error && <div className="notice notice-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={status === "saving"}
          >
            {status === "saving" ? "جارِ الحفظ..." : "حفظ ومتابعة إلى حسابي"}
          </button>
        </form>
      </div>
    </div>
  );
}
