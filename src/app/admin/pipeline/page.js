import { requireAdmin } from "@/lib/admin";
import PipelineBoard from "./PipelineBoard";
import AdminChecklist from "./AdminChecklist";

function timeAgoLabel(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  return `قبل ${days} أيام`;
}

export default async function AdminPipelinePage() {
  const { supabase } = await requireAdmin();

  const [{ data: checklistItems }, { data: projectsRaw }] = await Promise.all([
    supabase
      .from("admin_checklist")
      .select("*, projects(title)")
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, title, clients(full_name)")
      .order("created_at", { ascending: false }),
  ]);

  const projectOptions = (projectsRaw || []).map((p) => ({
    id: p.id,
    label: p.clients?.full_name ? `${p.title} — ${p.clients.full_name}` : p.title,
  }));

  const { data: clients } = await supabase
    .from("clients")
    .select(
      "id, full_name, proposals(id, status, created_at, decided_at, project_title, selected_package_id, proposal_packages(id, name, price))"
    )
    .order("created_at", { ascending: false });

  const proposals = (clients || [])
    .flatMap((c) => (c.proposals || []).map((pr) => ({ ...pr, clientId: c.id, clientName: c.full_name })))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const items = proposals.map((p) => {
    const selectedPkg = (p.proposal_packages || []).find((pk) => pk.id === p.selected_package_id);
    return {
      id: p.id,
      clientId: p.clientId,
      clientName: p.clientName,
      projectTitle: p.project_title || `عرض ${p.clientName}`,
      status: p.status,
      packageName: selectedPkg ? selectedPkg.name.split("|")[0].trim() : null,
      amount: selectedPkg ? Number(selectedPkg.price) : null,
      createdAt: p.created_at,
      dateLabel: new Date(p.created_at).toLocaleDateString("ar-SA", { day: "numeric", month: "long" }),
    };
  });

  const counts = {
    pending: items.filter((i) => i.status === "pending").length,
    accepted: items.filter((i) => i.status === "accepted").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  };
  const totalAcceptedValue = items
    .filter((i) => i.status === "accepted" && i.amount)
    .reduce((sum, i) => sum + i.amount, 0);

  // Real recent-events feed: derived from actual proposal created_at/decided_at
  // timestamps — not fabricated demo activity.
  const recentEvents = proposals
    .flatMap((p) => {
      const events = [
        { time: p.created_at, icon: "📄", text: `تم إنشاء عرض جديد لـ ${p.clientName}` },
      ];
      if (p.decided_at) {
        events.push(
          p.status === "accepted"
            ? { time: p.decided_at, icon: "✅", text: `تمت الموافقة على عرض "${p.project_title || p.clientName}"` }
            : p.status === "rejected"
            ? { time: p.decided_at, icon: "✕", text: `تم رفض عرض "${p.project_title || p.clientName}"` }
            : null
        );
      }
      return events.filter(Boolean);
    })
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5)
    .map((ev) => ({ ...ev, timeLabel: timeAgoLabel(ev.time) }));

  return (
    <section className="view active">
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="overline">تخطيط وإدارة</span>
            <h2>هنا يتم هندسة الأفكار</h2>
          </div>
        </div>

        <PipelineBoard
          items={items}
          counts={counts}
          totalAcceptedValue={totalAcceptedValue}
          recentEvents={recentEvents}
          checklistItems={checklistItems || []}
          projectOptions={projectOptions}
        />
      </div>
    </section>
  );
}
