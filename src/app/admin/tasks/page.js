import { requireAdmin } from "@/lib/admin";
import Money from "@/app/components/Money";

export default async function AdminTasksPage() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("clients")
    .select(
      "id, full_name, proposals(id, status, project_title), projects(id, title, stages(id, title, amount, status))"
    )
    .order("created_at", { ascending: false });

  const pendingProposals = (clients || []).flatMap((c) =>
    (c.proposals || [])
      .filter((pr) => pr.status === "pending")
      .map((pr) => ({
        key: `proposal-${pr.id}`,
        title: `قرار معلّق: عرض ${c.full_name}`,
        sub: pr.project_title || "عرض فني ومالي",
        href: `/admin/proposal/${c.id}`,
      }))
  );

  const awaitingStages = (clients || []).flatMap((c) =>
    (c.projects || []).flatMap((p) =>
      (p.stages || [])
        .filter((s) => s.status === "awaiting_payment")
        .map((s) => ({
          key: `stage-${s.id}`,
          title: `تأكيد استلام دفعة: ${s.title}`,
          sub: `${p.title} — ${c.full_name}`,
          amount: s.amount,
          href: `/admin/projects/${p.id}`,
        }))
    )
  );

  const items = [...pendingProposals, ...awaitingStages];

  return (
    <section className="view active">
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="overline">خطة التنفيذ</span>
            <h2>المهام المطلوبة الآن</h2>
          </div>
        </div>
        <p className="muted" style={{ marginBottom: "1rem" }}>
          قائمة حقيقية من العناصر اللي محتاجة إجراء منك — عروض بانتظار قرار صاحب المشروع، ودفعات محتاجة تأكيد استلام.
        </p>
        {items.length === 0 && <p className="muted">لا يوجد شيء بانتظار إجراء الآن 🎉</p>}
        {items.map((item) => (
          <a key={item.key} href={item.href} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
            <div className="task" style={{ cursor: "pointer" }}>
              <span />
              <div>
                <b>{item.title}</b>
                <small>{item.sub}</small>
              </div>
              {item.amount != null && (
                <time>
                  <Money value={item.amount} />
                </time>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
