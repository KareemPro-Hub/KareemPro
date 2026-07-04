"use client";

import { useState, useTransition } from "react";
import { deleteClient } from "@/app/admin/actions";

export default function ClientActions({ clientId, clientName }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  function handleDelete() {
    const ok = window.confirm(
      `متأكد إنك عايز تحذف "${clientName}"؟ هيتحذف حسابه ومشاريعه كلها نهائيًا، وهيقدر يسجل تاني كأنه عميل جديد.`
    );
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteClient(clientId);
      } catch (e) {
        setError(e.message || "حصل خطأ أثناء الحذف");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        style={{ color: "#ff9d84", borderColor: "rgba(255,85,53,0.4)" }}
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? "جارِ الحذف..." : "حذف"}
      </button>
      {error && (
        <div className="notice notice-error" style={{ marginTop: "0.5rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
