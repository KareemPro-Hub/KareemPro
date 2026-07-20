import { requireAdmin } from "@/lib/admin";
import StageCard from "./StageCard";
import TimelineActions from "./TimelineActions";
import AddStageModal from "./AddStageModal";
import DiscountModal from "./DiscountModal";
import CancelDiscountButton from "./CancelDiscountButton";
import ProjectFilesSection from "./ProjectFilesSection";
import RiyalIcon from "@/app/components/RiyalIcon";
import CheckIcon from "@/app/components/CheckIcon";
import WhatsAppButton from "./WhatsAppButton";
import { getAdminTimeline } from "@/lib/timeline";
import { buildWhatsAppUrl, progressMessage } from "@/lib/whatsapp";

// Default serverless function duration (10s) isn't reliably enough for the
// headless-Chromium payment-receipt PDF (see advanceStage → generatePaymentReceiptPdf)
// triggered from this page's "تأكيد استلام الدفع" action — cold Chromium
// launch + page render can take a few seconds on its own.
export const maxDuration = 60;

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

  // WhatsApp follow-up for the timeline's current step — the green button
  // next to the timeline header opens the client's chat with the approved
  // progress message (step title + description) pre-typed.
  const currentStep = currentIdx >= 0 ? adminTimeline[currentIdx] : null;
  const progressWaUrl =
    currentStep && project.clients?.phone
      ? buildWhatsAppUrl(
          project.clients.phone,
          progressMessage({ stepTitle: currentStep.title, stepDesc: currentStep.desc })
        )
      : null;

  return (
    <section className="view active">
      <a href="/admin/projects" className="proj-detail-back">
        رجوع للوحة التحكم ←
      </a>

      <div className="proj-detail-title-bar">
        <h1 className="proj-detail-title">{project.title}</h1>
        {project.clients?.full_name && (
          <div className="proj-detail-client">صاحب المشروع: {project.clients.full_name}</div>
        )}
      </div>

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
        {Number(project.discount_amount) > 0 && (
          <div className="proj-detail-discount-badge">
            <span className="proj-detail-discount-old" dir="ltr">
              {Number(project.original_price).toLocaleString("en-US")}
            </span>
            <span>خصم {Number(project.discount_amount).toLocaleString("en-US")} ريال</span>
          </div>
        )}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          <DiscountModal projectId={project.id} packagePrice={project.package_price} />
          {Number(project.discount_amount) > 0 && <CancelDiscountButton projectId={project.id} />}
        </div>
      </div>

      <div className="proj-detail-section">
        <div className="proj-detail-section-head">
          <div className="proj-detail-section-title">
            <span className="proj-detail-section-icon">🛠️</span>
            مسار الإنتاج
          </div>
          <div className="proj-detail-timeline-actions-head">
            {progressWaUrl && <WhatsAppButton url={progressWaUrl} label="إرسال التقدم" small />}
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
            <StageCard
              stage={stage}
              clientName={project.clients?.full_name || ""}
              clientPhone={project.clients?.phone || null}
              key={stage.id}
            />
          ))}
          {stages.length === 0 && <p className="muted">لسه مفيش مراحل سداد مضافة.</p>}
        </div>
      </div>

      <ProjectFilesSection projectId={project.id} files={files} />
    </section>
  );
}
