import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const STATUS_LABEL = {
  upcoming: "لم تبدأ بعد",
  awaiting_payment: "بانتظار السداد",
  paid: "تم السداد",
  in_progress: "جاري التنفيذ",
  completed: "مكتملة",
};

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("*, stages(*)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="shell">
      <div className="top-bar">
        <a href="/" className="brand-row" style={{ marginBottom: 0 }}>
          <img src="/logo-transparent.png" alt="Kareem Pro" />
          <span>KAREEM PRO</span>
        </a>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn-outline btn-sm">
            تسجيل الخروج
          </button>
        </form>
      </div>

      <h1 className="title">
        أهلاً بيك، <span className="g-text">{user.email}</span>
      </h1>
      <p className="muted" style={{ marginBottom: "2rem" }}>
        تابع مراحل مشروعك وحالة السداد لكل مرحلة أول بأول.
      </p>

      {!projects || projects.length === 0 ? (
        <div className="card">
          <p className="muted">لسه مفيش مشاريع مرتبطة بحسابك. لو فيه مشروع متفق عليه، تواصل معنا وهنضيفه.</p>
        </div>
      ) : (
        projects.map((project) => {
          const stages = (project.stages || []).sort(
            (a, b) => a.stage_number - b.stage_number
          );
          const paidCount = stages.filter((s) =>
            ["paid", "in_progress", "completed"].includes(s.status)
          ).length;

          return (
            <div className="card" key={project.id}>
              <span className="tag">{project.package_name}</span>
              <h2 className="title" style={{ marginTop: "0.7rem" }}>
                {project.title}
              </h2>
              <p className="muted">
                إجمالي الباقة:{" "}
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text)" }} dir="ltr">
                  {Number(project.package_price).toLocaleString("en-US")} {project.currency}
                </span>{" "}
                — {paidCount} من {stages.length} مراحل قيد السداد أو منتهية
              </p>

              <div className="timeline" style={{ marginTop: "1.8rem" }}>
                {stages.map((stage) => (
                  <div className={`stage ${stage.status}`} key={stage.id}>
                    <span className="stage-dot">{stage.stage_number}</span>
                    <div className="stage-head">
                      <span className="stage-title">{stage.title}</span>
                      <span className={`stage-status ${stage.status}`}>
                        {STATUS_LABEL[stage.status] || stage.status}
                      </span>
                    </div>
                    {stage.description && (
                      <p className="stage-desc">{stage.description}</p>
                    )}
                    <p className="stage-amount">
                      قيمة المرحلة:{" "}
                      <span dir="ltr">
                        {Number(stage.amount).toLocaleString("en-US")} {project.currency}
                      </span>
                    </p>
                    {stage.status === "awaiting_payment" && (
                      <div className="notice notice-error" style={{ marginTop: "0.8rem" }}>
                        هذه المرحلة بانتظار السداد لبدء التنفيذ. حوّل المبلغ عبر حساب
                        &quot;برق&quot; أو STC Pay على نفس الرقم، وابعت صورة الإيصال على واتساب
                        عشان نبدأ فورًا.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
