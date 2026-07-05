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
  {
    id: 4,
    title: "منصات وتطبيقات",
    description: "كريم برو | الموقع الرسمي",
    image_url: "https://kareempro.com/kareempro-preview.webp",
    link_url: "https://kareempro.com/#platforms",
    stack_count: 6,
  },
  {
    id: 1,
    title: "مونتاج احترافي",
    description: "SJA CAPITAL",
    image_url: "https://i.ytimg.com/vi/X4k2BYJuKbk/mqdefault.jpg",
    link_url: "https://kareempro.com/?cat=montage#portfolio",
    stack_count: 4,
  },
  {
    id: 2,
    title: "تعليق صوتي",
    description: "جمعية نافع لسقيا الماء",
    image_url: "https://i.ytimg.com/vi/kpw-q_R5n9s/mqdefault.jpg",
    link_url: "https://kareempro.com/?cat=voiceover#portfolio",
    stack_count: 6,
  },
  {
    id: 3,
    title: "عرض مرئي",
    description: "جمعية نافع لسقيا الماء",
    image_url: "https://i.ytimg.com/vi/XA5TXQpjNrc/mqdefault.jpg",
    link_url: "https://kareempro.com/?cat=display#portfolio",
    stack_count: 4,
  },
  {
    id: 5,
    title: "ريلز وسناب",
    description: "جمعية هبة الصحية",
    image_url: "https://i.ytimg.com/vi/zhNVbDO2lcw/mqdefault.jpg",
    link_url: "https://kareempro.com/#reels",
    stack_count: 7,
  },
];

const fakeTestimonials = [
  { id: 1, quote: "تجربة احترافية من الألف للياء، التزام فعلي بالمواعيد وجودة تسليم فاقت توقعاتي.", client_name: "محمد العتيبي", role: "صاحب مشروع تجاري" },
  { id: 2, quote: "فريق متعاون جدًا ومتفهم لكل ملاحظاتي، والنتيجة النهائية كانت أكتر من رائعة.", client_name: "سارة الحربي", role: "مديرة تسويق" },
  { id: 3, quote: "دقة في التنفيذ وسرعة في الرد، أنصح بالتعامل معاهم لأي مشروع احترافي.", client_name: "خالد المطيري", role: "رائد أعمال" },
  { id: 4, quote: "أسلوب تعامل راقي واحترافية عالية في كل التفاصيل، شكرًا لكل الفريق.", client_name: "نورة الزهراني", role: "باحثة أكاديمية" },
  { id: 5, quote: "جودة الشغل فاقت السقف اللي كنت متوقعه، وتعاملي الجاي معاهم مؤكد.", client_name: "عبدالله القحطاني", role: "صاحب علامة تجارية" },
  { id: 6, quote: "خدمة سريعة ومنظمة، وكل خطوة كانت واضحة من البداية للتسليم.", client_name: "ريم الشمري", role: "منسقة فعاليات" },
  { id: 7, quote: "احترافية عالية في إدارة المشروع من أول يوم، والتسليم كان قبل الموعد المتفق عليه.", client_name: "فيصل الدوسري", role: "مدير تنفيذي" },
  { id: 8, quote: "اهتمام بالتفاصيل الدقيقة ونتيجة نهائية عكست بالظبط اللي كنت أتخيله.", client_name: "هند الشهري", role: "صاحبة متجر إلكتروني" },
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
        "تفعيل حماية الفيديوهات والملفات ومنع التحميل غير المصرح به - للمنصات التعليمية",
        "تفعيل بوابة الدفع (مدى، فيزا، Apple Pay، STC Bank)",
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
          <span>KAREEM PRO — معاينة تصميم فقط</span>
          <img src="/logo-transparent.png" alt="Kareem Pro" />
        </a>
      </div>

      <div
        className="notice"
        style={{ marginBottom: "1.5rem", background: "rgba(255,168,38,0.08)", border: "1px solid rgba(255,168,38,0.3)" }}
      >
        هذه صفحة معاينة داخلية ببيانات وهمية — مش شاشة عميل حقيقي، ومش متاحة لغير الأدمن.
      </div>

      <h1 className="title">
        أهلًا بك، <span className="g-text">عميل تجريبي</span> 👋
      </h1>
      <p className="muted" style={{ marginBottom: "2rem" }}>
        الآن .. راقب نمو مشروعك واستثمارك لحظة بلحظة ..
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
