export const BLOG_REVIEW_TITLE = "تقديم مدونة للمراجعة";
const basicName = `الباقة الأساسية|${BLOG_REVIEW_TITLE}`;
const professionalName = `الباقة الاحترافية|${BLOG_REVIEW_TITLE}`;

const repairFeatures = [
  "إصلاح الروابط المعكوسة لصفحات «من نحن» و«اتصل بنا»، ومعالجة رابط 404.",
  "إنشاء صفحة اتفاقية الاستخدام وإخلاء المسؤولية.",
  "تصنيف جميع المقالات داخل أقسام واضحة وإظهارها في القائمة والشريط الجانبي.",
  "إصلاح زر القائمة الجانبية، وتعريب القالب، ومعالجة الأخطاء البرمجية في صفحات المقالات.",
  "تحسين المقالات الحالية بعناوين H2 وH3، والربط الداخلي، وأوصاف Alt للصور، وضبط اسم الكاتب.",
  "فحص الأرشفة في Google Search Console، ومراجعة المدونة بالكامل وإرسال طلب المراجعة إلى Google AdSense.",
];
const contentFeatures = [
  "**كتابة وتنسيق ونشر 15 مقالًا احترافيًا حصريًا جديدًا متوافقًا مع السيو، بنشر تدريجي.**",
  "تصميم أغلفة احترافية للمقالات الجديدة، مع تهيئة Alt والربط الداخلي.",
];

export const BLOG_REVIEW_CARD_TERM = "قيمة الباقة مقابل أعمال الإصلاح والتهيئة والمحتوى المتفق عليها. تتولى Google وحدها مراجعة الطلب وتحديد مدته وقرار القبول.";
export const BLOG_REVIEW_CONTRACT_TERM = `${BLOG_REVIEW_CARD_TERM} يشمل التنفيذ إرسال طلب مراجعة واحد، ويتم التسليم والسداد وفق مراحل الباقة دون انتظار نتيجة Google.`;

export const BLOG_REVIEW_TEMPLATE = {
  projectTitle: BLOG_REVIEW_TITLE,
  packages: [
    {
      name: basicName, price: 250, original_price: 450, is_featured: false,
      features: ["إصلاح الأخطاء التقنية وتهيئة المحتوى الحالي.", ...repairFeatures].join("\n"),
    },
    {
      name: professionalName, price: 400, original_price: 650, is_featured: true,
      features: ["تهيئة كاملة ومحتوى جديد يرفع فرص القبول.", "كل مميزات الباقة الأساسية.", ...repairFeatures, ...contentFeatures].join("\n"),
    },
  ],
};

export function isBlogReview(text) {
  return (text || "").includes(BLOG_REVIEW_TITLE);
}

export function blogReviewHasContent(name) {
  return isBlogReview(name) && name.split("|")[0].trim() === "الباقة الاحترافية";
}

export function blogReviewCardFeatures(pkg) {
  if (!blogReviewHasContent(pkg.name)) return pkg.features || "";
  return (pkg.features || "").split("\n").filter(line => !repairFeatures.includes(line)).join("\n");
}

export function blogReviewStages(pkg) {
  const total = Math.round(Number(pkg.price) * 100);
  if (!Number.isSafeInteger(total) || total < 2) return null;
  const deposit = Math.floor(total / 2);
  return [
    { title: "الدفعة الأولى", amount: deposit / 100, description: "عند توقيع العقد وبدء العمل." },
    {
      title: "الدفعة الثانية", amount: (total - deposit) / 100,
      description: blogReviewHasContent(pkg.name)
        ? "بعد إتمام الإصلاحات ونشر 15 مقالًا وإرسال طلب المراجعة."
        : "بعد إتمام الإصلاحات والتهيئة وإرسال طلب المراجعة.",
    },
  ];
}

export function blogReviewTimeline(name) {
  return [
    { key: "contract_payment", title: "العقد والدفعة الأولى", desc: "توقيع العقد وتأكيد الدفعة الأولى." },
    { key: "blog_review_access", title: "استلام الصلاحيات", desc: "استلام صلاحيات المدونة وSearch Console وحفظ نسخة احتياطية." },
    { key: "blog_review_repairs", title: "الإصلاحات والتهيئة", desc: "معالجة الروابط والقالب والصفحات وتنظيم الأقسام وتحسين المقالات الحالية." },
    ...(blogReviewHasContent(name) ? [{ key: "blog_review_content", title: "كتابة ونشر 15 مقالًا", desc: "إعداد المقالات الحصرية وأغلفتها وتهيئتها للسيو ونشرها تدريجيًا." }] : []),
    { key: "blog_review_delivery", title: "الفحص والتقديم والتسليم", desc: "فحص الأرشفة ومراجعة المدونة وإرسال طلب المراجعة واستكمال السداد." },
  ];
}
