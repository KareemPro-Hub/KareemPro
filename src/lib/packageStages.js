// Standard payment-stage breakdown per package price — the exact numbers and
// wording Kareem quotes to clients. Shared by two places so they can never
// drift apart: the manual "new project" admin form (auto-fill on price
// blur) and the automatic stage creation that fires the moment a client
// accepts a proposal (see acceptProposal in portal/proposal-actions.js).
export const PACKAGE_STAGE_AMOUNTS = {
  7500: [1500, 2000, 2000, 2000],
  5500: [1500, 2000, 2000],
  2500: [1000, 1500],
  1500: [750, 750],
  // Blogger packages: three instalments, tied to the contract's own wording
  // (مقدم / بعد الصفحات الإلزامية / عند التسليم). Keep these in sync with
  // BLOGGER_PAYMENT_PLANS in portal/OnboardingFunnel.js and with the
  // "طريقة السداد" line inside each package's features in admin/actions.js.
  750: [250, 250, 250],
  1300: [450, 450, 400],
  // Article packages (كتابة ونشر المقالات): instalments are pinned to a
  // COUNT OF PUBLISHED ARTICLES, not to dates — see the contract's own
  // wording. Keep in sync with ARTICLES_PAYMENT_PLANS in
  // portal/OnboardingFunnel.js and the "طريقة السداد" line inside each
  // package's features in admin/actions.js.
  650: [350, 300],
  1100: [400, 350, 350],
  1750: [650, 550, 550],
  // Pharmacy (Urs) packages: 5 equal installments per the "طريقة السداد"
  // line already written into each package's features text.
  10000: [2000, 2000, 2000, 2000, 2000],
  15000: [3000, 3000, 3000, 3000, 3000],
  20000: [4000, 4000, 4000, 4000, 4000],
};

const STAGE_TITLES = ["الدفعة الأولى", "الدفعة الثانية", "الدفعة الثالثة", "الدفعة الرابعة", "الدفعة الخامسة"];

// Prices that use the pharmacy package's 5-payment plan get their own
// richer descriptions instead of the generic ones below — each payment is
// tied to a checkpoint across the pharmacy build's 8 internal production
// stages (analysis/design, roles & permissions, POS, inventory & branches,
// stock/expiry alerts, QR invoicing, purchasing/suppliers, admin dashboard
// & accounting + full testing and handover), grouped 1–2 / 2–5 / 6–7 / 8.
const PHARMACY_STAGE_PRICES = new Set([10000, 15000, 20000]);

// Blogger's three payments are pinned to real blog milestones rather than the
// generic "منتصف مرحلة التنفيذ" wording, so the stage list a client sees in
// their dashboard reads exactly like the contract they signed.
const BLOGGER_STAGE_PRICES = new Set([750, 1300]);
const BLOGGER_STAGE_DESCRIPTIONS = [
  "دفعة مقدّم عند توقيع العقد وبدء العمل على المشروع.",
  "بعد إعداد الصفحات الإلزامية (من نحن، سياسة الخصوصية، اتصل بنا).",
  "الدفعة الأخيرة عند تسليم المدونة وكتابة المقالات التأسيسية.",
];

// On the 1,300 tier our team writes and publishes all 50 articles, so the last
// payment falls due when that content is finished — not at blog handover. Only
// the third description changes; the first two are identical. Keep this price
// in sync with BLOGGER_FULL_CONTENT_PRICES in lib/timeline.js and
// portal/OnboardingFunnel.js.
const BLOGGER_FULL_CONTENT_PRICES = new Set([1300]);
const BLOGGER_FULL_CONTENT_DESCRIPTIONS = [
  BLOGGER_STAGE_DESCRIPTIONS[0],
  BLOGGER_STAGE_DESCRIPTIONS[1],
  "الدفعة الأخيرة عند اكتمال نشر المقالات الخمسين.",
];
// Article packages: each payment names the exact article number it falls due
// at, so the stage list in the client's dashboard reads word for word like
// the contract they signed. Keyed by price because the milestone numbers
// differ per package (15 / 20 & 40 / 35 & 70).
const ARTICLES_STAGE_DESCRIPTIONS = {
  650: [
    "دفعة مقدّم عند توقيع العقد وبدء العمل.",
    "الدفعة الأخيرة عند نشر المقال الخامس عشر.",
  ],
  1100: [
    "دفعة مقدّم عند توقيع العقد وبدء العمل.",
    "عند نشر المقال العشرين.",
    "الدفعة الأخيرة عند نشر المقال الأربعين.",
  ],
  1750: [
    "دفعة مقدّم عند توقيع العقد وبدء العمل.",
    "عند نشر المقال الخامس والثلاثين.",
    "الدفعة الأخيرة عند نشر المقال السبعين.",
  ],
};

const PHARMACY_STAGE_DESCRIPTIONS = [
  "دفعة مقدّم عند توقيع العقد وبدء العمل على المشروع.",
  "بعد الانتهاء من التحليل والتصميم وبناء صلاحيات المستخدمين والأدوار.",
  "بعد الانتهاء من نظام الكاشير وإدارة الأصناف والمخزون والفروع وتنبيهات النفاد وقرب انتهاء الصلاحية.",
  "بعد الانتهاء من الفواتير الإلكترونية QR وإدارة المشتريات والموردين والمرتجعات.",
  "الدفعة الأخيرة عند التسليم النهائي، بعد لوحة الإدارة الشاملة والمحاسبة واجتياز الاختبار الشامل.",
];

// First stage is always the contract/kickoff payment, last stage is always
// the final-delivery payment — everything in between is a progress payment.
function descriptionFor(index, total) {
  if (index === 0) return "توقيع العقد وبدء العمل على المشروع.";
  if (index === total - 1) return "الدفعة الأخيرة عند التسليم النهائي.";
  if (total === 4 && index === 1) return "دفعة منتصف المرحلة الأولى من التنفيذ.";
  if (total === 4 && index === 2) return "دفعة مرحلة التنفيذ المتقدمة.";
  return "دفعة منتصف مرحلة التنفيذ.";
}

// Returns [{ title, description, amount }] for a known package price, or
// null if the price doesn't match one of the standard packages (in which
// case the admin defines stages manually, same as always).
export function buildStagesForPackagePrice(price) {
  const numericPrice = Number(price);
  const amounts = PACKAGE_STAGE_AMOUNTS[numericPrice];
  if (!amounts) return null;
  const descriptions = ARTICLES_STAGE_DESCRIPTIONS[numericPrice]
    ? ARTICLES_STAGE_DESCRIPTIONS[numericPrice]
    : PHARMACY_STAGE_PRICES.has(numericPrice)
    ? PHARMACY_STAGE_DESCRIPTIONS
    : BLOGGER_FULL_CONTENT_PRICES.has(numericPrice)
      ? BLOGGER_FULL_CONTENT_DESCRIPTIONS
      : BLOGGER_STAGE_PRICES.has(numericPrice)
        ? BLOGGER_STAGE_DESCRIPTIONS
        : null;
  return amounts.map((amount, i) => ({
    title: STAGE_TITLES[i] || `الدفعة ${i + 1}`,
    description: descriptions ? descriptions[i] : descriptionFor(i, amounts.length),
    amount,
  }));
}
