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

// If the admin advanced a stage by mistake, "إلغاء" reverts it one step back
// to the status it had before — a plain, no-drama undo.
const PREV_STATUS = {
  awaiting_payment: "upcoming",
  paid: "awaiting_payment",
  in_progress: "paid",
  completed: "in_progress",
};

export default function StageActions({ stageId, status }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const action = NEXT_ACTION[status];
  const prevStatus = PREV_STATUS[status];

  function run(target) {
    setError(null);
    startTransition(async () => {
      try {
        await advanceStage(stageId, target);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function handleCancel() {
    if (!window.confirm("متأكد إنك عايز تلغي وترجع المرحلة للحالة السابقة؟")) return;
    run(prevStatus);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
        {status === "completed" && <span className="muted">اكتملت ✔</span>}
        {action && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => run(action.target)}
            disabled={isPending}
          >
            {isPending ? "جارِ التنفيذ..." : action.label}
          </button>
        )}
        {prevStatus && (
          <button
            className="btn btn-outline btn-sm btn-danger"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? "جارِ الإلغاء..." : "إلغاء"}
          </button>
        )}
      </div>
      {error && (
        <div className="notice notice-error" style={{ marginTop: "0.6rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
