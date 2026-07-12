import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RiyalIcon from "@/app/components/RiyalIcon";
import CheckIcon from "@/app/components/CheckIcon";
import OnboardingFunnel from "./OnboardingFunnel";
import { getClientTimeline, adminKeyToClientKey, getEstimatedDuration } from "@/lib/timeline";
import "./portal-dashboard.css";

const STATUS_LABEL = {
  upcoming: "لم تبدأ بعد",
  awaiting_payment: "بانتظار السداد",
  paid: "تم السداد",
  in_progress: "جاري التنفيذ",
  completed: "مكتملة",
};

const PAY_STATUS_STYLE = {
  paid: { color: "#2f8a4e", bg: "rgba(47,138,78,.12)", icon: "✓", ring: "linear-gradient(135deg,#3fae66,#2f8a4e)" },
  in_progress: { color: "#2f8a4e", bg: "rgba(47,138,78,.12)", icon: "✓", ring: "linear-gradient(135deg,#3fae66,#2f8a4e)" },
  completed: { color: "#2f8a4e", bg: "rgba(47,138,78,.12)", icon: "✓", ring: "linear-gradient(135deg,#3fae66,#2f8a4e)" },
  awaiting_payment: { color: "#c1590a", bg: "rgba(255,140,40,.14)", icon: "…", ring: "linear-gradient(135deg,#ff7b27,#ffad38)" },
  upcoming: { color: "#8a7466", bg: "rgba(120,70,30,.08)", icon: "…", ring: "linear-gradient(135deg,#c8b6a6,#a68f7c)" },
};

