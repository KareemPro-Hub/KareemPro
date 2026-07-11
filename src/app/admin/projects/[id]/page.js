import { requireAdmin } from "@/lib/admin";
import StageCard from "./StageCard";
import TimelineActions from "./TimelineActions";
import RiyalIcon from "@/app/components/RiyalIcon";
import CheckIcon from "@/app/components/CheckIcon";
import { addStage } from "@/app/admin/actions";
import { getAdminTimeline, getEstimatedDuration } from "@/lib/timeline";

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
      <section className="view active">
        <p className="muted">المشروع غير موجود.</p>
      </section>
    );
  }

  const stages = (project.stages || []).sort((a, b) => a.stage_number - b.stage_number);
  const adminTimeline = getAdminTimeline(project.package_name);
  const usableSteps = adminTimeline.map((s) => s.key);
  const currentIdx = usableSteps.indexOf(project.timeline_step);
  const isProjectCompleted = currentIdx === usableSteps.length - 1;
  const [pkgName, pkgTagline] = (project.package_name || "").split("|").map((s) => s.trim());

  return (
    <section className="view active">
      <a href="/admin/projects" className="muted" style={{ textDecoration: "none" }}>
        ← رجوع للوحة التحكم
      </a>

      <div className="card project-header-block">
        <div className="project-package-badge">
          <span className="project-package-name">{pkgName}</span>
          {pkgTagline && <span className="project-package-tagline">{pkgTagline}</span>}
        </div>
        <div className="project-price-divider" />
        <span className="project-price-label">قيمة الباقة</span>
        <div className="project-price-display">
          <span dir="ltr">{Number(project.package_price).toLocaleString("en-US")}</span>
          <RiyalIcon size="0.7em" />
        </div>
      </div>

      <div className="card">
        <div className="section-heading">
          <span className="section-heading-icon">🛠️</span>
          مسار الإنتاج
        </div>
        {isProjectCompleted && (
          <span className="project-completed-badge">
            <CheckIcon size="0.95em" />
            المشروع مكتمل
          </span>
        )}
        <p className="muted" style={{ marginBottom: "1.2rem" }}>
          أين يقف المشروع الآن في التنفيذ — منفصل عن مراحل السداد بالأسفل.
        </p>
        <div className="process-timeline">
          {adminTimeline.map((item, idx) => {
            const state =
              currentIdx === -1
                ? idx === 0
                  ? "current"
                  : "upcoming"
                : idx < currentIdx
                ? "completed"
                : idx === currentIdx
                ? "current"
                : "upcoming";
            return (
              <div className={`process-step ${state}`} key={item.key}>
                <span className="process-dot">
                  {state === "completed" ? <CheckIcon size="0.85em" /> : idx + 1}
                </span>
                <div className="process-body">
                  <span className="process-title">{item.title}</span>
                  <span className="process-desc">{item.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="timeline-note" style={{ marginTop: "1rem" }}>
          مدة التنفيذ المتوقعة: {getEstimatedDuration(project.package_name)}، حسب
          سرعة إرسال البيانات ومراجعة المتاجر.
        </p>
        <div style={{ marginTop: "1.4rem" }}>
          <TimelineActions
            projectId={project.id}
            currentStep={project.timeline_step || usableSteps[0]}
            steps={usableSteps}
          />
        </div>
      </div>

      <div className="card">
        <div className="section-heading">
          <span className="section-heading-icon">💳</span>
          المراحل المالية (السداد)
        </div>
        <div className="stage-timeline" style={{ marginTop: "1.2rem" }}>
          {stages.map((stage) => (
            <StageCard stage={stage} key={stage.id} />
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
    </section>
  );
}
