import { requireAdmin } from "@/lib/admin";
import ClientActions from "./ClientActions";

const PROPOSAL_LABEL = {
  pending: "بانتظار قرار العميل",
  accepted: "تمت الموافقة ✅",
  rejected: "مرفوض ⚠️",
};

export default async function AdminHome() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("clients")
    .select("*, projects(*), proposals(status, created_at)")
    .order("created_at", { ascending: false });

  return (
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
          <a href="/admin/projects/new" className="btn btn-primary btn-sm">
            + مشروع جديد
          </a>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn btn-outline btn-sm">
              خروج
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2 className="title">العملاء والمشاريع</h2>
        <table className="admin-table" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>العميل</th>
              <th>البريد</th>
              <th>المشاريع</th>
              <th>العرض الفني</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(clients || []).map((c) => {
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
                    <ClientActions clientId={c.id} clientName={c.full_name} />
                  </td>
                </tr>
              );
            })}
            {(!clients || clients.length === 0) && (
              <tr>
                <td colSpan={5} className="muted">
                  لسه مفيش عملاء. ابدأ بإضافة عميل جديد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
