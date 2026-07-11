// صفحة معاينة داخلية فقط — بيانات وهمية لعرض شكل لوحة العميل بدون تسجيل دخول حقيقي.
// مش مربوطة بأي مصادقة أو قاعدة بيانات، وممكن تتشال في أي وقت.

const STATUS_LABEL = {
  upcoming: "لم تبدأ بعد",
  awaiting_payment: "بانتظار السداد",
  paid: "تم السداد",
  in_progress: "جاري التنفيذ",
  completed: "مكتملة",
};

const demoProjects = [
  {
    id: "demo-1",
    package_name: "الباقة الاحترافية",
    title: "منصة إدارة العيادات",
    package_price: 4500,
    currency: "SAR",
    stages: [
      {
        id: "s1",
        stage_number: 1,
        title: "التصميم وواجهات المستخدم",
        description: "تصميم الشاشات الرئيسية وتجربة المستخدم.",
        amount: 1500,
        status: "completed",
      },
      {
        id: "s2",
        stage_number: 2,
        title: "التطوير والبرمجة",
        description: "بناء الميزات الأساسية وربطها بقاعدة البيانات.",
        amount: 1500,
        status: "awaiting_payment",
      },
      {
        id: "s3",
        stage_number: 3,
        title: "الاختبار والتسليم النهائي",
        description: "مراجعة شاملة وتسليم المشروع جاهزًا للإطلاق.",
        amount: 1500,
        status: "upcoming",
      },
    ],
  },
];

export default function PortalPreviewPage() {
  const clientName = "عميل تجريبي";
  const projects = demoProjects;

  return (
    <div className="shell">
      <div
        className="notice"
        style={{
          marginBottom: "1.5rem",
          background: "rgba(239,75,122,0.12)",
          border: "1px solid rgba(239,75,122,0.35)",
          color: "#ef4b7a",
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        🔍 معاينة داخلية — بيانات وهمية لعرض شكل بوابة العميل، مش حساب حقيقي
      </div>

      <div className="top-bar">
        <a href="/" className="brand-row" style={{ marginBottom: 0 }}>
          <span>KAREEM PRO</span>
          <img src="/logo-transparent.png" alt="Kareem Pro" />
        </a>
        <button type="button" className="btn btn-outline btn-sm" disabled>
          تسجيل الخروج
        </button>
      </div>

      <h1 className="title">
        أهلًا بك، <span className="g-text">{clientName}</span> 👋
      </h1>
      <p className="muted" style={{ marginBottom: "2rem" }}>
        الآن .. راقب نمو مشروعك واستثمارك لحظة بلحظة ..
      </p>

      {projects.map((project) => {
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
              إجمالي الباقة: {Number(project.package_price).toLocaleString("ar-SA")}{" "}
              {project.currency} — {paidCount} من {stages.length} مراحل قيد السداد أو منتهية
            </p>

            <div className="stage-timeline" style={{ marginTop: "1.8rem" }}>
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
                    قيمة المرحلة: {Number(stage.amount).toLocaleString("ar-SA")} {project.currency}
                  </p>
                  {stage.status === "awaiting_payment" && (
                    <div className="notice notice-error" style={{ marginTop: "0.8rem" }}>
                      <p style={{ margin: "0 0 0.7rem 0" }}>
                        هذه المرحلة بانتظار السداد لبدء التنفيذ. التحويل يكون{" "}
                        <strong>دوليًا من بنك الراجحي إلى بنك مصر</strong>.
                      </p>
                      <p style={{ margin: "0 0 0.7rem 0" }}>
                        نزّل ملف بيانات المستفيد وأضفه في تطبيق الراجحي لكي يتم التحويل
                        الدولي بنجاح:{" "}
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
                        لكي ننطلق مباشرة.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
