import OnboardingFunnel from "@/app/portal/OnboardingFunnel";

// ══════════════════ Design preview — fake data, no login required ══════════════════
// Lets the admin review exactly how the client-facing proposal funnel (including the
// Glass UI package cards) looks and behaves, without needing a real invited client.
// Not linked anywhere in the UI and not protected by middleware — just a visual sandbox.

const fakeAbout = {
  title: "تعرّف علينا",
  body:
    "Kareem Pro شريكك في بناء منتج رقمي احترافي من الفكرة لحد الإطلاق — نصمم ونطوّر منصات وتطبيقات متكاملة بأعلى معايير الجودة والسرعة.",
};

const fakePortfolio = [
  { id: 1, title: "منصة تعليمية", description: "موقع + تطبيقان لتقديم كورسات أونلاين", image_url: null },
  { id: 2, title: "متجر إلكتروني", description: "متجر كامل مع بوابة دفع وتطبيق جوال", image_url: null },
];

const fakeTestimonials = [
  { id: 1, quote: "فريق محترف واحترام مواعيد فعلاً نادر.", client_name: "أ. سعيد المطيري", role: "صاحب مشروع" },
  { id: 2, quote: "التنفيذ كان أسرع وأدق مما توقعت.", client_name: "م. نورة العتيبي", role: "مديرة تسويق" },
];

const fakeProposal = {
  id: "preview",
  project_title: "باقات طموحك الإبداعي",
  status: "pending",
  selected_package_id: null,
  proposal_packages: [
    {
      id: "pkg-1",
      name: "الباقة الأولى — الاقتصادية",
      price: 2500,
      is_featured: false,
      sort_order: 0,
      features: [
        "إطلاق سريع للمنصة كموقع كامل، بأقل تكلفة وبلا أي تنازل عن الجودة.",
        "تفعيل حماية الفيديوهات والملفات ومنع التحميل غير المصرح به",
        "تفعيل بوابة الدفع (مدى، فيزا، Apple Pay، STC Pay)",
        "تفعيل الإيميلات التلقائية للمستخدمين",
        "ربط الدومين الاحترافي واختبار شامل قبل الإطلاق",
        "بدون تطبيقات جوال",
      ].join("\n"),
    },
    {
      id: "pkg-2",
      name: "الباقة الثانية — المتميزة",
      price: 4500,
      is_featured: true,
      sort_order: 1,
      features: [
        "منصة كاملة + تطبيقان على المتجرين، بأفضل توازن بين السعر والمزايا.",
        "كل ما في الباقة الاقتصادية",
        "تطبيقا آيفون وأندرويد (WebView) منشوران على App Store وGoogle Play",
        "إشعارات فورية بكل تحديث أو نشاط جديد",
        "دعم فني لمدة 6 أشهر بعد التسليم",
      ].join("\n"),
    },
    {
      id: "pkg-3",
      name: "الباقة الثالثة — الاحترافية",
      price: 7500,
      is_featured: false,
      sort_order: 2,
      features: [
        "أعلى مستوى — تطبيقات أصلية سريعة، وبنية جاهزة للمستقبل.",
        "كل ما في الباقة المتميزة",
        "تطبيقا آيفون وأندرويد أصليان (Native) — أسرع وأسلس وأكثر ثباتًا",
        "بنية جاهزة لدمج الذكاء الاصطناعي",
        "أولوية في الدعم والصيانة بعد الإطلاق",
      ].join("\n"),
    },
  ],
};

export default function ProposalPreviewPage() {
  return (
    <div className="shell">
      <div className="top-bar">
        <a href="/" className="brand-row" style={{ marginBottom: 0 }}>
          <img src="/logo-transparent.png" alt="Kareem Pro" />
          <span>KAREEM PRO — معاينة تصميم فقط</span>
        </a>
      </div>

      <div
        className="notice"
        style={{ marginBottom: "1.5rem", background: "rgba(255,168,38,0.08)", border: "1px solid rgba(255,168,38,0.3)" }}
      >
        هذه صفحة معاينة داخلية ببيانات وهمية — مش شاشة عميل حقيقي، ومش متاحة لغير الأدمن.
      </div>

      <h1 className="title">
        أهلاً بيك، <span className="g-text">عميل تجريبي</span> 👋
      </h1>
      <p className="muted" style={{ marginBottom: "2rem" }}>
        راقب نمو مشروعك الآن
      </p>

      <OnboardingFunnel
        clientName="عميل تجريبي"
        about={fakeAbout}
        portfolio={fakePortfolio}
        testimonials={fakeTestimonials}
        proposal={fakeProposal}
      />
    </div>
  );
}
