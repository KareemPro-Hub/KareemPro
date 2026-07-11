import { requireAdmin } from "@/lib/admin";
import Money from "@/app/components/Money";
import ProjectActions from "./ProjectActions";
import { clientFinance, sumFinances } from "@/lib/adminFinance";
import { getAdminTimeline } from "@/lib/timeline";
import { timeAgo } from "@/lib/timeAgo";
import AdminMoneyPrivacy from "./AdminMoneyPrivacy";

const LOGO_COLORS = ["coral", "cyan", "violet"];

export default async function AdminOverview() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("clients")
    .select("*, projects(*, stages(*)), proposals(id, status, created_at, decided_at, project_title)")
    .order("created_at", { ascending: false });

  const totals = sumFinances(clients);
  const allProjects = (clients || []).flatMap((c) =>
    (c.projects || []).map((p) => ({ ...p, client: c }))
  );
  const activeProjects = allProjects.filter((p) => p.status === "active");
  const allProposals = (clients || []).flatMap((c) =>
    (c.proposals || []).map((pr) => ({ ...pr, client: c }))
  );
  const pendingProposals = allProposals.filter((pr) => pr.status === "pending");
  const allStages = allProjects.flatMap((p) => (p.stages || []).map((s) => ({ ...s, project: p })));
  const awaitingPaymentStages = allStages.filter((s) => s.status === "awaiting_payment");
  const completedStages = allStages.filter((s) => ["paid", "in_progress", "completed"].includes(s.status));

  // Real, honest action-item preview (same source the /admin/tasks page uses
  // in full) — no fabricated to-dos.
  const actionItems = [
    ...pendingProposals.map((pr) => ({
      key: `proposal-${pr.id}`,
      title: `قرار معلّق: عرض ${pr.client.full_name}`,
      sub: pr.project_title || "عرض فني ومالي",
      href: `/admin/proposal/${pr.client.id}`,
    })),
    ...awaitingPaymentStages.map((s) => ({
      key: `stage-${s.id}`,
      title: `تأكيد استلام دفعة: ${s.title}`,
      sub: `${s.project.title} — ${s.project.client.full_name}`,
      href: `/admin/projects/${s.project.id}`,
    })),
  ].slice(0, 4);

  // Real recent-activity feed built from actual timestamps across the data
  // we already have — no placeholder events.
  const activity = [
    ...(clients || []).map((c) => ({
      icon: "blue",
      symbol: "＋",
      text: `انضم عميل جديد: ${c.full_name}`,
      at: c.created_at,
    })),
    ...allProposals
      .filter((pr) => pr.decided_at)
      .map((pr) => ({
        icon: pr.status === "accepted" ? "green" : "purple",
        symbol: pr.status === "accepted" ? "✓" : "✕",
        text: `${pr.status === "accepted" ? "تمت الموافقة على" : "تم رفض"} عرض ${pr.client.full_name}`,
        at: pr.decided_at,
      })),
    ...allStages
      .filter((s) => s.paid_at)
      .map((s) => ({
        icon: "green",
        symbol: "↓",
        text: `تم تحصيل ${s.title} من ${s.project.client.full_name}`,
        money: s.amount,
        at: s.paid_at,
      })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 5);

  const recentProjects = allProjects
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <section className="view active">
      <div className="hero-card">
        <div>
          <span className="eyebrow">الدخل الصافي حتى الآن</span>
          <div className="income-wrap">
            <div className="income">
              <AdminMoneyPrivacy value={totals.collected} />
            </div>
          </div>
          <p className="positive">
            ↗ <span>{(clients || []).length} عميل · {allProjects.length} مشروع</span>
          </p>
        </div>
        <div className="spark">
          <svg viewBox="0 0 500 125" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="adminSpark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb343" stopOpacity=".5"/><stop offset="1" stopColor="#ff922e" stopOpacity="0"/></linearGradient></defs>
            <path className="area" fill="url(#adminSpark)" d="M0,110 C40,104 58,90 95,93 S150,60 188,72 S245,95 276,60 S330,50 356,58 S410,25 500,14 L500,125 L0,125Z"/>
            <path className="line" d="M0,110 C40,104 58,90 95,93 S150,60 188,72 S245,95 276,60 S330,50 356,58 S410,25 500,14"/>
          </svg>
          <div className="spark-label"><b>{activeProjects.length} مشاريع</b><span>قيد التنفيذ</span></div>
        </div>
        <div className="hero-side">
          <span>المتاح للتحصيل</span>
          <b><AdminMoneyPrivacy value={totals.pending} /></b>
          <a href="/admin/wallet">عرض المحفظة ←</a>
        </div>
      </div>

      <div className="stats">
        <article>
          <div className="stat-icon blue custom-stat-icon">
            <img src="/admin-ui/icons/projects-schedule.png" alt="مشاريع نشطة" />
          </div>
          <div>
            <span>مشاريع نشطة</span>
            <b>{activeProjects.length}</b>
            <small>من أصل {allProjects.length} مشروع</small>
          </div>
        </article>
        <article>
          <div className="stat-icon purple custom-stat-icon">
            <img src="/admin-ui/icons/target.png" alt="عروض بانتظار قرار" />
          </div>
          <div>
            <span>عروض بانتظار قرار</span>
            <b>{pendingProposals.length}</b>
            <small>من أصل {allProposals.length} عرض</small>
          </div>
        </article>
        <article>
          <div className="stat-icon green custom-stat-icon checklist-icon">
            <img src="/admin-ui/icons/checklist.png" alt="مراحل سداد مكتملة" />
          </div>
          <div>
            <span>مراحل سداد مكتملة</span>
            <b>{completedStages.length}</b>
            <small>من أصل {allStages.length} مرحلة</small>
          </div>
        </article>
        <article>
          <div className="stat-icon orange custom-stat-icon">
            <img src="/admin-ui/icons/time-is-money.png" alt="مستحقات قادمة" />
          </div>
          <div>
            <span>مستحقات قادمة</span>
            <b>
              <Money value={totals.pending} />
            </b>
            <small>{awaitingPaymentStages.length} مرحلة بانتظار التأكيد</small>
          </div>
        </article>
      </div>

      <div className="content-grid">
        <section className="panel projects-panel">
          <div className="panel-head">
            <div>
              <span className="overline">مساحة المشاريع</span>
              <h2>المشاريع الجارية</h2>
            </div>
            <a className="text-btn" href="/admin/projects">
              عرض الكل ←
            </a>
          </div>
          {recentProjects.length === 0 && <p className="muted">لسه مفيش مشاريع.</p>}
          {recentProjects.map((p, i) => {
            const adminTimeline = getAdminTimeline(p.package_name);
            const usableSteps = adminTimeline.map((s) => s.key);
            const currentIdx = usableSteps.indexOf(p.timeline_step);
            const percent =
              currentIdx === -1
                ? 0
                : Math.round(((currentIdx + 1) / usableSteps.length) * 100);
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
                  <span>{pkgName}</span>
                </div>
                <div className="client">
                  <span>العميل</span>
                  <b>{p.client.full_name}</b>
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
        </section>

        <aside className="panel today">
          <div className="panel-head">
            <div>
              <span className="overline">خطة التنفيذ</span>
              <h2>يحتاج إجراء</h2>
            </div>
            <a className="text-btn" href="/admin/tasks">
              عرض الكل ←
            </a>
          </div>
          {actionItems.length === 0 && <p className="muted">لا يوجد شيء بانتظار إجراء الآن 🎉</p>}
          {actionItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
            >
              <div className="task" style={{ cursor: "pointer" }}>
                <span />
                <div>
                  <b>{item.title}</b>
                  <small>{item.sub}</small>
                </div>
              </div>
            </a>
          ))}
        </aside>
      </div>

      <div className="bottom-grid">
        <section className="panel schedule">
          <div className="panel-head">
            <div>
              <span className="overline">مسار الإنتاج</span>
              <h2>المشاريع النشطة حسب المرحلة</h2>
            </div>
          </div>
          {activeProjects.length === 0 && <p className="muted">لا توجد مشاريع نشطة حاليًا.</p>}
          <div className="timeline" style={{ gridTemplateColumns: "1fr" }}>
            {activeProjects.slice(0, 4).map((p) => {
              const adminTimeline = getAdminTimeline(p.package_name);
              const currentStep = adminTimeline.find((s) => s.key === p.timeline_step);
              return (
                <div key={p.id}>
                  <i className="dot coral-bg" />
                  <p>
                    <b>{p.title}</b>
                    <span>{currentStep ? currentStep.title : "بداية المسار"}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel activity">
          <div className="panel-head">
            <div>
              <span className="overline">آخر المستجدات</span>
              <h2>النشاط الأخير</h2>
            </div>
          </div>
          {activity.length === 0 && <p className="muted">لا يوجد نشاط بعد.</p>}
          {activity.map((item, i) => (
            <div className="activity-item" key={i}>
              <span className={`activity-icon ${item.icon}`}>{item.symbol}</span>
              <p>
                <b>{item.text}</b>
                {item.money != null && (
                  <small>
                    <Money value={item.money} />
                  </small>
                )}
              </p>
              <time>{timeAgo(item.at)}</time>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}
