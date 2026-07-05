import { requireAdmin } from "@/lib/admin";
import StageActions from "./StageActions";
import TimelineActions from "./TimelineActions";
import RiyalIcon from "@/app/components/RiyalIcon";
import { addStage } from "@/app/admin/actions";
import { getAdminTimeline } from "@/lib/timeline";

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
  const adminTimeline = getAdminTimeline(project.package_name);
  const usableSteps = adminTimeline.map((s) => s.step);
  const [pkgName, pkgTagline] = (project.package_name || "").split("|").map((s) => s.trim());

  return (
    <div className="shell">
      <a href="/admin" className="muted" style={{ textDecoration: "none" }}>
        ← رجوع للوحة التحكم
      </a>

      <div className="card" style={{ marginTop: "1.2rem" }}>
        <div className="project-package-badge">
          <span className="project-package-name">{pkgName}</span>
          {pkgTagline && <span className="project-package-tagline">{pkgTagline}</span>}
        </div>
        <h1 className="title" style={{ marginTop: "0.9rem" }}>
          {project.title}
        </h1>
        <p className="muted">
          العميل: {project.clients.full_name} ({project.clients.email}) — إجمالي الباقة:{" "}
          <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text)" }}>
            <span dir="ltr">{Number(project.package_price).toLocaleString("en-US")}</span>
            <RiyalIcon size="0.8em" />
          </span>
        </p>
      </div>

      <div className="card">
        <h2 className="title" style={{ fontSize: "1.15rem" }}>
          مسار الإنتاج
        </h2>
        <p className="muted" style={{ marginBottom: "1.2rem" }}>
          أين يقف المشروع الآن في التنفيذ — منفصل عن مراحل السداد بالأسفل.
        </p>
        <div className="process-timeline">
          {adminTimeline.map((item) => {
            const state =
              item.step < project.timeline_step
                ? "completed"
                : item.step === project.timeline_step
                ? "current"
                : "upcoming";
            return (
              <div className={`process-step ${state}`} key={item.step}>
                <span className="process-dot">{state === "completed" ? "✔" : item.step}</span>
                <div className="process-body">
                  <span className="process-title">{item.title}</span>
                  <span className="process-desc">{item.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: "1.4rem" }}>
          <TimelineActions
            projectId={project.id}
            currentStep={project.timeline_step || 1}
            steps={usableSteps}
          />
        </div>
      </div>

      <div className="card">
        <h2 className="title" style={{ fontSize: "1.15rem" }}>
          المراحل المالية (السداد)
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
                <span dir="ltr">{Number(stage.amount).toLocaleString("en-US")}</span>
                <RiyalIcon />
              </p>
              <div style={{ marginTop: "0.9rem" }}>
                <StageActions stageId={stage.id} status={stage.status} />
              </div>
            </div>
          ))}
          {stages.length === 0 && <p className="muted">لسه مفيش مراحل سداد مضافة.</p>}
        </div>

        <form action={addStage} style={{ marginTop: "1.4rem" }}>
          <input type="hidden" name="project_id" value={project.id} />
          <div className="field">
            <label>عنوان المرحلة</label>
            <input type="text" name="title" required placeholder="مثال: الدفعة الأولى" />
          </div>
          <div className="field">
            <label>وصف مختصر (اختياري)</label>
            <textarea name="description" rows={2} />
          </div>
          <div className="field">
            <label>المبلغ (ريال)</label>
            <input type="number" name="amount" min="0" step="0.01" required />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            + إضافة مرحلة سداد
          </button>
        </form>
      </div>
    </div>
  );
}
