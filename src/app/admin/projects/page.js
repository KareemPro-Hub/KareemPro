import { requireAdmin } from "@/lib/admin";
import Money from "@/app/components/Money";
import ProjectActions from "../ProjectActions";
import { getAdminTimeline } from "@/lib/timeline";
import { projectStatusLabel } from "@/lib/adminFinance";

const LOGO_COLORS = ["coral", "cyan", "violet"];

export default async function AdminProjectsPage() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("clients")
    .select("full_name, projects(*, stages(*))")
    .order("created_at", { ascending: false });

  const projects = (clients || [])
    .flatMap((c) => (c.projects || []).map((p) => ({ ...p, clientName: c.full_name })))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <section className="view active">
      <div className="panel projects-panel">
        <div className="panel-head">
          <div>
            <span className="overline">مساحة المشاريع</span>
            <h2>كل المشاريع</h2>
          </div>
          <a className="text-btn" href="/admin/projects/new">
            + مشروع جديد
          </a>
        </div>

        {projects.length === 0 && <p className="muted">لسه مفيش مشاريع.</p>}

        {projects.map((p, i) => {
          const adminTimeline = getAdminTimeline(p.package_name);
          const usableSteps = adminTimeline.map((s) => s.key);
          const currentIdx = usableSteps.indexOf(p.timeline_step);
          const percent =
            currentIdx === -1 ? 0 : Math.round(((currentIdx + 1) / usableSteps.length) * 100);
          const [pkgName] = (p.package_name || "").split("|").map((s) => s.trim());

          return (
            <div className="project-row" key={p.id}>
              <div className={`project-logo ${LOGO_COLORS[i % LOGO_COLORS.length]}`}>
                {(p.title || "؟").trim().charAt(0)}
              </div>
              <div className="project-name">
                <a href={`/admin/projects/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <b>{p.title}</b>
                </a>
                <span>{pkgName} — {projectStatusLabel(p.status)}</span>
              </div>
              <div className="client">
                <span>العميل</span>
                <b>{p.clientName}</b>
              </div>
              <div className="deadline">
                <span>قيمة الباقة</span>
                <b>
                  <Money value={p.package_price} />
                </b>
              </div>
              <div className="progress">
                <span>
                  <b>{percent}%</b> مكتمل
                </span>
                <i>
                  <u style={{ width: `${percent}%` }} />
                </i>
              </div>
              <ProjectActions projectId={p.id} projectTitle={p.title} currentStatus={p.status} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
