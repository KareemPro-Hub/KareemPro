"use client";

import { useState, useTransition } from "react";
import { getProjectFileUrl, deleteProjectFile } from "@/app/admin/actions";
import { FILE_TYPE_META, formatFileSize } from "@/lib/fileTypes";
import AddProjectFileModal from "./AddProjectFileModal";

function fileMeta(f) {
  const parts = [];
  if (f.stage_label) parts.push(f.stage_label);
  parts.push(new Date(f.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }));
  parts.push(f.type === "link" ? "رابط" : formatFileSize(f.size_bytes) || "—");
  return parts.join(" — ");
}

export default function ProjectFilesSection({ projectId, files }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [openingId, setOpeningId] = useState(null);

  function handleOpen(file) {
    setError(null);
    setOpeningId(file.id);
    startTransition(async () => {
      try {
        const url = await getProjectFileUrl(file.id);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        setError(e.message || "تعذر فتح الملف");
      } finally {
        setOpeningId(null);
      }
    });
  }

  function handleDelete(file) {
    if (!window.confirm(`متأكد إنك عايز تحذف "${file.name}" ؟`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteProjectFile(file.id);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <div className="proj-detail-section">
      <div className="proj-detail-section-head">
        <div className="proj-detail-section-title">
          <span className="proj-detail-section-icon">📁</span>
          الملفات والتسليمات
        </div>
        <AddProjectFileModal projectId={projectId} />
      </div>

      {error && (
        <div className="notice notice-error" style={{ marginBottom: "0.8rem" }}>
          {error}
        </div>
      )}

      <div className="proj-detail-list">
        {files.length === 0 && <p className="muted">لسه مفيش ملفات مضافة.</p>}
        {files.map((f) => {
          const t = FILE_TYPE_META[f.type] || FILE_TYPE_META.doc;
          return (
            <div className="proj-detail-row" key={f.id}>
              <div className="proj-detail-row-text">
                <div className="proj-detail-row-title">
                  {t.icon} {f.name}
                </div>
                <div className="proj-detail-row-desc">{fileMeta(f)}</div>
                <div className="proj-detail-row-actions">
                  <button
                    type="button"
                    className="proj-detail-btn primary"
                    onClick={() => handleOpen(f)}
                    disabled={isPending && openingId === f.id}
                  >
                    {isPending && openingId === f.id ? "جارِ الفتح..." : f.type === "link" ? "فتح الرابط ↗" : "تحميل ⬇"}
                  </button>
                  <button type="button" className="proj-detail-btn danger" onClick={() => handleDelete(f)} disabled={isPending}>
                    حذف
                  </button>
                </div>
              </div>
              <div className="proj-detail-row-node-col">
                <span className="proj-detail-status-badge" style={{ color: t.color, background: t.bg }}>
                  {t.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
