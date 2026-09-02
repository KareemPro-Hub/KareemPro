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

// Mirrors the live "مدونة بلوجر ربحية" offer (two tiers) so Kareem can review
// the Blogger-specific cards, contract wording and cost note on his phone
// without creating/re-creating a real test client each time. Keep the names,
// prices and feature lines identical to SERVICE_TEMPLATES.blogger in
// admin/actions.js — this page is only useful while it stays a faithful copy.
const fakeProposal = {
  id: "preview",
  project_title: "إنشاء وإطلاق مدونة بلوجر ربحية",
  status: "pending",
  selected_package_id: null,
  proposal_packages: [
    {
      id: "pkg-1",
      name: "الباقة الأساسية|مدونة Blogger احترافية جاهزة لأدسنس",
      price: 900,
      original_price: 1500,
      is_featured: false,
      sort_order: 0,
      features: [
        "إنشاء المدونة على Blogger وربط الدومين",
        "تصميم وتخصيص قالب احترافي متجاوب بالكامل",
        "هيكلة التصنيفات والأقسام حسب مجال المدونة",
        "إعداد الصفحات الإلزامية (من نحن، سياسة الخصوصية، اتصل بنا)",
        "تحسين السيو الأساسي (Meta tags، خريطة الموقع، Schema)",
        "**كتابة ونشر 5 مقالات تأسيسية احترافية من فريقنا**",
        "تسليم المدونة كاملة جاهزة خلال 5 أيام عمل",
        "متابعة مجانية لمساعدتك في نشر باقي المحتوى والتقديم لأدسنس لاحقًا",
        "تسليم كامل الصلاحيات والوصول",
        "طريقة السداد: ثلاث دفعات. كل دفعة 300 ريال — مقدم، بعد إعداد الصفحات الإلزامية، وعند تسليم المدونة وكتابة المقالات التأسيسية.",
      ].join("\n"),
    },
    {
      id: "pkg-2",
      name: "الباقة الاحترافية|مدونة Blogger احترافية جاهزة لأدسنس بمحتوى كامل",
      price: 1400,
      original_price: 2000,
      is_featured: true,
      sort_order: 1,
      features: [
        "إنشاء المدونة على Blogger وربط الدومين",
        "تصميم وتخصيص قالب احترافي متجاوب بالكامل",
        "هيكلة التصنيفات والأقسام حسب مجال المدونة",
        "إعداد الصفحات الإلزامية (من نحن، سياسة الخصوصية، اتصل بنا)",
        "تحسين السيو الأساسي (Meta tags، خريطة الموقع، Schema)",
        "**كتابة ونشر 50 مقالًا احترافيًا من فريقنا**",
        "تسليم المدونة كاملة جاهزة خلال 5 أيام عمل",
        "متابعة مجانية لمساعدتك في نشر باقي المحتوى والتقديم لأدسنس لاحقًا",
        "تسليم كامل الصلاحيات والوصول",
        "طريقة السداد: ثلاث دفعات — 500 ريال مقدم، 450 ريال بعد إعداد الصفحات الإلزامية، 450 ريال عند تسليم المدونة وكتابة المقالات.",
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
