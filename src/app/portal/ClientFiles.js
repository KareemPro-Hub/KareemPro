"use client";

import { useMemo, useState, useTransition } from "react";
import { getMyFileUrl } from "./files-actions";
import { FILE_TYPE_META, formatFileSize } from "@/lib/fileTypes";

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "design", label: "مشروعك" },
  { key: "doc", label: "مستندات" },
  { key: "contract", label: "عقود" },
  { key: "invoice", label: "فواتير" },
];

function fileMeta(f) {
  const parts = [];
  if (f.stage_label) parts.push(f.stage_label);
  parts.push(new Date(f.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }));
  parts.push(f.type === "link" ? "رابط خارجي" : formatFileSize(f.size_bytes) || "—");
  return parts.join(" — ");
}

// "الملفات والتسليمات" isolated view — every row is a real `project_files`
// entry belonging to the client. Opening/downloading always goes through
// getMyFileUrl (ownership-checked server action) rather than any stored URL,
// so signed storage links stay short-lived and external links stay as-is.
export default function ClientFiles({ files }) {
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [openingId, setOpeningId] = useState(null);
  const [error, setError] = useState(null);

  const counts = useMemo(
    () => ({
      all: files.length,
      design: files.filter((f) => f.type === "design").length,
      docsAndContracts: files.filter((f) => f.type === "contract" || f.type === "invoice").length,
    }),
    [files]
  );

  const visible = filter === "all" ? files : files.filter((f) => f.type === filter);

  function handleOpen(file) {
    setError(null);
    setOpeningId(file.id);
    startTransition(async () => {
      try {
        const url = await getMyFileUrl(file.id);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        setError(e.message || "تعذر فتح الملف");
      } finally {
        setOpeningId(null);
      }
    });
  }

  function goToSupport(e) {
    e.preventDefault();
    const panel = document.querySelector(".client-dashboard-main");
    if (panel) panel.dataset.view = "support";
    history.replaceState(null, "", "#support");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    requestAnimationFrame(() => {
      document.querySelector("#support")?.scrollIntoView({ block: "start" });
    });
  }

  return (
    <div className="client-files-wrap">
      <div className="client-files-head">
        <div className="client-files-head-badge">الملفات والتسليمات</div>
        <div className="client-files-head-sub">كل ملفات مشروعك وتسليماتك في مكان واحد</div>
      </div>

      <div className="client-files-stats">
        <div className="client-files-stat-card">
          <div className="client-files-stat-icon">📁</div>
          <div>
            <div className="client-files-stat-label">إجمالي الملفات</div>
            <div className="client-files-stat-value">{counts.all}</div>
          </div>
        </div>
        <div className="client-files-stat-card">
          <div className="client-files-stat-icon">🎨</div>
          <div>
            <div className="client-files-stat-label">أعمال المشروع</div>
            <div className="client-files-stat-value">{counts.design}</div>
          </div>
        </div>
        <div className="client-files-stat-card">
          <div className="client-files-stat-icon">🧾</div>
          <div>
            <div className="client-files-stat-label">عقود وفواتير</div>
            <div className="client-files-stat-value">{counts.docsAndContracts}</div>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="client-files-filters">
          {FILTERS.map((f) => (
            <button
              type="button"
              key={f.key}
              className={`client-files-filter${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="notice notice-error" style={{ marginBottom: "0.4rem" }}>
          {error}
        </div>
      )}

      <div className="client-files-list">
        {visible.length === 0 && (
          <div className="client-files-empty">
            {files.length === 0 ? "لسه مفيش ملفات أو تسليمات اتضافت لمشروعك." : "لا توجد ملفات في هذا التصنيف."}
          </div>
        )}
        {visible.map((f) => {
          const t = FILE_TYPE_META[f.type] || FILE_TYPE_META.doc;
          return (
            <div className="client-files-row" key={f.id}>
              <div className="client-files-row-icon" style={{ background: t.bg }}>
                {t.icon}
              </div>
              <div className="client-files-row-info">
                <div className="client-files-row-name">{f.name}</div>
                <div className="client-files-row-meta">{fileMeta(f)}</div>
              </div>
              <span className="client-files-row-badge" style={{ color: t.color, background: t.bg }}>
                {t.label}
              </span>
              <button
                type="button"
                className="client-files-row-action"
                onClick={() => handleOpen(f)}
                disabled={isPending && openingId === f.id}
              >
                {isPending && openingId === f.id ? "جارِ الفتح..." : f.type === "link" ? "فتح الرابط ↗" : "تحميل ⬇"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="client-support-note">
        <div className="client-support-note-head">
          <span className="client-support-note-dot" />
          <span className="client-support-note-title">عندك ملاحظات على تسليم معيّن ؟</span>
        </div>
        <p className="client-support-note-text">
          تواصل معنا وهنساعدك في أي استفسار حول ملفاتك.{" "}
          <a href="#support" onClick={goToSupport}>
            تواصل معنا ←
          </a>
        </p>
      </div>
    </div>
  );
}
