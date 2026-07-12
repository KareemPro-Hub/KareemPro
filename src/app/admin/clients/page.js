import { requireAdmin } from "@/lib/admin";
import ClientActions from "../ClientActions";
import Money from "@/app/components/Money";
import { clientFinance, PROPOSAL_LABEL } from "@/lib/adminFinance";

export default async function AdminClientsPage({ searchParams }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const q = (params?.q || "").trim().toLowerCase();

  const { data: allClients } = await supabase
    .from("clients")
    .select("*, projects(*, stages(*)), proposals(status, created_at)")
    .order("created_at", { ascending: false });

  const clients = q
    ? (allClients || []).filter(
        (c) =>
          (c.full_name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q)
      )
    : allClients || [];

  return (
    <section className="view active">
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="overline">مساحة العمل</span>
            <h2>أصحاب المشاريع {q && <span className="muted" style={{ fontSize: "0.7em" }}>— نتائج البحث عن "{params.q}"</span>}</h2>
          </div>
          <a className="text-btn" href="/admin/clients/new">
            + عميل جديد
          </a>
        </div>

        {clients.length === 0 && <p className="muted">لا يوجد عملاء مطابقون.</p>}

        {clients.map((c) => {
          const finance = clientFinance(c);
          const latestProposal = (c.proposals || []).sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )[0];
          return (
            <div className="project-row" key={c.id} style={{ gridTemplateColumns: "42px 1.3fr 1fr 1fr 1fr auto" }}>
              <div className="project-logo cyan">{(c.full_name || "؟").trim().charAt(0)}</div>
              <div className="project-name">
                <b>{c.full_name}</b>
                <span dir="ltr">{c.email}</span>
              </div>
              <div className="client">
                <span>المشاريع</span>
                {(c.projects || []).length === 0 ? (
                  <b className="muted">لا يوجد</b>
                ) : (
                  c.projects.map((p) => (
                    <div key={p.id}>
                      <a href={`/admin/projects/${p.id}`}>{p.title}</a>
                    </div>
                  ))
                )}
              </div>
              <div className="deadline">
                <span>العرض الفني</span>
                <b>
                  {latestProposal ? (
                    <a href={`/admin/proposal/${c.id}`}>{PROPOSAL_LABEL[latestProposal.status] || latestProposal.status}</a>
                  ) : (
                    <a href={`/admin/proposal/${c.id}`}>+ إنشاء عرض</a>
                  )}
                </b>
              </div>
              <div className="deadline">
                <span>الرصيد المالي</span>
                {finance.contracted > 0 ? (
                  <b>
                    <Money value={finance.collected} /> محصّل
                    {finance.pending > 0 && (
                      <>
                        {" "}
                        / <Money value={finance.pending} /> متبقي
                      </>
                    )}
                  </b>
                ) : (
                  <b className="muted">—</b>
                )}
              </div>
              <ClientActions clientId={c.id} clientName={c.full_name} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
