"use client";

import { useRef, useState, useTransition } from "react";
import { addStage } from "@/app/admin/actions";

export default function AddStageModal({ projectId }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  function handleSubmit(formData) {
    setError(null);
    startTransition(async () => {
      try {
        await addStage(formData);
        formRef.current?.reset();
        setOpen(false);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <>
      <button type="button" className="proj-detail-add-trigger" onClick={() => setOpen(true)}>
        + إضافة مرحلة سداد
      </button>

      {open && (
        <div className="proj-detail-modal-overlay" onClick={() => !isPending && setOpen(false)}>
          <div className="proj-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="proj-detail-modal-head">
              <button
                type="button"
                className="proj-detail-modal-close"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                ✕
              </button>
              <div className="proj-detail-modal-title">إضافة مرحلة سداد</div>
            </div>

            <form ref={formRef} action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="hidden" name="project_id" value={projectId} />
              <div className="field">
                <label>عنوان المرحلة</label>
                <input type="text" name="title" required placeholder="مثال: الدفعة الأولى" />
              </div>
              <div className="field">
                <label>وصف مختصر (اختياري)</label>
                <textarea name="description" rows={2} />
              </div>
              <div className="field">
                <label>المبلغ (ريال)</label>
                <input type="number" name="amount" min="0" step="0.01" required />
              </div>
              <div className="proj-detail-modal-actions">
                <button type="submit" className="proj-detail-btn primary" disabled={isPending}>
                  {isPending ? "جارِ الحفظ..." : "حفظ المرحلة"}
                </button>
                <button
                  type="button"
                  className="proj-detail-btn"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  إلغاء
                </button>
              </div>
              {error && (
                <div className="notice notice-error" style={{ marginTop: "0.2rem" }}>
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
