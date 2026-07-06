import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RiyalIcon from "@/app/components/RiyalIcon";
import OnboardingFunnel from "./OnboardingFunnel";
import { getClientTimeline, adminKeyToClientKey } from "@/lib/timeline";

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

  const [{ data: projects }, { data: client }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, stages(*)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const clientName = client?.full_name || user.email;

  let onboardingContent = null;
  if (!projects || projects.length === 0) {
    const [{ data: about }, { data: portfolio }, { data: testimonials }, { data: proposal }] =
      await Promise.all([
        supabase.from("site_content").select("*").eq("key", "about_us").maybeSingle(),
        supabase.from("portfolio_items").select("*").order("sort_order", { ascending: true }),
        supabase.from("testimonials").select("*").order("sort_order", { ascending: true }),
        supabase
          .from("proposals")
          .select("*, proposal_packages!proposal_packages_proposal_id_fkey(*)")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (!proposal) {
      onboardingContent = (
        <div className="card">
          <p className="muted">
            جاري تجهيز عرضك الفني والمالي، هيوصلك إشعار على بريدك أول ما يكون جاهز. لو محتاج
            حاجة دلوقتي، تواصل معنا مباشرة.
          </p>
        </div>
      );
    } else if (proposal.status === "pending") {
      onboardingContent = (
        <OnboardingFunnel
          clientName={clientName}
          about={about}
          portfolio={portfolio}
          testimonials={testimonials}
          proposal={proposal}
        />
      );
    } else if (proposal.status === "accepted") {
      const chosen = (proposal.proposal_packages || []).find(
        (p) => p.id === proposal.selected_package_id
      );
      const chosenName = chosen ? chosen.name.split("|")[0].trim() : null;
      onboardingContent = (
        <div className="card">
          <span className="signed-badge-lg">✅ تم توقيع العقد</span>
          <h2 className="title" style={{ marginTop: "1rem" }}>
            بانتظار بدء العمل على مشروعك
          </h2>
          <div className="accepted-meta">
            <div className="meta-item">
              <span className="meta-label">المشروع</span>
              <span className="meta-value">{proposal.project_title}</span>
            </div>
            {chosenName && (
              <div className="meta-item">
                <span className="meta-label">الباقة المختارة</span>
                <span className="meta-value g-text">{chosenName}</span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-label">الحالة</span>
              <span className="meta-value">جاري التجهيز للبدء 🚀</span>
            </div>
          </div>
          <p className="muted" style={{ marginTop: "1.2rem" }}>
            هيوصلك إشعار على بريدك أول ما تبدأ أول مرحلة من مشروعك.
          </p>
        </div>
      );
    } else if (proposal.status === "rejected") {
      onboardingContent = (
        <div className="card">
          <p className="muted">
            تم استلام ردك بخصوص العرض، وشكرًا لوقتك. لو حابب نراجع العرض تاني أو نناقش نقطة
            معينة، تواصل معنا في أي وقت.
          </p>
        </div>
      );
    }
  }

  return (
    <div className="shell">
      <div className="top-bar">
        <a href="/" className="brand-row" style={{ marginBottom: 0 }}>
          <span>KAREEM PRO</span>
          <img src="/logo-transparent.png" alt="Kareem Pro" />
        </a>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn-outline btn-sm">
            تسجيل الخروج
          </button>
        </form>
      </div>

      <h1 className="title">
        أهلًا بك، <span className="g-text">{clientName}</span> 👋
      </h1>
      <p className="muted" style={{ marginBottom: "2rem" }}>
        الآن .. راقب نمو مشروعك واستثمارك لحظة بلحظة ..
      </p>

      {!projects || projects.length === 0 ? (
        onboardingContent
      ) : (
        projects.map((project) => {
          const stages = (project.stages || []).sort(
            (a, b) => a.stage_number - b.stage_number
          );
          const paidCount = stages.filter((s) =>
            ["paid", "in_progress", "completed"].includes(s.status)
          ).length;
          const clientTimeline = getClientTimeline(project.package_name);
          const clientCurrentKey = adminKeyToClientKey(
            project.package_name,
            project.timeline_step || clientTimeline[0]?.key
          );
          const clientCurrentIdx = clientTimeline.findIndex((r) => r.key === clientCurrentKey);
          const [pkgName, pkgTagline] = (project.package_name || "").split("|").map((s) => s.trim());

          return (
            <div className="card" key={project.id}>
              <div className="project-header-block">
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
              <p className="muted" style={{ marginTop: "0.8rem", textAlign: "center" }}>
                {paidCount} من {stages.length} مراحل قيد السداد أو منتهية
              </p>

              <div className="section-heading" style={{ marginTop: "1.6rem" }}>
                <span className="section-heading-icon">🛠️</span>
                مراحل الإنتاج
              </div>
              <p className="muted" style={{ marginBottom: "0.4rem" }}>
                أين يقف مشروعك الآن في التنفيذ — منفصلة عن مراحل السداد بالأسفل.
              </p>
              <p className="timeline-note" style={{ marginBottom: "0.4rem" }}>
                مدة التنفيذ المتوقعة: من 4 إلى 10 أسابيع عمل، حسب سرعة إرسال البيانات
                ومراجعة المتاجر.
              </p>
              <div className="process-timeline" style={{ marginTop: "1rem" }}>
                {clientTimeline.map((item, idx) => {
                  const state =
                    clientCurrentIdx === -1
                      ? idx === 0
                        ? "current"
                        : "upcoming"
                      : idx < clientCurrentIdx
                      ? "completed"
                      : idx === clientCurrentIdx
                      ? "current"
                      : "upcoming";
                  return (
                    <div className={`process-step ${state}`} key={item.key}>
                      <span className="process-dot">
                        {state === "completed" ? "✔" : idx + 1}
                      </span>
                      <div className="process-body">
                        <span className="process-title">{item.title}</span>
                        <span className="process-desc">{item.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="section-heading" style={{ marginTop: "1.8rem" }}>
                <span className="section-heading-icon">💳</span>
                مراحل السداد
              </div>
              <p className="muted" style={{ marginBottom: "0.4rem" }}>
                مراحل سداد قيمة الباقة على دفعات، منفصلة عن مراحل الإنتاج بالأعلى.
              </p>
              <div className="timeline" style={{ marginTop: "1rem" }}>
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
                      <span>
                        <span dir="ltr">{Number(stage.amount).toLocaleString("en-US")}</span>
                        <RiyalIcon />
                      </span>
                    </p>
                    {stage.status === "awaiting_payment" && (
                      <div className="notice notice-error" style={{ marginTop: "0.8rem" }}>
                        <p style={{ margin: "0 0 0.7rem 0" }}>
                          هذه المرحلة بانتظار السداد لبدء التنفيذ. التحويل يكون{" "}
                          <strong>دوليًا من بنك الراجحي إلى بنك مصر</strong>.
                        </p>
                        <p style={{ margin: "0 0 0.7rem 0" }}>
                          نزّل ملف بيانات المستفيد وأضفه في تطبيق الراجحي لكي يتم
                          التحويل الدولي بنجاح:{" "}
                          <a
                            href="/kareem-pro-bank-beneficiary-guide.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="notice-link"
                          >
                            تحميل بيانات المستفيد (PDF)
                          </a>
                        </p>
                        <p style={{ margin: 0 }}>
                          بعد التحويل، فضلاً زودنا بصورة الإيصال عبر الواتساب على الرقم{" "}
                          <a
                            href="https://wa.me/966507069605"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="notice-link"
                          >
                            966507069605+
                          </a>{" "}
                          لننطلق مباشرة.
                        </p>
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
