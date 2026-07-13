import { requireAdmin } from "@/lib/admin";
import StageCard from "./StageCard";
import TimelineActions from "./TimelineActions";
import AddStageModal from "./AddStageModal";
import ProjectFilesSection from "./ProjectFilesSection";
import RiyalIcon from "@/app/components/RiyalIcon";
import CheckIcon from "@/app/components/CheckIcon";
import { getAdminTimeline } from "@/lib/timeline";

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: project } = await supabase
    .from("projects")
    .select("*, clients(*), stages(*), project_files(*)")
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
  const files = (project.project_files || []).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  const adminTimeline = getAdminTimeline(project.package_name);
  const usableSteps = adminTimeline.map((s) => s.key);
  const currentIdx = usableSteps.indexOf(project.timeline_step);
  const isProjectCompleted = currentIdx === usableSteps.length - 1;
  const [pkgName, pkgTagline] = (project.package_name || "").split("|").map((s) => s.trim());

  return (
    <section className="view active">
      <a href="/admin/projects" className="proj-detail-back">
        رجوع للوحة التحكم ←
      </a>

      <div className="proj-detail-hero">
        <div className="proj-detail-badge">
          <div className="proj-detail-badge-name">{pkgName}</div>
          {pkgTagline && <div className="proj-detail-badge-tagline">{pkgTagline}</div>}
        </div>
        <div className="proj-detail-hero-divider" />
        <div className="proj-detail-price-label">قيمة الباقة</div>
        <div className="proj-detail-price">
          <span dir="ltr">{Number(project.package_price).toLocaleString("en-US")}</span>
          <RiyalIcon size="0.55em" />
        </div>
      </div>

      <div className="proj-detail-section">
        <div className="proj-detail-section-head">
          <div className="proj-detail-section-title">
            <span className="proj-detail-section-icon">🛠️</span>
            مسار الإنتاج
          </div>
          <div className="proj-detail-timeline-actions-head">
            {isProjectCompleted && (
              <span className="proj-detail-completed-badge">
                <CheckIcon size="0.9em" /> المشروع مكتمل
              </span>
            )}
            <TimelineActions
              projectId={project.id}
              currentStep={project.timeline_step || usableSteps[0]}
              steps={usableSteps}
            />
          </div>
        </div>

        <div className="proj-detail-list">
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
              <div className="proj-detail-row" key={item.key}>
                <div className="proj-detail-row-text">
                  <div className="proj-detail-row-title">{item.title}</div>
                  <div className="proj-detail-row-desc">{item.desc}</div>
                </div>
                <div className="proj-detail-row-node-col">
                  <span className={`proj-detail-node ${state}`}>
                    {state === "completed" ? <CheckIcon size="0.85em" /> : idx + 1}
                  </span>
                  {idx < adminTimeline.length - 1 && <span className="proj-detail-node-line" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="proj-detail-section">
        <div className="proj-detail-section-head">
          <div className="proj-detail-section-title">
            <span className="proj-detail-section-icon">💳</span>
            المراحل المالية (السداد)
          </div>
          <AddStageModal projectId={project.id} />
        </div>

        <div className="proj-detail-list">
          {stages.map((stage) => (
            <StageCard stage={stage} key={stage.id} />
          ))}
          {stages.length === 0 && <p className="muted">لسه مفيش مراحل سداد مضافة.</p>}
        </div>
      </div>

      <ProjectFilesSection projectId={project.id} files={files} />
    </section>
  );
}
