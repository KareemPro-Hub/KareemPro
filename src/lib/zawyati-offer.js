const blogName = "مدونة زاويتي";
const basicName = `الباقة الأساسية|${blogName}`;
const professionalName = `الباقة الاحترافية|${blogName}`;

const developmentFeatures = [
  "تطوير المدونة الحالية على نطاقها القائم، والعمل على الملاحظات المرتبطة برفض أدسنس بسبب «محتوى منخفض القيمة».",
  "تنظيم هوية المدونة وتصنيفاتها في 3 إلى 5 أقسام رئيسية، منها التقنية والوظائف والطبخ، مع دمج التصنيفات المتكررة ونقل المقالات إلى أقسامها المناسبة.",
  "ترتيب الأقسام في القائمة العلوية وإضافة روابط الخصوصية وشروط الاستخدام أسفل الموقع.",
  "مراجعة المقالات الحالية لتحديد ما يحتاج تحديثًا أو إعادة صياغة أو حذفًا، وإضافة خطوات عملية وأمثلة وصور ومصادر عند الحاجة، ونشر التحديثات تدريجيًا بعد مراجعتها.",
  "مراجعة دقة الوظائف والأخبار وحداثتها، وتوضيح المسميات والشروط ومواعيد التقديم وإضافة الروابط الرسمية ومعالجة الإعلانات المنتهية.",
  "تحديث صفحة «من نحن»، وتجهيز صفحة «تواصل معنا» واختبار وسيلة التواصل، ومراجعة سياسة الخصوصية وشروط الاستخدام وإخلاء المسؤولية.",
  "**قالب حديث واحترافي هدية لأول تعاون.**",
  "ضبط القالب لهوية زاويتي، وفحص الكود ووسوم الصفحات وعرض الجوال وإصلاح الروابط المكسورة ومعالجة الصفحات الفارغة.",
  "مراجعة إعدادات السيو والفهرسة في Blogger وSearch Console والتحقق من قدرة Google على فحص الصفحات المهمة.",
  "مطابقة معرّف الناشر في ملف ads.txt مع حساب أدسنس المستخدم للتقديم وضبط الملف على أساس المطابقة.",
  "مراجعة تفاصيل الرفض في Google AdSense وإرسال طلب مراجعة جديد بعد التنفيذ والتحقق.",
];

export const ZAWYATI_REVIEW_TERM = "قيمة الباقة مقابل الأعمال الموضّحة. نتولى إرسال طلب المراجعة، وتحدد Google وحدها مدة المراجعة وقرار القبول. ويتم التسليم والسداد وفق مراحل الباقة دون انتظار نتيجة المراجعة.";

export const ZAWYATI_TEMPLATE = {
  projectTitle: `تطوير ${blogName}`,
  packages: [
    {
      name: basicName, price: 250, original_price: 500, is_featured: false,
      features: [...developmentFeatures, "المدة التقديرية: 5 أيام من بدء العمل واستلام الصلاحيات."].join("\n"),
    },
    {
      name: professionalName, price: 450, original_price: 900, is_featured: true,
      features: [
        "كل مميزات الباقة الأساسية.",
        ...developmentFeatures,
        "**كتابة ونشر 30 مقالًا احترافيًا جديدًا + 5 مقالات هدية لأول تعاون — الإجمالي 35 مقالًا جديدًا.**",
        "المدة التقديرية: شهر تقريبًا، مع نشر المقالات تدريجيًا.",
      ].join("\n"),
    },
  ],
};

export function isZawyati(text) {
  return text === basicName || text === professionalName || /^تطوير مدونة زاويتي(?:\s|$)/.test(text || "");
}

export function zawyatiHasContent(name) {
  return name === professionalName;
}

export function zawyatiCardFeatures(pkg) {
  if (!zawyatiHasContent(pkg.name)) return pkg.features;
  return pkg.features.split("\n").filter(line => !developmentFeatures.includes(line)).join("\n");
}

export function zawyatiStages(pkg) {
  const total = Math.round(Number(pkg.price) * 100);
  const hasContent = zawyatiHasContent(pkg.name);
  let deposit = hasContent ? Math.floor(total / 2) : 15000;
  if (hasContent && total === 45000) deposit = 25000;
  if (!Number.isSafeInteger(total) || deposit <= 0 || deposit >= total) return null;
  return [
    { title: "الدفعة الأولى", amount: deposit / 100, description: "عند توقيع العقد وبدء العمل." },
    {
      title: "الدفعة الثانية", amount: (total - deposit) / 100,
      description: hasContent ? "عند إتمام التطوير ونشر المقالات." : "عند إتمام التطوير.",
    },
  ];
}

export function zawyatiTimeline(name) {
  return [
    { key: "contract_payment", title: "العقد والدفعة الأولى", desc: "توقيع العقد وتأكيد الدفعة الأولى." },
    { key: "zawyati_access", title: "استلام الصلاحيات", desc: "استلام صلاحيات المدونة والحسابات اللازمة وحفظ نسخة احتياطية." },
    { key: "zawyati_development", title: "تطوير المدونة الحالية", desc: "تنظيم المحتوى والأقسام وضبط القالب والسياسات والسيو والفهرسة." },
    ...(zawyatiHasContent(name) ? [{ key: "zawyati_content", title: "كتابة ونشر 35 مقالًا", desc: "30 مقالًا احترافيًا و5 مقالات هدية، تُنشر تدريجيًا خلال شهر تقريبًا." }] : []),
    { key: "zawyati_delivery", title: "المراجعة والتسليم", desc: "التحقق من الأعمال وإرسال طلب مراجعة أدسنس واستكمال السداد." },
  ];
}
