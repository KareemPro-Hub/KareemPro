"use client";

import { useState, useTransition } from "react";
import { cancelProjectDiscount } from "@/app/admin/actions";

export default function CancelDiscountButton({ projectId }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  function handleClick() {
    if (!window.confirm("متأكد إنك عايز تلغي الخصم وترجع السعر والمراحل زي ما كانت قبل الخصم؟")) return;
    setError(null);
    startTransition(async () => {
      try {
        await cancelProjectDiscount(projectId);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <button type="button" className="proj-detail-discount-cancel" onClick={handleClick} disabled={isPending}>
        {isPending ? "جارِ الإلغاء..." : "إلغاء الخصم"}
      </button>
      {error && (
        <div className="notice notice-error" style={{ fontSize: "0.8em" }}>
          {error}
        </div>
      )}
    </div>
  );
}