const PAY_STATUS_LABEL = {
  paid: "مدفوعة",
  in_progress: "مدفوعة",
  completed: "مدفوعة",
  awaiting_payment: "بانتظار السداد",
  upcoming: "قيد الانتظار",
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
    <div className="client-dashboard">
      <aside className="client-sidebar">
        <a href="/" className="client-dashboard-brand">
          <span className="client-logo"><img src="/admin-ui/icons/kareem-pro-logo.png" alt="Kareem Pro" /></span>
          <span><b>Kareem</b> <i>Pro</i><small>بوابة صاحب المشروع</small></span>
        </a>
        <nav className="client-nav">
          <a className="active" href="#overview"><span>⌂</span> نظرة عامة</a>
          <a href="#projects"><span>▦</span> مشاريعي</a>
          <a href="#payments"><span>◈</span> الدفعات والفواتير</a>
          <a href="#workflow"><span>▤</span> الملفات والتسليمات</a>
          <a href="https://wa.me/966507069605" target="_blank" rel="noopener noreferrer"><span>◌</span> المحادثات</a>
          <a href="https://wa.me/966507069605" target="_blank" rel="noopener noreferrer"><span>؟</span> الدعم الفني</a>
        </nav>
        <div className="client-account">
          <span className="client-account-avatar">{(clientName || "ع").trim().charAt(0)}</span>
          <div><b>{clientName}</b><small>عميل Kareem Pro</small></div>
          <form action="/auth/signout" method="post"><button type="submit" aria-label="تسجيل الخروج">↪</button></form>
        </div>
      </aside>

      <main className="client-dashboard-main">
        <header className="client-dashboard-header">
          <div>
            <h1>أهلًا بك، طموحك الرقمي يولد عملاقًا.</h1>
            <p>هنا تتابع مسار مشروعك، الميزانية، والقرارات لحظةً بلحظة.</p>
          </div>
          <span className="client-head-avatar">{(clientName || "ع").trim().charAt(0)}</span>
        </header>

      {!projects || projects.length === 0 ? (
        onboardingContent
      ) : (
        projects.map((project) => {
          const stages = (project.stages || []).sort(
            (a, b) => a.stage_number - b.stage_number
          );
          const paidAmount = stages
            .filter((s) => ["paid", "in_progress", "completed"].includes(s.status))
            .reduce((sum, s) => sum + Number(s.amount || 0), 0);
          const paidPercent = project.package_price
            ? Math.round((paidAmount / Number(project.package_price)) * 100)
            : 0;
          const isCompleted = project.status === "completed";
          const statusDot = isCompleted
            ? { color: "#2f8a4e", gradient: "linear-gradient(135deg,#3fae66,#2f8a4e)" }
            : { color: "#c1590a", gradient: "linear-gradient(135deg,#ff7b27,#ffad38)" };
          const clientTimeline = getClientTimeline(project.package_name);
          const clientCurrentKey = adminKeyToClientKey(
            project.package_name,
            project.timeline_step || clientTimeline[0]?.key
          );
          const clientCurrentIdx = clientTimeline.findIndex((r) => r.key === clientCurrentKey);
          const isProjectCompleted = clientCurrentIdx === clientTimeline.length - 1;
          const progressPercent = isProjectCompleted
            ? 100
            : clientTimeline.length > 1
            ? Math.round((Math.max(clientCurrentIdx, 0) / (clientTimeline.length - 1)) * 100)
            : 0;
          const [pkgName, pkgTagline] = (project.package_name || "").split("|").map((s) => s.trim());

          return (
            <div className="client-project-wrap" id="projects" key={project.id}>
              <div className="project-luxe-top">
                <div className="project-luxe-status" style={{ "--dot-color": statusDot.color, "--dot-gradient": statusDot.gradient }}>
                  <span className="project-luxe-dot"><i /><i /></span>
                  <span>{isCompleted ? "مكتمل" : "قيد التنفيذ"}</span>
                </div>
                <div className="project-luxe-badge">
                  <div className="project-luxe-badge-col">
                    <div className="project-luxe-badge-name"><span className="project-luxe-badge-dot" /><span className="project-luxe-badge-name-text">{pkgName}</span></div>
                    <div className="project-luxe-badge-price">
                      <span dir="ltr">{Number(project.package_price).toLocaleString("en-US")}</span>
                      <RiyalIcon size="0.6em" />
                    </div>
                    <div className="project-luxe-paid-wrap">
                      <div className="project-luxe-paid-track"><i style={{ width: `${Math.min(Math.max(paidPercent, 0), 100)}%` }} /></div>
                      <small>تم سداد {paidPercent}% من إجمالي المبلغ</small>
                    </div>
                  </div>
                  {stages.length > 0 && (
                    <>
                      <div className="project-luxe-badge-divider" />
                      <div className="project-luxe-payments-col">
                        {stages.map((stage) => {
                          const st = PAY_STATUS_STYLE[stage.status] || PAY_STATUS_STYLE.upcoming;
                          const pct = project.package_price
                            ? Math.round((Number(stage.amount || 0) / Number(project.package_price)) * 100)
                            : 0;
                          return (
                            <div className="project-luxe-payment-row" key={stage.id}>
                              <div className="project-luxe-payment-left">
                                <span className="project-luxe-payment-node" style={{ background: st.ring }}>
                                  {st.icon}
                                </span>
                                <div>
                                  <div className="project-luxe-payment-title">الدفعة {stage.stage_number}</div>
                                  <div className="project-luxe-payment-pct">{pct}% من الإجمالي</div>
                                </div>
                              </div>
                              <div className="project-luxe-payment-right">
                                <div className="project-luxe-payment-amount">
                                  <span dir="ltr">{Number(stage.amount || 0).toLocaleString("en-US")}</span>
                                  <RiyalIcon size="0.55em" />
                                </div>
                                <span className="project-luxe-payment-status" style={{ color: st.color, background: st.bg }}>
                                  {PAY_STATUS_LABEL[stage.status] || stage.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <section className="client-progress-hero" id="overview">
                <div className="hero-meta-col">
                  <div><span>مدة التنفيذ المتوقعة</span><b>{getEstimatedDuration(project.package_name)}</b></div>
                  <div><span>حالة المشروع</span><b>{project.status === "completed" ? "تم التسليم" : "العمل مستمر"}</b></div>
                </div>
                <div className="hero-divider" />
                <div className="hero-copy-col">
                  <span>المرحلة الحالية</span>
                  <h2>{clientTimeline[clientCurrentIdx]?.title || clientTimeline[0]?.title}</h2>
                  <p>{clientTimeline[clientCurrentIdx]?.desc || "بدأنا تجهيز مشروعك."}</p>
                  <div className="hero-progress-track"><i style={{ width: `${progressPercent}%` }} /></div>
                  <small>المرحلة {Math.max(clientCurrentIdx + 1, 1)} من {clientTimeline.length}</small>
                </div>
                <div className="hero-ring-col">
                  <div className="hero-ring" style={{ "--progress": `${progressPercent}%` }}>
                    <div className="hero-ring-inner"><strong>{progressPercent}%</strong></div>
                  </div>
                  <span>نسبة الإنجاز</span>
                </div>
              </section>
              <div className="card client-project-card" id="payments">
              {isProjectCompleted && (
                <div className="project-completed-banner">
                  <span className="project-completed-icon">
                    <CheckIcon size="1.5em" color="#fff" />
                  </span>
                  <h3>مبروك! تم تسليم مشروعك بنجاح</h3>
                  <p>
                    وصل مشروعك لمرحلة التسليم والدعم الفني. شكرًا لثقتك في Kareem
                    Pro.
                  </p>
                </div>
              )}

              <div className="section-heading" style={{ marginTop: "1.6rem" }} id="workflow">
                <span className="section-heading-icon">🛠️</span>
                مراحل الإنتاج
              </div>
              <p className="muted" style={{ marginBottom: "0.4rem" }}>
                أين يقف مشروعك الآن في التنفيذ — منفصلة عن مراحل السداد بالأسفل.
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
                مدة التنفيذ المتوقعة: {getEstimatedDuration(project.package_name)}،
                حسب سرعة إرسال البيانات ومراجعة المتاجر.
              </p>

              <div className="section-heading" style={{ marginTop: "1.8rem" }}>
                <span className="section-heading-icon">💳</span>
                مراحل السداد
              </div>
              <p className="muted" style={{ marginBottom: "0.4rem" }}>
                مراحل سداد قيمة الباقة على دفعات، منفصلة عن مراحل الإنتاج بالأعلى.
              </p>
              <div className="stage-timeline" style={{ marginTop: "1rem" }}>
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
            </div>
          );
        })
      )}
      </main>
    </div>
  );
}
