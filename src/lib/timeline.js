// ══════════════════ Project process timeline ══════════════════
// Single source of truth for both the admin's and the client's timeline view
// — the client now sees the exact same steps as the admin, 1:1, so a step
// marked done on the admin side shows as done on the client's dashboard too.
// `projects.timeline_step` stores a step KEY (text), not a number — packages
// with a mobile app have extra steps that packages without one don't, so a
// fixed step count doesn't fit every tier.

function packageTier(packageName) {
  const name = (packageName || "").split("|")[0].trim();
  if (/بلوجر|blogger/i.test(name)) return "blogger";
  if (name.includes("الاحترافية")) return "professional";
  if (name.includes("المتميزة")) return "premium";
  return "economic"; // no mobile app in this tier
}

// Every possible step, in order (10-step process; economic tier skips the
// two app-only steps below since it has no mobile app).
// `tiers` restricts a step to specific package tiers (omit = all tiers).
const STEPS = [
  {
    key: "contract_payment",
    title: "العقد والدفعة الأولى",
    desc: "توقيع العقد وتأكيد استلام الدفعة الأولى.",
  },
  {
    key: "data_collection",
    title: "جمع بيانات المشروع",
    desc: "إرسال نموذج البيانات المطلوبة، واستلام البيانات اللازمة من صاحب المشروع.",
  },
  {
    key: "requirements_review",
    title: "مراجعة المتطلبات",
    desc: "مراجعة البيانات وتحديد نطاق التنفيذ حسب الباقة المختارة.",
  },
  {
    key: "identity_structure",
    title: "تجهيز الهوية والهيكل",
    desc: "إعداد الشكل العام، الصفحات الأساسية، وهيكل المنصة.",
  },
  {
    key: "platform_execution",
    title: "تنفيذ المنصة",
    desc: "بناء المنصة وتنفيذ الخصائص الأساسية المتفق عليها.",
  },
  {
    key: "integrations_setup",
    title: "الربط والإعدادات",
    desc: "ربط الدومين، بوابة الدفع، الإيميلات، والخدمات اللازمة.",
  },
  {
    key: "initial_preview_approval",
    title: "المعاينة الأولية والاعتماد",
    desc: "تجهيز نسخة أولية من المنصة واعتماد الشكل العام قبل النشر.",
  },
  // ── App-only steps (packages with a mobile app only) ──
  {
    key: "app_prep",
    tiers: ["premium", "professional"],
    title: "تجهيز التطبيق",
    desc: "تجهيز تطبيق الجوال حسب نوع الباقة: WebView أو Native.",
  },
  {
    key: "app_testing_stores",
    tiers: ["premium", "professional"],
    title: "الاختبار ومراجعة المتاجر",
    desc: "اختبار التطبيق، وتجهيزه للمراجعة على Google Play وApp Store.",
  },
  {
    key: "delivery_support",
    title: "التسليم والدعم الفني",
    desc: "تسليم المشروع وتفعيل فترة الدعم الفني.",
  },
];

// Blogger is a completely different production process from the platform
// packages above (no app, no data collection form, but a real content
// requirement before AdSense will even consider the blog) — so it gets its
// own step list entirely rather than reusing/filtering STEPS. Kept in the
// same shape ({ key, title, desc }) so getAdminTimeline/getClientTimeline
// and the admin's step-navigation logic don't need to know the difference.
const BLOGGER_STEPS = [
  {
    key: "blog_contract_payment",
    title: "العقد والدفعة الأولى",
    desc: "توقيع العقد وتأكيد استلام الدفعة الأولى.",
  },
  {
    key: "blog_data_collection",
    title: "جمع بيانات المدونة",
    desc: "استلام اسم المدونة، المجال، والمحتوى المبدئي من صاحب المشروع.",
  },
  {
    key: "blog_creation_domain",
    title: "إنشاء المدونة وربط الدومين",
    desc: "إنشاء المدونة على Blogger وربط الدومين الخاص بها.",
  },
  {
    key: "blog_template_structure",
    title: "تصميم القالب وهيكلة الأقسام",
    desc: "تخصيص قالب احترافي متجاوب، وترتيب التصنيفات والأقسام.",
  },
  {
    key: "blog_mandatory_pages_seo",
    title: "إعداد الصفحات الإلزامية والسيو",
    desc: "صفحات من نحن وسياسة الخصوصية واتصل بنا، مع تحسين السيو الأساسي.",
  },
  // From here on, Kareem's own obligation is already fully discharged (see
  // blog_delivery_articles below) — the remaining two steps are the client's
  // own work plus optional free follow-up, tracked here purely for
  // visibility and explicitly NOT tied to any remaining payment.
  {
    key: "blog_delivery_articles",
    title: "تسليم المدونة والمقالات التأسيسية",
    desc: "تسليم المدونة كاملة جاهزة + نشر 5 مقالات من فريقنا، خلال 5 أيام عمل. هنا يُستحق باقي قيمة الباقة، ويُعتبر تنفيذنا مكتمل.",
  },
  {
    key: "blog_remaining_content",
    title: "نشر باقي المحتوى (45 مقالًا)",
    desc: "مسؤولية صاحب المشروع بالكامل، بالتدريج وليس دفعة واحدة.",
  },
  {
    key: "blog_adsense_submission",
    title: "التقديم لجوجل أدسنس",
    desc: "بعد اكتمال نشر الـ50 مقالًا، متابعة اختيارية من فريقنا مجانًا.",
  },
];

// Full breakdown for the admin, adapted to the project's package.
export function getAdminTimeline(packageName) {
  const tier = packageTier(packageName);
  if (tier === "blogger") return BLOGGER_STEPS;
  return STEPS.filter((s) => !s.tiers || s.tiers.includes(tier));
}

// The client sees the exact same steps as the admin — no grouping or
// simplification — so progress marked on one side matches the other 1:1.
export function getClientTimeline(packageName) {
  return getAdminTimeline(packageName).map((s) => ({ ...s, memberKeys: [s.key] }));
}

// Since admin and client steps are now identical, the current admin key IS
// the client key — kept as a function so callers don't need to change.
export function adminKeyToClientKey(packageName, adminKey) {
  return adminKey;
}

// Estimated delivery time shown under the timeline — the professional tier
// moves faster than its step count alone would suggest, so it gets its own
// (shorter) estimate instead of the general range.
const DURATION_BY_TIER = {
  economic: "من 3 إلى 4 أسابيع عمل",
  premium: "من 4 إلى 10 أسابيع عمل",
  professional: "من 6 إلى 8 أسابيع عمل",
  // This is our own delivery commitment only (platform + our 5 articles) —
  // the client's remaining 45 articles and the eventual AdSense submission
  // are a separate, unbounded phase after delivery, not part of what we're
  // committing a timeframe to here.
  blogger: "5 أيام عمل",
};

export function getEstimatedDuration(packageName) {
  const tier = packageTier(packageName);
  return DURATION_BY_TIER[tier] || DURATION_BY_TIER.economic;
}
