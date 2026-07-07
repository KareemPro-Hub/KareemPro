import { requireAdmin } from "@/lib/admin";
import ClientActions from "./ClientActions";
import RiyalIcon from "@/app/components/RiyalIcon";

const PROPOSAL_LABEL = {
  pending: "بانتظار قرار العميل",
  accepted: "تمت الموافقة ✅",
  rejected: "مرفوض ⚠️",
};

function clientFinance(client) {
  let contracted = 0;
  let collected = 0;
  (client.projects || []).forEach((p) => {
    contracted += Number(p.package_price) || 0;
    (p.stages || []).forEach((s) => {
      if (["paid", "in_progress", "completed"].includes(s.status)) {
        collected += Number(s.amount) || 0;
      }
    });
  });
  return { contracted, collected, pending: Math.max(contracted - collected, 0) };
}

function Money({ value }) {
  return (
    <span>
      <span dir="ltr">{Number(value).toLocaleString("en-US")}</span>
      <RiyalIcon size="0.85em" />
    </span>
  );
}

export default async function AdminHome() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("clients")
    .select("*, projects(*, stages(*)), proposals(status, created_at)")
    .order("created_at", { ascending: false });

  const finances = (clients || []).map((c) => ({ client: c, finance: clientFinance(c) }));
  const totals = finances.reduce(
    (acc, { finance }) => ({
      contracted: acc.contracted + finance.contracted,
      collected: acc.collected + finance.collected,
      pending: acc.pending + finance.pending,
    }),
    { contracted: 0, collected: 0, pending: 0 }
  );

  return (
    <div className="admin-light">
    <div className="shell">
      <div className="top-bar">
        <a href="/" className="brand-row" style={{ marginBottom: 0 }}>
          <span>KAREEM PRO — لوحة التحكم</span>
          <img src="/logo-transparent.png" alt="Kareem Pro" />
        </a>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <a href="/admin/clients/new" className="btn btn-outline btn-sm">
            + عميل جديد
          </a>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn btn-outline btn-sm">
              خروج
            </button>
          </form>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <span className="stat-value">{(clients || []).length}</span>
          <span className="stat-label">إجمالي العملاء</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📄</span>
          <span className="stat-value">
            <Money value={totals.contracted} />
          </span>
          <span className="stat-label">إجمالي قيمة العقود</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <span className="stat-value stat-value-positive">
            <Money value={totals.collected} />
          </span>
          <span className="stat-label">إجمالي المُحصَّل</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <span className="stat-value stat-value-warning">
            <Money value={totals.pending} />
          </span>
          <span className="stat-label">إجمالي المستحق</span>
        </div>
      </div>

      <div className="card">
        <h2 className="title" style={{ fontSize: "1.15rem" }}>
          العملاء والمشاريع
        </h2>
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
            {finances.map(({ client: c, finance }) => {
              const latestProposal = (c.proposals || []).sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
              )[0];
              return (
                <tr key={c.id}>
                  <td>{c.full_name}</td>
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
                        <span className="tag">{PROPOSAL_LABEL[latestProposal.status] || latestProposal.status}</span>
                      ) : (
                        <span className="btn btn-outline btn-sm">+ إنشاء عرض</span>
                      )}
                    </a>
                  </td>
                  <td>
                    {finance.contracted > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8rem" }}>
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
            {(!clients || clients.length === 0) && (
              <tr>
                <td colSpan={6} className="muted">
                  لسه مفيش عملاء. ابدأ بإضافة عميل جديد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
