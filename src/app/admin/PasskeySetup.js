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
  const [state, setState] = useState("idle"); // idle | loading | done | hidden | error
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    try {
      // Already enabled on this device: nothing to show at all.
      if (localStorage.getItem(DONE_KEY) === "1") setState("hidden");
    } catch {}
  }, []);

  // The "enabled" confirmation shows once, right after registering, then
  // disappears for good (Kareem: no need to see it on every visit).
  function markDone() {
    setState("done");
    setMessage(null);
    setTimeout(() => setState("hidden"), 4000);
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

  if (!supported || state === "hidden") return null;

  if (state === "done") {
    return (
      <div className="passkey-setup is-done">
        <svg aria-hidden="true" className="ui-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#check"></use></svg>
        البصمة مفعّلة على هذا الجهاز
      </div>
    );
  }

  return (
    <div className="passkey-setup-wrap">
      <button type="button" className="passkey-setup" onClick={register} disabled={state === "loading"}>
        <svg aria-hidden="true" className="ui-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#fingerprint"></use></svg>
        {state === "loading" ? "لحظة واحدة..." : "تفعيل الدخول بالبصمة"}
      </button>
      {message && <p className="passkey-setup-msg">{message}</p>}
    </div>
  );
}
