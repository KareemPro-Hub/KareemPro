"use client";

import { useEffect, useState } from "react";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";

// Sidebar button: "تفعيل الدخول بالبصمة" — registers a passkey for the
// signed-in admin on THIS device (Face ID / Touch ID / fingerprint). Once
// done, the admin login page's "الدخول بالبصمة" button signs in with one
// touch. The "already enabled" state is remembered per device in
// localStorage — a convenience only; the server is the source of truth.
const DONE_KEY = "kp_passkey_ok";

export default function PasskeySetup() {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    try {
      if (localStorage.getItem(DONE_KEY) === "1") setState("done");
    } catch {}
  }, []);

  function markDone() {
    setState("done");
    setMessage(null);
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {}
  }

  async function register() {
    setState("loading");
    setMessage(null);
    try {
      const optionsRes = await fetch("/auth/passkey/register-options", { method: "POST" });
      if (!optionsRes.ok) throw new Error("options");
      const optionsJSON = await optionsRes.json();
      const attestation = await startRegistration({ optionsJSON });
      const res = await fetch("/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attestation),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setState("error");
        setMessage(body?.error || "تعذّر تفعيل البصمة.");
        return;
      }
      markDone();
    } catch (e) {
      // InvalidStateError = this device already holds a passkey for this
      // admin (excludeCredentials matched) — that IS the goal, so say so.
      if (e?.name === "InvalidStateError") return markDone();
      setState("error");
      setMessage(e?.name === "NotAllowedError" ? "تم الإلغاء." : "تعذّر تفعيل البصمة على هذا الجهاز.");
    }
  }

  if (!supported) return null;

  if (state === "done") {
    return (
      <div className="passkey-setup is-done">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        البصمة مفعّلة على هذا الجهاز
      </div>
    );
  }

  return (
    <div className="passkey-setup-wrap">
      <button type="button" className="passkey-setup" onClick={register} disabled={state === "loading"}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 11c0 3.5-1 6.5-2.6 9" />
          <path d="M8.5 7.6A5 5 0 0 1 17 11c0 1.3-.1 2.6-.4 3.8" />
          <path d="M5.7 9.2A8 8 0 0 1 19.9 9.5" />
          <path d="M6.4 16.3A15 15 0 0 0 7 11a5 5 0 0 1 .4-2" />
          <path d="M14.6 21c.4-1.3.8-2.8 1-4.4" />
          <path d="M4.3 13.3c.2-.9.3-1.6.3-2.3 0-1.4.3-2.7.9-3.9" />
        </svg>
        {state === "loading" ? "لحظة واحدة..." : "تفعيل الدخول بالبصمة"}
      </button>
      {message && <p className="passkey-setup-msg">{message}</p>}
    </div>
  );
}
