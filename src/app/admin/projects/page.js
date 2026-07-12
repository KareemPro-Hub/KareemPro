import { requireAdmin } from "@/lib/admin";
import Money from "@/app/components/Money";
import ProjectActions from "../ProjectActions";
import { getAdminTimeline } from "@/lib/timeline";
import { projectStatusLabel } from "@/lib/adminFinance";
import { STATUS_DOT_COLORS } from "../AdminIcons";

const AVATAR_PALETTE = [
  "linear-gradient(135deg,#ff7b27,#ffad38)",
  "linear-gradient(135deg,#e8720d,#c1590a)",
  "linear-gradient(135deg,#ffad38,#e8720d)",
];

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

        <div className="proj-luxe-card">
          {projects.map((p, i) => {
            const adminTimeline = getAdminTimeline(p.package_name);
            const usableSteps = adminTimeline.map((s) => s.key);
            const currentIdx = usableSteps.indexOf(p.timeline_step);
            const percent =
              currentIdx === -1 ? 0 : Math.round(((currentIdx + 1) / usableSteps.length) * 100);
            const [pkgName] = (p.package_name || "").split("|").map((s) => s.trim());
            const isLast = i === projects.length - 1;

            return (
              <div className={`proj-luxe-row${isLast ? " last" : ""}`} key={p.id}>
                <span
                  className="proj-luxe-avatar"
                  style={{ background: AVATAR_PALETTE[i % AVATAR_PALETTE.length] }}
                >
                  {(p.title || "؟").trim().charAt(0)}
                </span>

                <div className="proj-luxe-name-block">
                  <a href={`/admin/projects/${p.id}`} className="proj-luxe-title">
                    {p.title}
                  </a>
                  <div className="proj-luxe-status-line">
                    <span
                      className="proj-luxe-status-dot"
                      style={{ background: STATUS_DOT_COLORS[p.status] || "#98a6bd" }}
                    />
                    <span>
                      {projectStatusLabel(p.status)} — {pkgName}
                    </span>
                  </div>
                </div>

                <div className="proj-luxe-block">
                  <span className="proj-luxe-label">صاحب المشروع</span>
                  <b>{p.clientName}</b>
                </div>

                <div className="proj-luxe-block">
                  <span className="proj-luxe-label">قيمة الباقة</span>
                  <b>
                    <Money value={p.package_price} />
                  </b>
                </div>

                <div className="proj-luxe-progress-block">
                  <span className="proj-luxe-label">نسبة الإنجاز</span>
                  <div className="proj-luxe-progress-row">
                    <span className="proj-luxe-progress-percent">{percent}%</span>
                    <div className="proj-luxe-progress-track">
                      <div className="proj-luxe-progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>

                <ProjectActions projectId={p.id} projectTitle={p.title} currentStatus={p.status} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
