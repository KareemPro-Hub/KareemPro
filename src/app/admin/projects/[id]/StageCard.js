"use client";

import { useState, useTransition } from "react";
import RiyalIcon from "@/app/components/RiyalIcon";
import { advanceStage, updateStage, deleteStage } from "@/app/admin/actions";

const STATUS_META = {
  upcoming: { label: "لم تبدأ بعد", color: "#7a6a5a", bg: "rgba(120,100,80,.1)" },
  awaiting_payment: { label: "بانتظار السداد", color: "#c1590a", bg: "rgba(255,173,56,.18)" },
  paid: { label: "تم السداد", color: "#2f8a4e", bg: "rgba(47,138,78,.14)" },
  in_progress: { label: "جاري التنفيذ", color: "#2a6fb0", bg: "rgba(42,111,176,.12)" },
  completed: { label: "مكتملة", color: "#2f8a4e", bg: "rgba(47,138,78,.14)" },
};

const NEXT_ACTION = {
  upcoming: { target: "awaiting_payment", label: "اطلب السداد الآن" },
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
  const meta = STATUS_META[stage.status] || STATUS_META.upcoming;

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
      <div className="proj-detail-row">
        <div className="proj-detail-row-text">
          <form action={handleSave} className="proj-detail-edit-form">
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
              <label>
                المبلغ <RiyalIcon size="0.75em" />
              </label>
              <input type="number" name="amount" min="0" step="0.01" required defaultValue={stage.amount} />
            </div>
            <div className="proj-detail-edit-actions">
              <button type="submit" className="proj-detail-btn primary" disabled={isPending}>
                {isPending ? "جارِ الحفظ..." : "حفظ"}
              </button>
              <button
                type="button"
                className="proj-detail-btn"
                onClick={() => setIsEditing(false)}
                disabled={isPending}
              >
                إلغاء
              </button>
            </div>
            {error && (
              <div className="notice notice-error" style={{ marginTop: "0.6rem" }}>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="proj-detail-row">
      <div className="proj-detail-row-text">
        <div className="proj-detail-row-title">{stage.title}</div>
        {stage.description && <div className="proj-detail-row-desc">{stage.description}</div>}
        <div className="proj-detail-row-amount">
          <span dir="ltr">{Number(stage.amount).toLocaleString("en-US")}</span>
          <RiyalIcon size="0.6em" />
        </div>

        <div className="proj-detail-row-actions">
          <button
            type="button"
            className="proj-detail-btn"
            onClick={() => setIsEditing(true)}
            disabled={isPending}
          >
            تعديل
          </button>

          {action && (
            <button
              className="proj-detail-btn primary"
              onClick={() => run(action.target)}
              disabled={isPending}
            >
              {isPending ? "جارِ التنفيذ..." : action.label}
            </button>
          )}

          {prevStatus && (
            <button className="proj-detail-btn" onClick={handleCancel} disabled={isPending}>
              {isPending ? "جارِ الإلغاء..." : "إلغاء"}
            </button>
          )}

          <button
            type="button"
            className="proj-detail-btn danger"
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

      <div className="proj-detail-row-node-col">
        <span className="proj-detail-node">{stage.stage_number}</span>
        <span className="proj-detail-status-badge" style={{ color: meta.color, background: meta.bg }}>
          {meta.label}
        </span>
      </div>
    </div>
  );
}
