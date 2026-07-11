import { requireAdmin } from "@/lib/admin";
import { getAdminTimeline, getEstimatedDuration } from "@/lib/timeline";
import { projectStatusLabel } from "@/lib/adminFinance";

export default async function AdminDeliveryPage() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("clients")
    .select("full_name, projects(*)")
    .order("created_at", { ascending: false });

  const projects = (clients || []).flatMap((c) =>
    (c.projects || []).map((p) => ({ ...p, clientName: c.full_name }))
  );

  return (
    <section className="view active">
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="overline">الإدارة والأداء</span>
            <h2>مركز التسليم — مسار الإنتاج لكل مشروع</h2>
          </div>
        </div>

        {projects.length === 0 && <p className="muted">لسه مفيش مشاريع.</p>}

        {projects.map((p) => {
          const adminTimeline = getAdminTimeline(p.package_name);
          const usableSteps = adminTimeline.map((s) => s.key);
          const currentIdx = usableSteps.indexOf(p.timeline_step);

          return (
            <div key={p.id} style={{ borderTop: "1px solid var(--line)", padding: "18px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
                <div>
                  <b style={{ fontSize: "13px" }}>{p.title}</b>
                  <span style={{ fontSize: "11px", color: "#8b99af", marginRight: "8px" }}>
                    {p.clientName} — {projectStatusLabel(p.status)}
                  </span>
                </div>
                <a className="text-btn" href={`/admin/projects/${p.id}`}>
                  فتح المشروع ←
                </a>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {adminTimeline.map((step, idx) => {
                  const state =
                    currentIdx === -1
                      ? idx === 0
                        ? "current"
                        : "upcoming"
                      : idx < currentIdx
                      ? "done"
                      : idx === currentIdx
                      ? "current"
                      : "upcoming";
                  const bg =
                    state === "done" ? "#ddf9ef" : state === "current" ? "#fff0dc" : "#f1f6fc";
                  const color =
                    state === "done" ? "#23b584" : state === "current" ? "#f39732" : "#8b99af";
                  return (
                    <span
                      key={step.key}
                      title={step.title}
                      style={{
                        fontSize: "10px",
                        padding: "5px 9px",
                        borderRadius: "8px",
                        background: bg,
                        color,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {idx + 1}. {step.title}
                    </span>
                  );
                })}
              </div>
              <p style={{ fontSize: "10px", color: "#8b99af", marginTop: "8px" }}>
                مدة التنفيذ المتوقعة: {getEstimatedDuration(p.package_name)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
