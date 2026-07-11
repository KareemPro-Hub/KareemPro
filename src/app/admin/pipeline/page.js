import { requireAdmin } from "@/lib/admin";
import { PROPOSAL_LABEL } from "@/lib/adminFinance";

const STATUS_DOT = {
  pending: "coral-bg",
  accepted: "cyan-bg",
  rejected: "violet-bg",
};

export default async function AdminPipelinePage() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, proposals(id, status, created_at, decided_at, project_title)")
    .order("created_at", { ascending: false });

  const proposals = (clients || [])
    .flatMap((c) => (c.proposals || []).map((pr) => ({ ...pr, clientId: c.id, clientName: c.full_name })))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const counts = proposals.reduce(
    (acc, p) => ({ ...acc, [p.status]: (acc[p.status] || 0) + 1 }),
    {}
  );

  return (
    <section className="view active">
      <div className="stats">
        <article>
          <div className="stat-icon orange custom-stat-icon">
            <img src="/admin-ui/icons/target.png" alt="بانتظار قرار" />
          </div>
          <div>
            <span>بانتظار قرار العميل</span>
            <b>{counts.pending || 0}</b>
          </div>
        </article>
        <article>
          <div className="stat-icon green custom-stat-icon">
            <img src="/admin-ui/icons/checklist.png" alt="تمت الموافقة" />
          </div>
          <div>
            <span>تمت الموافقة</span>
            <b>{counts.accepted || 0}</b>
          </div>
        </article>
        <article>
          <div className="stat-icon purple custom-stat-icon">
            <img src="/admin-ui/icons/report.png" alt="مرفوض" />
          </div>
          <div>
            <span>مرفوض</span>
            <b>{counts.rejected || 0}</b>
          </div>
        </article>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="overline">تخطيط وإدارة</span>
            <h2>كل العروض الفنية والمالية</h2>
          </div>
        </div>
        {proposals.length === 0 && <p className="muted">لسه مفيش عروض اتبعتت.</p>}
        <div className="timeline" style={{ gridTemplateColumns: "1fr" }}>
          {proposals.map((p) => (
            <a
              key={p.id}
              href={`/admin/proposal/${p.clientId}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div>
                <time>
                  <b>{new Date(p.created_at).getDate()}</b>
                  {new Date(p.created_at).toLocaleDateString("ar-SA", { month: "short" })}
                </time>
                <i className={`dot ${STATUS_DOT[p.status] || "coral-bg"}`} />
                <p>
                  <b>{p.project_title || `عرض ${p.clientName}`}</b>
                  <span>
                    {p.clientName} — {PROPOSAL_LABEL[p.status] || p.status}
                  </span>
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
