import { requireAdmin } from "@/lib/admin";
import Money from "@/app/components/Money";
import RiyalIcon from "@/app/components/RiyalIcon";
import { clientFinance, sumFinances } from "@/lib/adminFinance";
import { timeAgo } from "@/lib/timeAgo";

export default async function AdminWalletPage() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("clients")
    .select("*, projects(*, stages(*))")
    .order("created_at", { ascending: false });

  const totals = sumFinances(clients);

  const paidStages = (clients || [])
    .flatMap((c) =>
      (c.projects || []).flatMap((p) =>
        (p.stages || [])
          .filter((s) => s.paid_at)
          .map((s) => ({ ...s, clientName: c.full_name, projectTitle: p.title }))
      )
    )
    .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));

  return (
    <section className="view active">
      <div className="hero-card" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <span className="eyebrow">إجمالي قيمة العقود</span>
          <div className="income-wrap">
            <div className="income">
              <span dir="ltr">{Number(totals.contracted).toLocaleString("en-US")}</span>
              <RiyalIcon tone="light" size="0.5em" />
            </div>
          </div>
        </div>
        <div className="hero-side">
          <span>المُحصَّل</span>
          <b>
            <Money value={totals.collected} tone="light" />
          </b>
          <span style={{ marginTop: "10px", display: "block" }}>المستحق</span>
          <b>
            <Money value={totals.pending} tone="light" />
          </b>
        </div>
      </div>

      <div className="content-grid" style={{ gridTemplateColumns: "1fr" }}>
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="overline">المحفظة</span>
              <h2>الرصيد المالي لكل عميل</h2>
            </div>
          </div>
          {(clients || []).map((c) => {
            const f = clientFinance(c);
            if (f.contracted === 0) return null;
            return (
              <div className="project-row" key={c.id} style={{ gridTemplateColumns: "42px 1.4fr 1fr 1fr" }}>
                <div className="project-logo violet">{(c.full_name || "؟").trim().charAt(0)}</div>
                <div className="project-name">
                  <b>
                    {c.full_name}
                    {c.is_test && <span className="client-luxe-test-badge">تجريبي</span>}
                  </b>
                  <span>
                    قيمة العقد: <Money value={f.contracted} />
                  </span>
                </div>
                <div className="deadline">
                  <span>محصّل</span>
                  <b>
                    <Money value={f.collected} />
                  </b>
                </div>
                <div className="deadline">
                  <span>متبقي</span>
                  <b>
                    <Money value={f.pending} />
                  </b>
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel activity">
          <div className="panel-head">
            <div>
              <span className="overline">سجل التحصيل</span>
              <h2>آخر الدفعات المحصّلة</h2>
            </div>
          </div>
          {paidStages.length === 0 && <p className="muted">لسه مفيش دفعات اتحصّلت.</p>}
          {paidStages.slice(0, 8).map((s) => (
            <div className="activity-item" key={s.id}>
              <span className="activity-icon green">↓</span>
              <p>
                <b>
                  {s.title} — {s.clientName}
                </b>
                <small>{s.projectTitle}</small>
              </p>
              <time>
                <Money value={s.amount} /> · {timeAgo(s.paid_at)}
              </time>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
