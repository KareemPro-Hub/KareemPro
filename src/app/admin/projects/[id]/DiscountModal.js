"use client";

import { useRef, useState, useTransition } from "react";
import { applyProjectDiscount } from "@/app/admin/actions";
import RiyalIcon from "@/app/components/RiyalIcon";

export default function DiscountModal({ projectId, packagePrice }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  function handleSubmit(formData) {
    setError(null);
    startTransition(async () => {
      try {
        await applyProjectDiscount(formData);
        formRef.current?.reset();
        setOpen(false);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <>
      <button type="button" className="proj-detail-discount-trigger" onClick={() => setOpen(true)}>
        🏷️ تطبيق خصم
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
              <div className="proj-detail-modal-title">تطبيق خصم على المشروع</div>
            </div>

            <form ref={formRef} action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="hidden" name="project_id" value={projectId} />
              <p className="muted" style={{ margin: 0, fontSize: "0.85em" }}>
                قيمة الباقة الحالية: <b>{Number(packagePrice).toLocaleString("en-US")}</b> ريال. الخصم
                هينزل من آخر المراحل اللي لسه ما اتدفعتش، والمراحل اللي اتدفعت فعلًا مش هتتأثر.
              </p>
              <div className="field">
                <label>
                  مبلغ الخصم <RiyalIcon size="0.75em" />
                </label>
                <input type="number" name="discount_amount" min="1" step="0.01" required autoFocus />
              </div>
              <div className="field">
                <label>سبب الخصم (اختياري)</label>
                <textarea name="note" rows={2} placeholder="مثال: خصم توقيع مبكر" />
              </div>
              <div className="proj-detail-modal-actions">
                <button type="submit" className="proj-detail-btn primary" disabled={isPending}>
                  {isPending ? "جارِ التطبيق..." : "تطبيق الخصم"}
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
