import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RiyalIcon from "@/app/components/RiyalIcon";
import CheckIcon from "@/app/components/CheckIcon";
import FilesIcon from "@/app/components/FilesIcon";
import SupportIcon from "@/app/components/SupportIcon";
import OnboardingFunnel from "./OnboardingFunnel";
import StagesAccordion from "./StagesAccordion";
import NotificationBell from "./NotificationBell";
import { getClientTimeline, adminKeyToClientKey } from "@/lib/timeline";
import { PAY_STATUS_STYLE, PAY_STATUS_LABEL } from "@/lib/paymentStatus";
import "./portal-dashboard.css";

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: projects }, { data: client }, { data: notifications }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, stages(*)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("notifications")
      .select("*")
      .eq("client_id", user.id)
      .eq("for_admin", false)
      .order("created_at", { ascending: false })
      .limit(30),
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
          <span><b>Kareem</b> <i>Pro</i><small>بوابة النخبة</small></span>
        </a>
        <nav className="client-nav">
          <a className="active" href="#overview">
            <span className="ico nav-image-icon"><img src="/admin-ui/icons/binocular.png" alt="" /></span> نظرة عامة
          </a>
          <a href="#projects">
            <span className="ico nav-image-icon"><img src="/admin-ui/icons/project-management.png" alt="" /></span> إدارة مشاريعي
          </a>
          <a href="#payments">
            <span className="ico nav-image-icon"><img src="/admin-ui/icons/checklist.png" alt="" /></span> مراحل الإنتاج والسداد
          </a>
          <a href="#workflow">
            <span><FilesIcon size="1.5em" /></span> الملفات والتسليمات
          </a>
          <a href="https://wa.me/966507069605" target="_blank" rel="noopener noreferrer">
            <span><SupportIcon size="1.5em" /></span> الدعم الفني
          </a>
        </nav>
        <div className="client-account">
          <span className="client-account-avatar">{(clientName || "ع").trim().charAt(0)}</span>
          <div><b>{clientName}</b><small>صاحب مشروع</small></div>
          <form action="/auth/signout" method="post"><button type="submit" aria-label="تسجيل الخروج">↪</button></form>
        </div>
      </aside>

      <main className="client-dashboard-main">
        <header className="client-dashboard-header" id="overview">
          <div>
            <h1>أهلًا بك، طموحك الرقمي يولد عملاقًا.</h1>
            <p>هنا تتابع مسار مشروعك، الميزانية، والقرارات لحظةً بلحظة.</p>
          </div>
          <div className="client-head-right">
            <NotificationBell notifications={notifications || []} />
            <span className="client-head-avatar">{(clientName || "ع").trim().charAt(0)}</span>
          </div>
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
          const isOnHold = project.status === "on_hold" || project.status === "cancelled";
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
          const isNotStarted = !isCompleted && !isOnHold && progressPercent === 0;
          const statusDot = isCompleted
            ? { label: "مكتمل", color: "#2f8a4e", gradient: "linear-gradient(135deg,#3fae66,#2f8a4e)" }
            : isOnHold
            ? { label: "متوقف", color: "#b93a2e", gradient: "linear-gradient(135deg,#d1483a,#b93a2e)" }
            : isNotStarted
            ? { label: "في الانتظار", color: "#2a6fb0", gradient: "linear-gradient(135deg,#4a92d6,#2a6fb0)" }
            : { label: "العمل مستمر", color: "#2f8a4e", gradient: "linear-gradient(135deg,#3fae66,#2f8a4e)" };
          const [pkgName, pkgTagline] = (project.package_name || "").split("|").map((s) => s.trim());

          return (
            <div className="client-project-wrap" id="projects" key={project.id}>
              <div className="project-luxe-top">
                <div className="project-luxe-status" style={{ "--dot-color": statusDot.color, "--dot-gradient": statusDot.gradient }}>
                  <span className="project-luxe-dot"><i /><i /></span>
                  <span>{statusDot.label}</span>
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
              <section className="client-progress-hero">
                <div className="hero-meta-col">
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

              <StagesAccordion
                clientTimeline={clientTimeline}
                clientCurrentIdx={clientCurrentIdx}
                stages={stages}
              />
              </div>
            </div>
          );
        })
      )}
      </main>
    </div>
  );
}
