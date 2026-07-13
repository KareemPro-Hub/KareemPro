"use client";

import { useMemo, useState } from "react";
import Money from "@/app/components/Money";
import ProposalActions from "./ProposalActions";

const STATUS_META = {
  pending: { icon: "⏳", label: "بانتظار الموافقة", color: "#c1590a", bg: "rgba(255,173,56,.18)" },
  accepted: { icon: "✅", label: "تمت الموافقة", color: "#2f8a4e", bg: "rgba(47,138,78,.12)" },
  rejected: { icon: "✕", label: "مرفوضة", color: "#b93a2e", bg: "rgba(185,58,46,.14)" },
};

const FILTERS = [
  { key: "all", label: "كل الحالات" },
  { key: "pending", label: "بانتظار الموافقة" },
  { key: "accepted", label: "تمت الموافقة" },
  { key: "rejected", label: "مرفوضة" },
];

export default function PipelineBoard({ items, counts, totalAcceptedValue, recentEvents }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((i) => {
      if (filter !== "all" && i.status !== filter) return false;
      if (!query) return true;
      return (
        i.projectTitle.toLowerCase().includes(query) || i.clientName.toLowerCase().includes(query)
      );
    });
  }, [items, filter, q]);

  return (
    <div className="pipeline-luxe-wrap">
      <div className="pipeline-luxe-summary">
        <div className="pipeline-luxe-summary-card">
          <div className="pipeline-luxe-summary-head">
            <span>بانتظار الموافقة</span>
            <span className="pipeline-luxe-summary-icon pending">⏳</span>
          </div>
          <div className="pipeline-luxe-summary-count">{counts.pending}</div>
        </div>
        <div className="pipeline-luxe-summary-card">
          <div className="pipeline-luxe-summary-head">
            <span>تمت الموافقة</span>
            <span className="pipeline-luxe-summary-icon accepted">✅</span>
          </div>
          <div className="pipeline-luxe-summary-count">{counts.accepted}</div>
        </div>
        <div className="pipeline-luxe-summary-card">
          <div className="pipeline-luxe-summary-head">
            <span>مرفوضة</span>
            <span className="pipeline-luxe-summary-icon rejected">✕</span>
          </div>
          <div className="pipeline-luxe-summary-count">{counts.rejected}</div>
        </div>
        <div className="pipeline-luxe-summary-card dark">
          <div className="pipeline-luxe-summary-head">
            <span>💰 إجمالي قيمة العروض المقبولة</span>
          </div>
          <div className="pipeline-luxe-summary-count">
            <Money value={totalAcceptedValue} size="0.6em" tone="light" />
          </div>
        </div>
      </div>

      <div className="pipeline-luxe-toolbar">
        <div className="pipeline-luxe-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="بحث بالمشروع أو صاحب المشروع…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="pipeline-luxe-filters">
          {FILTERS.map((f) => (
            <button
              type="button"
              key={f.key}
              className={`pipeline-luxe-filter${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pipeline-luxe-card">
        <div className="pipeline-luxe-row pipeline-luxe-head-row">
          <div>اسم المشروع</div>
          <div>العميل</div>
          <div>الباقة</div>
          <div>القيمة</div>
          <div>الحالة</div>
          <div>تاريخ الإرسال</div>
          <div style={{ textAlign: "left" }}>إجراءات</div>
        </div>

        {visible.length === 0 && (
          <p className="muted" style={{ padding: "1.2rem 28px" }}>
            لا يوجد عروض مطابقة.
          </p>
        )}

        {visible.map((i, idx) => {
          const s = STATUS_META[i.status] || STATUS_META.pending;
          return (
            <div
              className={`pipeline-luxe-row${idx === visible.length - 1 ? " last" : ""}`}
              key={i.id}
            >
              <div className="pipeline-luxe-project">{i.projectTitle}</div>
              <div className="pipeline-luxe-client">{i.clientName}</div>
              <div className="pipeline-luxe-package">{i.packageName || "لم يتم الاختيار بعد"}</div>
              <div className="pipeline-luxe-amount">
                {i.amount != null ? <Money value={i.amount} /> : "—"}
              </div>
              <div>
                <span className="pipeline-luxe-status" style={{ color: s.color, background: s.bg }}>
                  {s.icon} {s.label}
                </span>
              </div>
              <div className="pipeline-luxe-date">{i.dateLabel}</div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <ProposalActions proposalId={i.id} clientId={i.clientId} projectTitle={i.projectTitle} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pipeline-luxe-events">
        <div className="pipeline-luxe-events-title">آخر الأحداث</div>
        {recentEvents.length === 0 && <p className="muted">لا يوجد أحداث بعد.</p>}
        {recentEvents.map((ev, idx) => (
          <div className={`pipeline-luxe-event${idx === recentEvents.length - 1 ? " last" : ""}`} key={idx}>
            <span className="pipeline-luxe-event-icon">{ev.icon}</span>
            <div>
              <div className="pipeline-luxe-event-time">{ev.timeLabel}</div>
              <div className="pipeline-luxe-event-text">{ev.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
