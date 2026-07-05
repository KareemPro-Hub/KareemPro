import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RiyalIcon from "@/app/components/RiyalIcon";
import OnboardingFunnel from "./OnboardingFunnel";

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
      onboardingContent = (
        <div className="card">
          <span className="tag">تم توقيع العقد ✅</span>
          <h2 className="title" style={{ marginTop: "0.7rem" }}>
            بانتظار بدء العمل على مشروعك
          </h2>
          <p className="muted">
            شكرًا لثقتك، فريقنا هيبدأ التجهيز لمشروع &quot;{proposal.project_title}&quot;
            {chosen ? (
              <>
                {" "}
                — باقة <strong style={{ color: "var(--text)" }}>{chosen.name}</strong>
              </>
            ) : null}
            . هيوصلك إشعار أول ما تبدأ أول مرحلة.
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

          return (
            <div className="card" key={project.id}>
              <span className="tag">{project.package_name}</span>
              <h2 className="title" style={{ marginTop: "0.7rem" }}>
                {project.title}
              </h2>
              <p className="muted">
                إجمالي الباقة:{" "}
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text)" }}>
                  <span dir="ltr">{Number(project.package_price).toLocaleString("en-US")}</span>
                  <RiyalIcon size="0.8em" />
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
                      <span>
                        <span dir="ltr">{Number(stage.amount).toLocaleString("en-US")}</span>
                        <RiyalIcon />
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
