import { requireAdmin } from "@/lib/admin";
import StageActions from "./StageActions";

const STATUS_LABEL = {
  upcoming: "لم تبدأ بعد",
  awaiting_payment: "بانتظار السداد",
  paid: "تم السداد",
  in_progress: "جاري التنفيذ",
  completed: "مكتملة",
};

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: project } = await supabase
    .from("projects")
    .select("*, clients(*), stages(*)")
    .eq("id", id)
    .single();

  if (!project) {
    return (
      <div className="shell">
        <p className="muted">المشروع غير موجود.</p>
      </div>
    );
  }

  const stages = (project.stages || []).sort((a, b) => a.stage_number - b.stage_number);

  return (
    <div className="shell">
      <a href="/admin" className="muted" style={{ textDecoration: "none" }}>
        ← رجوع للوحة التحكم
      </a>

      <div className="card" style={{ marginTop: "1.2rem" }}>
        <span className="tag">{project.package_name}</span>
        <h1 className="title" style={{ marginTop: "0.7rem" }}>
          {project.title}
        </h1>
        <p className="muted">
          العميل: {project.clients.full_name} ({project.clients.email}) — إجمالي الباقة:{" "}
          {Number(project.package_price).toLocaleString("ar-SA")} {project.currency}
        </p>
      </div>

      <div className="card">
        <h2 className="title" style={{ fontSize: "1.15rem" }}>
          المراحل
        </h2>
        <div className="timeline" style={{ marginTop: "1.2rem" }}>
          {stages.map((stage) => (
            <div className={`stage ${stage.status}`} key={stage.id}>
              <span className="stage-dot">{stage.stage_number}</span>
              <div className="stage-head">
                <span className="stage-title">{stage.title}</span>
                <span className={`stage-status ${stage.status}`}>
                  {STATUS_LABEL[stage.status] || stage.status}
                </span>
              </div>
              {stage.description && <p className="stage-desc">{stage.description}</p>}
              <p className="stage-amount">
                {Number(stage.amount).toLocaleString("ar-SA")} {project.currency}
              </p>
              <div style={{ marginTop: "0.9rem" }}>
                <StageActions stageId={stage.id} status={stage.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
