"use client";

import { useState, useTransition } from "react";
import { deleteClient, resendInvite } from "@/app/admin/actions";

export default function ClientActions({ clientId, clientName }) {
  const [isDeleting, startDelete] = useTransition();
  const [isResending, startResend] = useTransition();
  const [error, setError] = useState(null);
  const [resent, setResent] = useState(false);

  function handleDelete() {
    const ok = window.confirm(
      `متأكد إنك عايز تحذف "${clientName}"؟ هيتحذف حسابه ومشاريعه كلها نهائيًا، وهيقدر يسجل تاني كأنه عميل جديد.`
    );
    if (!ok) return;

    setError(null);
    startDelete(async () => {
      try {
        await deleteClient(clientId);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={handleResend}
        disabled={isResending}
      >
        {isResending ? "جارِ الإرسال..." : resent ? "تم الإرسال ✅" : "إعادة إرسال رابط الدعوة"}
      </button>

      <button
        type="button"
        className="btn btn-outline btn-sm btn-danger"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "جارِ الحذف..." : "حذف"}
      </button>

      {error && (
        <div className="notice notice-error" style={{ marginTop: "0.2rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
