"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { deleteClient, generateClientLoginLink, updateClient } from "@/app/admin/actions";
import { MoreIcon, TrashIcon, CheckIcon } from "./AdminIcons";
import { openWhatsApp, welcomeMessage, DIAL_CODES, splitDialCode } from "@/lib/whatsapp";

export default function ClientActions({ clientId, clientName, clientPhone }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [isDeleting, startDelete] = useTransition();
  const [isCopying, startCopy] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const isPending = isDeleting || isCopying || isSaving;

  function handleSaveEdit(formData) {
    setError(null);

    // Same country-code + local-number split used by the new-client form,
    // so an existing client's number can be corrected to any country.
    const dial = formData.get("dial")?.toString() || "";
    const local = (formData.get("phone_local")?.toString() || "").replace(/\D/g, "").replace(/^0+/, "");
    formData.set("phone", local ? `+${dial}${local}` : "");

    startSave(async () => {
      try {
        await updateClient(formData);
        setEditing(false);
        closeMenu();
      } catch (e) {
        setError(e.message || "حصل خطأ أثناء الحفظ");
      }
    });
  }
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
          await openWhatsApp(clientPhone, welcomeMessage({ clientName, loginUrl: url }));
        } else {
          await navigator.clipboard.writeText(url);
        }
        setCopied(true);
      } catch (e) {
        setError(e.message || "حصل خطأ أثناء إنشاء الرابط");
      }
    });
  }

  // Copies ONLY the bare login link (no welcome text) so Kareem can paste it
  // straight into a browser or forward it. The link is reusable for its whole
  // lifetime (see lib/loginLinks.js), so anyone it's forwarded to gets in too.
  // clipboard.write() is called synchronously inside the
  // click with a pending ClipboardItem, because Safari rejects clipboard
  // writes that happen after an await (the server action).
  function handleCopyWelcomeMessage() {
    setError(null);
    setMsgCopied(false);
    const textPromise = generateClientLoginLink(clientId);
    startCopy(async () => {
      try {
        if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                "text/plain": textPromise.then((t) => new Blob([t], { type: "text/plain" })),
              }),
            ]);
          } catch {
            await navigator.clipboard.writeText(await textPromise);
          }
        } else {
          await navigator.clipboard.writeText(await textPromise);
        }
        setMsgCopied(true);
      } catch (e) {
        setError(e.message || "تعذر نسخ الرابط");
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
            {editing ? (
              <form action={handleSaveEdit} style={{ display: "grid", gap: "8px" }}>
                <input type="hidden" name="client_id" value={clientId} />
                <div>
                  <label style={{ fontSize: "11px", color: "#7a8699", display: "block", marginBottom: "3px" }}>
                    الاسم
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    defaultValue={clientName}
                    style={{ width: "100%", padding: "7px 8px", fontSize: "12.5px", borderRadius: "7px", border: "1px solid #e9eef6", fontFamily: "inherit" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#7a8699", display: "block", marginBottom: "3px" }}>
                    رقم الواتساب
                  </label>
                  <select
                    name="dial"
                    defaultValue={splitDialCode(clientPhone).dial}
                    style={{ width: "100%", padding: "7px 8px", fontSize: "12.5px", borderRadius: "7px", border: "1px solid #e9eef6", fontFamily: "inherit", background: "#fff", marginBottom: "6px" }}
                  >
                    {DIAL_CODES.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="phone_local"
                    dir="ltr"
                    placeholder="5xxxxxxxx"
                    defaultValue={splitDialCode(clientPhone).local}
                    style={{ width: "100%", padding: "7px 8px", fontSize: "12.5px", borderRadius: "7px", border: "1px solid #e9eef6", fontFamily: "inherit" }}
                  />
                  <div style={{ fontSize: "10.5px", color: "#9aa5b5", marginTop: "3px" }}>
                    اختر الدولة واكتب الرقم بدون الصفر الأول.
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="submit"
                    disabled={isPending}
                    style={{ flex: 1, background: "#172541", color: "#fff", border: 0, borderRadius: "7px", padding: "8px", fontSize: "12.5px", fontFamily: "inherit", cursor: "pointer", fontWeight: 700 }}
                  >
                    {isSaving ? "جارِ الحفظ..." : "حفظ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    disabled={isPending}
                    style={{ flex: 1, background: "#f3f6fa", color: "#172541", border: 0, borderRadius: "7px", padding: "8px", fontSize: "12.5px", fontFamily: "inherit", cursor: "pointer" }}
                  >
                    إلغاء
                  </button>
                </div>
                {error && <div style={{ fontSize: "11px", color: "#e0234a" }}>{error}</div>}
              </form>
            ) : (
              <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setError(null);
                setEditing(true);
              }}
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
              <svg width="15" height="15" className="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#edit"></use></svg>
              <span style={{ flex: 1 }}>
                {clientPhone ? "تعديل البيانات" : "إضافة رقم واتساب"}
              </span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              type="button"
              disabled={isPending}
              onClick={handleCopyLoginLink}
              style={{
                flex: 1,
                minWidth: 0,
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
                <svg width="15" height="15" className="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#copy"></use></svg>
              )}
              <span style={{ flex: 1 }}>
                {isCopying
                  ? "جارِ تجهيز الرسالة..."
                  : copied
                  ? clientPhone
                    ? "اتفتح الواتساب — اضغط إرسال"
                    : "الرابط اتنسخ"
                  : "رسالة ترحيب واتساب (رابط دخول)"}
              </span>
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleCopyWelcomeMessage}
              title="نسخ رابط الدخول"
              aria-label="نسخ رابط الدخول"
              style={{
                flexShrink: 0,
                width: "34px",
                height: "34px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: msgCopied ? "#e8f8ee" : "#f3f6fa",
                border: 0,
                borderRadius: "8px",
                color: msgCopied ? "#16a34a" : "#172541",
                cursor: "pointer",
              }}
            >
              {msgCopied ? (
                <CheckIcon />
              ) : (
                <svg width="15" height="15" className="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#copy"></use></svg>
              )}
            </button>
            </div>

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
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
