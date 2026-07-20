"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { deleteClient, resendInvite, generateClientLoginLink } from "@/app/admin/actions";
import { MoreIcon, TrashIcon, RefreshIcon, CheckIcon } from "./AdminIcons";
import { buildWhatsAppUrl, welcomeMessage } from "@/lib/whatsapp";

export default function ClientActions({ clientId, clientName, clientPhone }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [isDeleting, startDelete] = useTransition();
  const [isResending, startResend] = useTransition();
  const [isCopying, startCopy] = useTransition();
  const [error, setError] = useState(null);
  const [resent, setResent] = useState(false);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const isPending = isDeleting || isResending || isCopying;
  const closeMenu = useCallback(() => setOpen(false), []);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 220;
      setCoords({
        top: rect.bottom + 8,
        left: Math.min(Math.max(rect.right - menuWidth, 8), window.innerWidth - menuWidth - 8),
      });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        closeMenu();
      }
    }
    function handleScrollOrResize() {
      closeMenu();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, closeMenu]);

  function handleDelete() {
    const ok = window.confirm(
      `متأكد إنك عايز تحذف "${clientName}" ؟ هيتحذف حسابه ومشاريعه كلها نهائيًا، وهيقدر يسجل تاني كأنه عميل جديد.`
    );
    if (!ok) return;

    setError(null);
    startDelete(async () => {
      try {
        await deleteClient(clientId);
        closeMenu();
      } catch (e) {
        setError(e.message || "حصل خطأ أثناء الحذف");
      }
    });
  }

  function handleResend() {
    setError(null);
    setResent(false);
    startResend(async () => {
      try {
        await resendInvite(clientId);
        setResent(true);
      } catch (e) {
        setError(e.message || "حصل خطأ أثناء إرسال الرابط");
      }
    });
  }

  // Generates a fresh one-time direct-login URL, then either opens the
  // client's WhatsApp chat with the full welcome message pre-typed (when a
  // phone is on file) or falls back to copying the bare link to the
  // clipboard so Kareem can paste it anywhere.
  function handleCopyLoginLink() {
    setError(null);
    setCopied(false);
    startCopy(async () => {
      try {
        const url = await generateClientLoginLink(clientId);
        if (clientPhone) {
          const waUrl = buildWhatsAppUrl(
            clientPhone,
            welcomeMessage({ clientName, loginUrl: url })
          );
          window.open(waUrl, "_blank", "noopener,noreferrer");
        } else {
          await navigator.clipboard.writeText(url);
        }
        setCopied(true);
      } catch (e) {
        setError(e.message || "حصل خطأ أثناء إنشاء الرابط");
      }
    });
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="more"
        onClick={(e) => {
          e.preventDefault();
          open ? closeMenu() : openMenu();
        }}
        aria-label="خيارات صاحب المشروع"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      >
        <MoreIcon />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              zIndex: 9999,
              width: "220px",
              background: "#ffffff",
              border: "1px solid #e9eef6",
              borderRadius: "14px",
              boxShadow: "0 16px 40px rgba(20,40,70,.24)",
              padding: "10px",
              textAlign: "right",
              fontFamily: "inherit",
            }}
          >
            <button
              type="button"
              disabled={isPending}
              onClick={handleResend}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                textAlign: "right",
                background: "#fff",
                border: 0,
                borderRadius: "8px",
                padding: "9px 8px",
                fontSize: "13px",
                fontFamily: "inherit",
                color: "#172541",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {resent ? <CheckIcon /> : <RefreshIcon />}
              <span style={{ flex: 1 }}>
                {isResending ? "جارِ الإرسال..." : resent ? "تم إرسال الرابط" : "إعادة إرسال إيميل الدخول"}
              </span>
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleCopyLoginLink}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                textAlign: "right",
                background: "#fff",
                border: 0,
                borderRadius: "8px",
                padding: "9px 8px",
                fontSize: "13px",
                fontFamily: "inherit",
                color: "#172541",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {copied ? (
                <CheckIcon />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              )}
              <span style={{ flex: 1 }}>
                {isCopying
                  ? "جارِ تجهيز الرسالة..."
                  : copied
                  ? clientPhone
                    ? "اتفتح الواتساب — اضغط إرسال ✅"
                    : "الرابط اتنسخ ✅"
                  : "رسالة ترحيب واتساب (رابط دخول)"}
              </span>
            </button>

            <div style={{ height: "1px", background: "#e9eef6", margin: "8px 0" }} />

            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                width: "100%",
                textAlign: "right",
                background: "#fdecef",
                border: "1px solid #f7c9d3",
                borderRadius: "8px",
                padding: "9px 8px",
                fontSize: "13px",
                fontFamily: "inherit",
                color: "#c81e3f",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              <TrashIcon /> {isDeleting ? "جارِ الحذف..." : "حذف صاحب المشروع نهائيًا"}
            </button>

            {error && (
              <div style={{ fontSize: "11px", color: "#e0234a", padding: "6px 8px 0" }}>{error}</div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
