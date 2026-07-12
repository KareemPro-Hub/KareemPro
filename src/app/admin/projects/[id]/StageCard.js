"use client";

import { useState, useTransition } from "react";
import RiyalIcon from "@/app/components/RiyalIcon";
import CheckIcon from "@/app/components/CheckIcon";
import { advanceStage, updateStage, deleteStage } from "@/app/admin/actions";

const STATUS_LABEL = {
  upcoming: "لم تبدأ بعد",
  awaiting_payment: "بانتظار السداد",
  paid: "تم السداد",
  in_progress: "جاري التنفيذ",
  completed: "مكتملة",
};

const NEXT_ACTION = {
  upcoming: { target: "awaiting_payment", label: "اطلب السداد الآن (يرسل إيميل)" },
  awaiting_payment: { target: "paid", label: "تأكيد استلام الدفع" },
  paid: { target: "in_progress", label: "بدء تنفيذ المرحلة" },
  in_progress: { target: "completed", label: "إنهاء المرحلة" },
  completed: null,
};

// If the admin advanced a stage by mistake, "إلغاء" reverts it one step back
// to the status it had before — a plain, no-drama undo. Doesn't delete anything.
const PREV_STATUS = {
  awaiting_payment: "upcoming",
  paid: "awaiting_payment",
  in_progress: "paid",
  completed: "in_progress",
};

export default function StageCard({ stage }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const action = NEXT_ACTION[stage.status];
  const prevStatus = PREV_STATUS[stage.status];

  function run(target) {
    setError(null);
    startTransition(async () => {
      try {
        await advanceStage(stage.id, target);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function handleCancel() {
    if (!window.confirm("متأكد إنك عايز تلغي وترجع المرحلة للحالة السابقة؟")) return;
    run(prevStatus);
  }

  function handleSave(formData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateStage(formData);
        setIsEditing(false);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        `متأكد إنك عايز تحذف مرحلة "${stage.title}"؟ هيتم حذفها نهائيًا من عندك وعند صاحب المشروع.`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteStage(stage.id);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  if (isEditing) {
    return (
      <div className={`stage ${stage.status}`}>
        <span className="stage-dot">{stage.stage_number}</span>
        <form action={handleSave} style={{ marginTop: "0.6rem" }}>
          <input type="hidden" name="stage_id" value={stage.id} />
          <div className="field">
            <label>عنوان المرحلة</label>
            <input type="text" name="title" required defaultValue={stage.title} />
          </div>
          <div className="field">
            <label>وصف مختصر (اختياري)</label>
            <textarea name="description" rows={2} defaultValue={stage.description || ""} />
          </div>
          <div className="field">
            <label>المبلغ (ريال)</label>
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              required
              defaultValue={stage.amount}
            />
          </div>
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.8rem" }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
              {isPending ? "جارِ الحفظ..." : "حفظ التعديل"}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsEditing(false)}
              disabled={isPending}
            >
              تراجع
            </button>
          </div>
          {error && (
            <div className="notice notice-error" style={{ marginTop: "0.6rem" }}>
              {error}
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className={`stage ${stage.status}`}>
      <span className="stage-dot">{stage.stage_number}</span>
      <div className="stage-head">
        <span className="stage-title">{stage.title}</span>
        <span className={`stage-status ${stage.status}`}>
          {STATUS_LABEL[stage.status] || stage.status}
        </span>
      </div>
      {stage.description && <p className="stage-desc">{stage.description}</p>}
      <p className="stage-amount">
        <span dir="ltr">{Number(stage.amount).toLocaleString("en-US")}</span>
        <RiyalIcon />
      </p>

      <div
        style={{
          marginTop: "0.9rem",
          display: "flex",
          gap: "0.6rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setIsEditing(true)}
          disabled={isPending}
        >
          تعديل
        </button>

        {stage.status === "completed" && (
          <span className="muted">
            اكتملت <CheckIcon size="0.85em" />
          </span>
        )}
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
            className="btn btn-outline btn-sm"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? "جارِ الإلغاء..." : "إلغاء"}
          </button>
        )}

        <button
          type="button"
          className="btn btn-outline btn-sm btn-danger"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? "جارِ الحذف..." : "حذف"}
        </button>
      </div>

      {error && (
        <div className="notice notice-error" style={{ marginTop: "0.6rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
