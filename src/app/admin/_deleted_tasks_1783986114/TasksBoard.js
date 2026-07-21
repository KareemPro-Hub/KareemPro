"use client";

import { useMemo, useState } from "react";
import Money from "@/app/components/Money";

const TYPE_META = {
  approval: { label: "اعتماد عرض", color: "#c1590a", bg: "rgba(255,173,56,.18)" },
  payment: { label: "دفعة", color: "#2f8a4e", bg: "rgba(47,138,78,.12)" },
};

const PRIORITY_META = {
  high: { label: "أولوية عالية", color: "#b93a2e", bg: "rgba(185,58,46,.12)" },
  medium: { label: "أولوية متوسطة", color: "#c1590a", bg: "rgba(255,173,56,.18)" },
  low: { label: "أولوية منخفضة", color: "#2f8a4e", bg: "rgba(47,138,78,.12)" },
};

const FILTERS = [
  { key: "all", label: "الكل", match: () => true },
  { key: "urgent", label: "عاجلة", match: (t) => t.priority === "high" },
  { key: "payment", label: "دفعات", match: (t) => t.type === "payment" },
  { key: "approval", label: "موافقات", match: (t) => t.type === "approval" },
];

const priorityOrder = { high: 0, medium: 1, low: 2 };

export default function TasksBoard({ items }) {
  const [filter, setFilter] = useState("all");
  const [sortByPriority, setSortByPriority] = useState(false);

  const summary = useMemo(() => {
    const urgent = items.filter((t) => t.priority === "high").length;
    const payment = items.filter((t) => t.type === "payment").length;
    const approval = items.filter((t) => t.type === "approval").length;
    return [
      { label: "إجمالي المهام", count: items.length, color: "linear-gradient(135deg,#ff7b27,#ffad38)" },
      { label: "عاجلة", count: urgent, color: "#b93a2e" },
      { label: "دفعات معلّقة", count: payment, color: "#2f8a4e" },
      { label: "بانتظار الموافقة", count: approval, color: "#2a6fb0" },
    ];
  }, [items]);

  const visible = useMemo(() => {
    const group = FILTERS.find((f) => f.key === filter) || FILTERS[0];
    let list = items.filter(group.match);
    if (sortByPriority) {
      list = [...list].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }
    return list;
  }, [items, filter, sortByPriority]);

  return (
    <div className="tasks-luxe-wrap">
      <div className="tasks-luxe-summary">
        {summary.map((s) => (
          <div className="tasks-luxe-summary-card" key={s.label}>
            <div className="tasks-luxe-summary-head">
              <span>{s.label}</span>
              <span className="tasks-luxe-summary-dot" style={{ background: s.color }} />
            </div>
            <div className="tasks-luxe-summary-count">{s.count}</div>
          </div>
        ))}
      </div>

      <div className="tasks-luxe-toolbar">
        <div className="tasks-luxe-filters">
          {FILTERS.map((f) => (
            <button
              type="button"
              key={f.key}
              className={`tasks-luxe-filter${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`tasks-luxe-sort${sortByPriority ? " active" : ""}`}
          onClick={() => setSortByPriority((v) => !v)}
        >
          ترتيب حسب الأولوية
        </button>
      </div>

      <div className="tasks-luxe-card">
        {visible.length === 0 && <p className="muted" style={{ padding: "1.2rem 0" }}>لا يوجد شيء هنا 🎉</p>}
        {visible.map((t, idx) => {
          const tm = TYPE_META[t.type];
          const pm = PRIORITY_META[t.priority];
          const isLast = idx === visible.length - 1;
          return (
            <a
              className={`tasks-luxe-row${isLast ? " last" : ""}`}
              href={t.href}
              key={t.key}
            >
              <div className="tasks-luxe-row-body">
                <div className="tasks-luxe-row-title">{t.title}</div>
                <div className="tasks-luxe-row-meta">
                  <span className="tasks-luxe-row-project">{t.sub}</span>
                  <span
                    className="tasks-luxe-badge"
                    style={{ color: tm.color, background: tm.bg }}
                  >
                    {tm.label}
                  </span>
                  <span
                    className="tasks-luxe-badge"
                    style={{ color: pm.color, background: pm.bg }}
                  >
                    {pm.label}
                  </span>
                  {t.dueLabel && <span className="tasks-luxe-due">{t.dueLabel}</span>}
                </div>
              </div>
              {t.amount != null && (
                <div className="tasks-luxe-amount">
                  <Money value={t.amount} />
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
