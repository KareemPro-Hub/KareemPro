import { requireAdmin } from "@/lib/admin";
import TasksBoard from "./TasksBoard";

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(Math.floor(diffMs / 86400000), 0);
}

function dueLabel(days) {
  if (days == null) return null;
  if (days === 0) return "اليوم";
  if (days === 1) return "منذ يوم واحد";
  return `منذ ${days} أيام`;
}

function priorityFromDays(days) {
  if (days == null || days < 1) return "low";
  if (days >= 3) return "high";
  return "medium";
}

export default async function AdminTasksPage() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("clients")
    .select(
      "id, full_name, proposals(id, status, project_title, created_at), projects(id, title, stages(id, title, amount, status, payment_requested_at))"
    )
    .order("created_at", { ascending: false });

  const pendingProposals = (clients || []).flatMap((c) =>
    (c.proposals || [])
      .filter((pr) => pr.status === "pending")
      .map((pr) => {
        const days = daysSince(pr.created_at);
        return {
          key: `proposal-${pr.id}`,
          type: "approval",
          title: `قرار معلّق: عرض ${c.full_name}`,
          sub: pr.project_title || "عرض فني ومالي",
          amount: null,
          dueLabel: dueLabel(days),
          priority: priorityFromDays(days),
          href: `/admin/proposal/${c.id}`,
        };
      })
  );

  const awaitingStages = (clients || []).flatMap((c) =>
    (c.projects || []).flatMap((p) =>
      (p.stages || [])
        .filter((s) => s.status === "awaiting_payment")
        .map((s) => {
          const days = daysSince(s.payment_requested_at);
          return {
            key: `stage-${s.id}`,
            type: "payment",
            title: `تأكيد استلام دفعة: ${s.title}`,
            sub: `${p.title} — ${c.full_name}`,
            amount: s.amount,
            dueLabel: dueLabel(days),
            priority: priorityFromDays(days),
            href: `/admin/projects/${p.id}`,
          };
        })
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
        <TasksBoard items={items} />
      </div>
    </section>
  );
}
