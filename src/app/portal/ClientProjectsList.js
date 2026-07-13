"use client";

import { useMemo, useState } from "react";

const STATUS_META = {
  active: { label: "نشط", color: "#2f8a4e", bg: "rgba(47,138,78,.12)" },
  completed: { label: "مكتمل", color: "#2a6fb0", bg: "rgba(42,111,176,.12)" },
  on_hold: { label: "متوقف", color: "#b93a2e", bg: "rgba(185,58,46,.12)" },
};

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "active", label: "نشطة" },
  { key: "completed", label: "مكتملة" },
  { key: "on_hold", label: "متوقفة" },
];

// Real "my projects" overview — every card here is a real row from the
// client's own `projects` table (no placeholder/fictional statuses like the
// original mockup's "idea"/"queued" demo cards). Clicking a card jumps to
// that project's full detail section further down the same page.
export default function ClientProjectsList({ projects }) {
  const [filter, setFilter] = useState("all");

  const counts = useMemo(
    () => ({
      all: projects.length,
      active: projects.filter((p) => p.statusKey === "active").length,
      completed: projects.filter((p) => p.statusKey === "completed").length,
      on_hold: projects.filter((p) => p.statusKey === "on_hold").length,
    }),
    [projects]
  );

  const visible = filter === "all" ? projects : projects.filter((p) => p.statusKey === filter);

  return (
    <div className="my-projects-wrap">
      <div className="my-projects-hero">
        <div className="my-projects-hero-icon">📊</div>
        <div>
          <div className="my-projects-hero-title">إدارة مشاريعي</div>
          <div className="my-projects-hero-sub">تابع كل مشاريعك في مكان واحد</div>
        </div>
      </div>

      <div className="my-projects-stats">
        <div className="my-projects-stat-card">
          <div className="my-projects-stat-head">
            <span>إجمالي المشاريع</span>
            <span className="my-projects-stat-icon">📁</span>
          </div>
          <div className="my-projects-stat-value">{counts.all}</div>
        </div>
        <div className="my-projects-stat-card">
          <div className="my-projects-stat-head">
            <span>مشاريع نشطة</span>
            <span className="my-projects-stat-icon active">🟢</span>
          </div>
          <div className="my-projects-stat-value">{counts.active}</div>
        </div>
        <div className="my-projects-stat-card">
          <div className="my-projects-stat-head">
            <span>مشاريع مكتملة</span>
            <span className="my-projects-stat-icon completed">🔵</span>
          </div>
          <div className="my-projects-stat-value">{counts.completed}</div>
        </div>
        <div className="my-projects-stat-card">
          <div className="my-projects-stat-head">
            <span>متوقفة</span>
            <span className="my-projects-stat-icon on_hold">🟠</span>
          </div>
          <div className="my-projects-stat-value">{counts.on_hold}</div>
        </div>
      </div>

      {projects.length > 1 && (
        <div className="my-projects-filters">
          {FILTERS.map((f) => (
            <button
              type="button"
              key={f.key}
              className={`my-projects-filter${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
      )}

      <div className="my-projects-grid">
        {visible.map((p) => {
          const s = STATUS_META[p.statusKey] || STATUS_META.active;
          return (
            <div className="my-project-card" key={p.id}>
              <div className="my-project-card-top">
                <span className="my-project-card-status" style={{ color: s.color, background: s.bg }}>
                  {s.label}
                </span>
                <div className="my-project-card-name-col">
                  <div className="my-project-card-name">{p.title}</div>
                  <div className="my-project-card-package">{p.packageName}</div>
                </div>
              </div>

              <div>
                <div className="my-project-card-track">
                  <i style={{ width: `${p.percent}%` }} />
                </div>
                <div className="my-project-card-track-labels">
                  <span>{p.percent}% منجز</span>
                  <span>{p.currentStage}</span>
                </div>
              </div>

              <div className="my-project-card-foot">
                <span>{p.meta}</span>
                <a href={`#project-detail-${p.id}`}>فتح المشروع ←</a>
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <p className="muted" style={{ gridColumn: "1/-1", textAlign: "center", padding: "2rem 0" }}>
            لا توجد مشاريع في هذا التصنيف حاليًا.
          </p>
        )}
      </div>
    </div>
  );
}
