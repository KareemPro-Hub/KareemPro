// Client-specific offer; does not change the public Blogger catalog.
export function isTechfixer(text) { return /TechFixer|تيك فيكسر/i.test(text || ""); }
export function techfixerHasContent(text) { return isTechfixer(text) && /الاحترافية|محتوى|مقال/.test(text || ""); }
const repairFeatures = [
  "مراجعة القالب وإصلاح الملاحظات البرمجية والسيو",
  "معالجة أسباب مشاكل الفهرسة وإعادة التوجيه ومتابعتها",
  "مراجعة ربط أدسنس وملف ads.txt",
  "تحسين العناوين وأوصاف الصور والروابط الداخلية",
  "مدة إصلاح الملاحظات: 5 أيام تقريبًا من استلام البيانات والصلاحيات اللازمة",
  "الدومين اختياري وتكلفة تسجيله وتجديده على صاحب المدونة",
];
export const TECHFIXER_TEMPLATE = {
  projectTitle: "تطوير مدونة تيك فيكسر — TechFixer",
  packages: [
    { name: "الباقة الأساسية|تيك فيكسر — TechFixer", price: 250, original_price: 500, is_featured: false,
      features: [...repairFeatures, "بدون كتابة مقالات جديدة", "طريقة السداد: 125 ريال عند التوقيع و125 ريال عند إتمام الإصلاحات"].join("\n") },
    { name: "الباقة الاحترافية|تيك فيكسر — TechFixer", price: 500, original_price: 900, is_featured: true,
      features: ["كل مميزات الباقة الأساسية", ...repairFeatures,
        "**كتابة ونشر 30 مقال احترافي متوافق مع السيو**", "**5 مقالات هدية لأول تعاون معنا — الإجمالي 35 مقال جديد**",
        "نشر المقالات بانتظام خلال شهر واحد", "طريقة السداد: 250 ريال عند التوقيع و250 ريال عند اكتمال نشر 35 مقال وإتمام الإصلاحات"].join("\n") },
  ],
};
export function techfixerStages(pkg) {
  if (!isTechfixer(pkg?.name)) return null;
  const total = Math.round(Number(pkg.price) * 100);
  if (!Number.isSafeInteger(total) || total <= 0) return null;
  return [Math.floor(total / 2), total - Math.floor(total / 2)].map((amount, i) => ({
    title: i ? "الدفعة الثانية" : "الدفعة الأولى", amount: amount / 100,
    description: i ? (techfixerHasContent(pkg.name) ? "عند إتمام الإصلاحات واكتمال نشر 35 مقال جديد." : "عند إتمام إصلاح وتهيئة المدونة.") : "عند توقيع العقد وبدء العمل.",
  }));
}
export function techfixerTimeline(name) {
  return [
    { key: "contract_payment", title: "العقد والدفعة الأولى", desc: "توقيع العقد وتأكيد الدفعة الأولى." },
    { key: "techfixer_access", title: "استلام البيانات والصلاحيات", desc: "استلام صلاحيات المدونة والحسابات اللازمة ونسخ احتياطية قبل التنفيذ." },
    { key: "techfixer_repairs", title: "إصلاح وتهيئة المدونة", desc: "معالجة ملاحظات القالب والسيو والربط والفهرسة خلال 5 أيام تقريبًا." },
    ...(techfixerHasContent(name) ? [{ key: "techfixer_content", title: "كتابة ونشر 35 مقال", desc: "30 مقال احترافي و5 مقالات هدية، تنشر بانتظام خلال شهر واحد." }] : []),
    { key: "techfixer_delivery", title: "المراجعة والتسليم", desc: "مراجعة الأعمال المتفق عليها وتسليمها واستكمال السداد." },
  ];
}

// Display compact inheritance without removing the full signed scope.
export function techfixerCardFeatures(pkg) {
  if (!techfixerHasContent(pkg?.name)) return pkg.features || "";
  return (pkg.features || "").split("\n").filter(line => !repairFeatures.includes(line))
    .map(line => line.startsWith("كل مميزات") ? "كل مميزات الباقة الأساسية" : line).join("\n");
}
export function techfixerPendingPackage(pkg) {
  if (!isTechfixer(pkg?.name)) return pkg;
  return {
    ...pkg,
    name: `${techfixerHasContent(pkg.name) ? "الباقة الاحترافية" : "الباقة الأساسية"}|تيك فيكسر — TechFixer`,
    features: (pkg.features || "").replace("الدومين اختياري وتكلفة تسجيله وتجديده منفصلة حسب النطاق المختار", "الدومين اختياري وتكلفة تسجيله وتجديده على صاحب المدونة"),
  };
}
