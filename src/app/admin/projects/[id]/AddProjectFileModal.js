"use client";

import { useRef, useState, useTransition } from "react";
import { addProjectFile } from "@/app/admin/actions";
import { FILE_TYPE_OPTIONS } from "@/lib/fileTypes";

export default function AddProjectFileModal({ projectId }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("design");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  function handleSubmit(formData) {
    setError(null);
    startTransition(async () => {
      try {
        await addProjectFile(formData);
        formRef.current?.reset();
        setType("design");
        setOpen(false);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <>
      <button type="button" className="proj-detail-add-trigger" onClick={() => setOpen(true)}>
        + إضافة ملف
      </button>

      {open && (
        <div className="proj-detail-modal-overlay" onClick={() => !isPending && setOpen(false)}>
          <div className="proj-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="proj-detail-modal-head">
              <button type="button" className="proj-detail-modal-close" onClick={() => setOpen(false)} disabled={isPending}>
                ✕
              </button>
              <div className="proj-detail-modal-title">إضافة ملف أو رابط</div>
            </div>

            <form ref={formRef} action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="hidden" name="project_id" value={projectId} />

              <div className="field">
                <label>اسم الملف</label>
                <input type="text" name="name" required placeholder="مثال: العقد الموقّع" />
              </div>

              <div className="field">
                <label>النوع</label>
                <select name="type" value={type} onChange={(e) => setType(e.target.value)} required>
                  {FILE_TYPE_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>مرتبط بمرحلة (اختياري)</label>
                <input type="text" name="stage_label" placeholder="مثال: تصميم الهوية البصرية الأولية" />
              </div>

              {type === "link" ? (
                <div className="field">
                  <label>الرابط</label>
                  <input type="url" name="external_url" required placeholder="https://..." />
                  <p className="muted" style={{ fontSize: "12px", marginTop: "0.4rem" }}>
                    استخدم رابط لأي ملف كبير (فيديوهات، أرشيفات ضخمة) — ارفعه على درايف أو أي مكان تخزين برّه وحط الرابط هنا.
                  </p>
                </div>
              ) : (
                <div className="field">
                  <label>الملف</label>
                  <input type="file" name="file" required />
                  <p className="muted" style={{ fontSize: "12px", marginTop: "0.4rem" }}>
                    للملفات العادية (عقود، فواتير، تصاميم، مستندات) لحد ١٥ ميجا. لو الملف أكبر من كده، استخدم نوع "رابط" بدل الرفع المباشر.
                  </p>
                </div>
              )}

              <div className="proj-detail-modal-actions">
                <button type="submit" className="proj-detail-btn primary" disabled={isPending}>
                  {isPending ? "جارِ الحفظ..." : "حفظ"}
                </button>
                <button type="button" className="proj-detail-btn" onClick={() => setOpen(false)} disabled={isPending}>
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
