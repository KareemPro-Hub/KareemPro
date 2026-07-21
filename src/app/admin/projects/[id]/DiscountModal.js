"use client";

import { useRef, useState, useTransition } from "react";
import { applyProjectDiscount } from "@/app/admin/actions";
import RiyalIcon from "@/app/components/RiyalIcon";
import WhatsAppButton from "./WhatsAppButton";

export default function DiscountModal({ projectId, packagePrice }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(null);
  const formRef = useRef(null);

  function handleSubmit(formData) {
    setError(null);
    startTransition(async () => {
      try {
        // The discount email (with its one-time login link) already went out
        // server-side; the returned data lets us offer the matching WhatsApp
        // message — sharing the SAME link, since a second one would kill it.
        const res = await applyProjectDiscount(formData);
        formRef.current?.reset();
        setApplied(res);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function closeAll() {
    setOpen(false);
    setApplied(null);
  }

  return (
    <>
      <button type="button" className="proj-detail-discount-trigger" onClick={() => setOpen(true)}>
        🏷️ تطبيق خصم
      </button>

      {open && (
        <div className="proj-detail-modal-overlay" onClick={() => !isPending && closeAll()}>
          <div className="proj-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="proj-detail-modal-head">
              <button
                type="button"
                className="proj-detail-modal-close"
                onClick={closeAll}
                disabled={isPending}
              >
                ✕
              </button>
              <div className="proj-detail-modal-title">
                {applied ? "تم تطبيق الخصم" : "تطبيق خصم على المشروع"}
              </div>
            </div>

            {applied ? (
              <div style={{ textAlign: "center", padding: "0.6rem 0 0.2rem" }}>
                <div style={{ fontSize: "34px", marginBottom: "8px" }}>🎉</div>
                <p className="muted" style={{ lineHeight: 1.9, marginBottom: "1.2rem" }}>
                  الخصم اتطبّق، والإشعار والإيميل وصلوا للعميل.
                  {applied.clientPhone
                    ? " فاضل تبعتله رسالة الواتساب — جاهزة مكتوبة وفيها رابط دخوله المباشر."
                    : " ضيف رقم واتساب للعميل لو حابب تبعتله الرسالة على الواتساب كمان."}
                </p>
                {applied.clientPhone && (
                  <WhatsAppButton
                    phone={applied.clientPhone}
                    kind="discount"
                    data={{
                      clientName: applied.clientName,
                      oldPrice: applied.oldPrice,
                      newPrice: applied.newPrice,
                      discountAmount: applied.discountAmount,
                      loginUrl: applied.loginUrl,
                    }}
                    label="إرسال الخصم على الواتساب"
                  />
                )}
                <div style={{ marginTop: "1.2rem" }}>
                  <button type="button" className="proj-detail-btn" onClick={closeAll}>
                    تمام، إغلاق
                  </button>
                </div>
              </div>
            ) : (
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
                  onClick={closeAll}
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
            )}
          </div>
        </div>
      )}
    </>
  );
}
