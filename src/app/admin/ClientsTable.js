"use client";

import { useState } from "react";
import RiyalIcon from "@/app/components/RiyalIcon";
import ClientActions from "./ClientActions";

const PROPOSAL_STYLE = {
  pending: { label: "بانتظار قرار العميل", className: "proposal-pill pending" },
  accepted: { label: "تمت الموافقة", className: "proposal-pill accepted" },
  rejected: { label: "مرفوض", className: "proposal-pill rejected" },
};

const AVATAR_COLORS = ["#ffa826", "#ff5535", "#d9187a", "#7c6cff", "#2bb673", "#2f9bd6"];

function initials(name) {
  return (name || "؟")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function avatarColor(seed) {
  let h = 0;
  for (const ch of seed || "?") h = (h * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function Money({ value }) {
  return (
    <span>
      <span dir="ltr">{Number(value).toLocaleString("en-US")}</span>
      <RiyalIcon size="0.85em" />
    </span>
  );
}

// `rows` is the pre-computed [{ client, finance }] list built server-side in
// admin/page.js — kept as a client component only so the search box can
// filter the table live without a full page round-trip.
export default function ClientsTable({ rows }) {
  const [query, setQuery] = useState("");

  const filtered = rows.filter(({ client: c }) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.full_name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="card">
      <div className="card-head-row">
        <h2 className="title" style={{ fontSize: "1.15rem", margin: 0 }}>
          العملاء والمشاريع
        </h2>
        <input
          type="search"
          className="admin-search-input"
          placeholder="ابحث بالاسم أو البريد..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <table className="admin-table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>العميل</th>
            <th>البريد</th>
            <th>المشاريع</th>
            <th>العرض الفني</th>
            <th>الرصيد المالي</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(({ client: c, finance }) => {
            const latestProposal = (c.proposals || []).sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            )[0];
            const style = latestProposal ? PROPOSAL_STYLE[latestProposal.status] : null;
            return (
              <tr key={c.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span
                      className="client-avatar"
                      style={{ background: avatarColor(c.full_name || c.email) }}
                    >
                      {initials(c.full_name)}
                    </span>
                    {c.full_name}
                  </div>
                </td>
                <td dir="ltr" className="cell-email">
                  {c.email}
                </td>
                <td>
                  {(c.projects || []).length === 0 ? (
                    <span className="muted">لا يوجد</span>
                  ) : (
                    c.projects.map((p) => (
                      <div key={p.id}>
                        <a href={`/admin/projects/${p.id}`}>{p.title}</a>
                      </div>
                    ))
                  )}
                </td>
                <td>
                  <a href={`/admin/proposal/${c.id}`} style={{ textDecoration: "none" }}>
                    {latestProposal ? (
                      <span className={style?.className || "tag"}>
                        {style?.label || latestProposal.status}
                      </span>
                    ) : (
                      <span className="btn btn-outline btn-sm">+ إنشاء عرض</span>
                    )}
                  </a>
                </td>
                <td>
                  {finance.contracted > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      <span className="balance-paid">
                        <Money value={finance.collected} /> محصّل
                      </span>
                      {finance.pending > 0 && (
                        <span className="balance-pending">
                          <Money value={finance.pending} /> متبقي
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <ClientActions clientId={c.id} clientName={c.full_name} />
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                {rows.length === 0 ? "لسه مفيش عملاء. ابدأ بإضافة عميل جديد." : "لا نتائج مطابقة للبحث."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
