"use client";

import { useEffect, useState } from "react";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";

// The server verifies this admin's saved registration on every mount.
// A local browser hint cannot prove either registration or its removal.

export default function PasskeySetup() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(null);
  const [state, setState] = useState("checking");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const supports = browserSupportsWebAuthn();
    setSupported(supports);
    const controller = new AbortController();
    if (supports) checkStatus(controller.signal);
    return () => controller.abort();
  }, []);

  async function checkStatus(signal) {
    setState("checking");
    setMessage(null);
    try {
      const res = await fetch("/auth/passkey/status", { cache: "no-store", signal });
      if (!res.ok) throw new Error("status");
      const body = await res.json();
      if (typeof body.enabled !== "boolean") throw new Error("status");
      if (signal?.aborted) return;
      setEnabled(body.enabled);
      setState("idle");
    } catch (e) {
      if (signal?.aborted) return;
      setState("error");
      setMessage("تعذّر التحقق من حالة البصمة.");
    }
  }

  function markDone() {
    setEnabled(true);
    setState("idle");
    setMessage(null);
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
      if (e?.name === "InvalidStateError") return checkStatus();
      setState("error");
      setMessage(e?.name === "NotAllowedError" ? "تم الإلغاء." : "تعذّر تفعيل البصمة على هذا الجهاز.");
    }
  }

  if (!supported) return null;

  if (enabled) {
    return (
      <div className="passkey-setup-wrap">
      <div className="passkey-setup is-done" role="status">
        <svg aria-hidden="true" className="ui-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#check"></use></svg>
        تم تفعيل البصمة
      </div>
      <button type="button" onClick={register} disabled={state === "loading"}
        style={{ display: "block", margin: "6px auto 0", background: "none", border: 0, color: "#ead7ca", font: "inherit", fontSize: 11, cursor: "pointer" }}>
        {state === "loading" ? "لحظة واحدة..." : "إضافة بصمة أخرى"}
      </button>
      {message && <p className="passkey-setup-msg" role="alert">{message}</p>}
      </div>
    );
  }

  return (
    <div className="passkey-setup-wrap">
      <button type="button" className="passkey-setup" onClick={enabled === null ? () => checkStatus() : register} disabled={state === "loading" || state === "checking"}>
        <svg aria-hidden="true" className="ui-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#fingerprint"></use></svg>
        {state === "checking" ? "جارِ التحقق من البصمة..." : state === "loading" ? "لحظة واحدة..." : enabled === null ? "إعادة التحقق" : "تفعيل الدخول بالبصمة"}
      </button>
      {message && <p className="passkey-setup-msg">{message}</p>}
    </div>
  );
}
