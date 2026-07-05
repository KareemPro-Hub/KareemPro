// ══════════════════ Project process timeline ══════════════════
// Tracks WHERE a project stands in production — separate from the payment
// "stages" table (which tracks money milestones). One integer column,
// projects.timeline_step (1-10), drives both views below:
//   - Admin sees the full breakdown (adapted to the project's package) and can advance it.
//   - Client sees a simplified 7-step version, mapped from the same value.

function packageTier(packageName) {
  const name = (packageName || "").split("|")[0].trim();
  if (name.includes("الاحترافية")) return "professional";
  if (name.includes("المتميزة")) return "premium";
  return "economic"; // no mobile app in this tier
}

const BASE_ADMIN_TIMELINE = [
  { step: 1, title: "العقد والدفعة الأولى", desc: "توقيع العقد + تأكيد استلام الدفعة الأولى." },
  { step: 2, title: "جمع بيانات المشروع", desc: "إرسال نموذج البيانات وانتظار استكمال المطلوب من العميل." },
  { step: 3, title: "مراجعة المتطلبات", desc: "مراجعة البيانات وتحديد نطاق التنفيذ حسب الباقة." },
  { step: 4, title: "تجهيز الهوية والهيكل", desc: "إعداد الشكل العام، الصفحات الأساسية، وهيكل المنصة." },
  { step: 5, title: "تنفيذ المنصة", desc: "بناء المنصة وتنفيذ الخصائص الأساسية المتفق عليها." },
  { step: 6, title: "الربط والإعدادات", desc: "ربط الدومين، بوابة الدفع، الإيميلات، والخدمات اللازمة." },
  { step: 7, appOnly: true },
  { step: 8, title: "المعاينة الأولية", desc: "إرسال نسخة أولية للعميل لمراجعة الشكل العام وتجربة المنصة." },
  { step: 9, title: "الاختبار والنشر", desc: "اختبار المنصة والتطبيق وتجهيز النشر أو التسليم النهائي." },
  { step: 10, title: "التسليم والدعم", desc: "تسليم المشروع وتفعيل فترة الدعم الفني." },
];

// Step 7 only exists for packages that actually include a mobile app, and its
// wording is specific to the kind of app that package promises — never the
// generic "WebView أو Native" placeholder.
const APP_STEP_CONTENT = {
  premium: {
    step: 7,
    title: "تجهيز تطبيق الجوال",
    desc: "بناء تطبيق آيفون وأندرويد بنظام WebView وربطه بالمنصة، تمهيدًا للنشر على المتجرين.",
  },
  professional: {
    step: 7,
    title: "تطوير التطبيق الأصلي (Native)",
    desc: "بناء تطبيق آيفون وأندرويد أصليَّين (Native) بأعلى معايير الأداء والسلاسة.",
  },
};

// Full breakdown for the admin, adapted to the project's package: economic
// packages (no app) skip step 7 entirely instead of showing a vague line.
export function getAdminTimeline(packageName) {
  const tier = packageTier(packageName);
  const appStep = APP_STEP_CONTENT[tier];

  return BASE_ADMIN_TIMELINE.filter((item) => !item.appOnly || appStep).map((item) =>
    item.appOnly ? appStep : item
  );
}

export const CLIENT_TIMELINE = [
  { step: 1, title: "تم بدء المشروع", desc: "تم توقيع العقد واستلام الدفعة الأولى." },
  { step: 2, title: "استكمال البيانات", desc: "في انتظار بيانات المشروع المطلوبة." },
  { step: 3, title: "مراجعة المتطلبات", desc: "جاري مراجعة البيانات وتجهيز خطة التنفيذ." },
  { step: 4, title: "جاري التنفيذ", desc: "بدأ العمل على تجهيز المنصة حسب الباقة المختارة." },
  { step: 5, title: "المعاينة الأولية", desc: "تم تجهيز نسخة أولية من المشروع للمراجعة." },
  { step: 6, title: "الاختبار النهائي", desc: "جاري اختبار المنصة والتأكد من جاهزيتها." },
  { step: 7, title: "التسليم والدعم الفني", desc: "تم تسليم المشروع وبدء فترة الدعم الفني." },
];

// Admin step (1-10) → client step (1-7). Admin steps 4-7 (identity/build/
// connections/app) all collapse into the client's single "جاري التنفيذ".
const ADMIN_TO_CLIENT_STEP = [1, 2, 3, 4, 4, 4, 4, 5, 6, 7];

export function adminStepToClientStep(adminStep) {
  const clamped = Math.min(Math.max(Number(adminStep) || 1, 1), ADMIN_TO_CLIENT_STEP.length);
  return ADMIN_TO_CLIENT_STEP[clamped - 1];
}
