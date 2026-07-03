"use client";

import { useState, useTransition } from "react";
import { advanceStage } from "@/app/admin/actions";

const NEXT_ACTION = {
  upcoming: { target: "awaiting_payment", label: "اطلب السداد الآن (يرسل إيميل)" },
  awaiting_payment: { target: "paid", label: "تأكيد استلام الدفع" },
  paid: { target: "in_progress", label: "بدء تنفيذ المرحلة" },
  in_progress: { target: "completed", label: "إنهاء المرحلة" },
  completed: null,
};

export default function StageActions({ stageId, status }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const action = NEXT_ACTION[status];

  if (!action) return <span className="muted">اكتملت ✔</span>;

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await advanceStage(stageId, action.target);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <div>
      <button
        className="btn btn-primary btn-sm"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "جارِ التنفيذ..." : action.label}
      </button>
      {error && (
        <div className="notice notice-error" style={{ marginTop: "0.6rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
