"use client";

import { useState, useTransition } from "react";
import {
  openWhatsApp,
  welcomeMessage,
  paymentRequestMessage,
  paymentConfirmedMessage,
  overduePaymentMessage,
  progressMessage,
  discountMessage,
  newFileMessage,
} from "@/lib/whatsapp";
import { getProjectLoginLink } from "@/app/admin/actions";

// Message builders keyed by kind. Callers pass plain data (`kind` + `data`)
// rather than a function, because a Server Component may render this button
// and functions can't cross the server→client boundary.
const BUILDERS = {
  welcome: welcomeMessage,
  paymentRequest: paymentRequestMessage,
  paymentConfirmed: paymentConfirmedMessage,
  overduePayment: overduePaymentMessage,
  progress: progressMessage,
  discount: discountMessage,
  newFile: newFileMessage,
};

// Small green WhatsApp action button — opens the client's chat with a
// pre-typed message (nothing is ever sent automatically; Kareem presses
// Send himself inside WhatsApp).
//
// The login link is minted at CLICK time, not at page render: rendering the
// page must never issue tokens, and the link inside the message has to be
// live when it's sent. When `data.loginUrl` is already set (the action that
// just ran returned one), that link is used as-is instead.
//
// Goes through openWhatsApp() rather than a plain href because the macOS
// WhatsApp desktop app mangles emoji in prefilled text (they arrive as "?"),
// while WhatsApp Web handles them correctly — see lib/whatsapp.js.
export default function WhatsAppButton({ phone, kind, data, projectId, label, small = false }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const build = BUILDERS[kind];
  if (!phone || !build) return null;

  function handleClick(e) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const loginUrl =
          data?.loginUrl || (projectId ? await getProjectLoginLink(projectId) : null);
        await openWhatsApp(phone, build({ ...data, loginUrl }));
      } catch (err) {
        setError(err.message || "تعذر تجهيز الرسالة");
      }
    });
  }

  return (
    <>
      <a
        href="#"
        onClick={handleClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: small ? "7px 14px" : "9px 18px",
          borderRadius: "10px",
          background: "#25d366",
          color: "#ffffff",
          fontSize: small ? "12.5px" : "13.5px",
          fontWeight: 700,
          textDecoration: "none",
          lineHeight: 1,
          whiteSpace: "nowrap",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        <svg width={small ? 14 : 16} height={small ? 14 : 16} className="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#comment"></use></svg>
        {isPending ? "لحظة..." : label}
      </a>
      {error && <span style={{ fontSize: "11px", color: "#c81e3f" }}>{error}</span>}
    </>
  );
}
