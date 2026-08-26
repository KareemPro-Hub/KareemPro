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
};

const STAGE_TITLES = ["الدفعة الأولى", "الدفعة الثانية", "الدفعة الثالثة", "الدفعة الرابعة"];

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
  const amounts = PACKAGE_STAGE_AMOUNTS[Number(price)];
  if (!amounts) return null;
  return amounts.map((amount, i) => ({
    title: STAGE_TITLES[i] || `الدفعة ${i + 1}`,
    description: descriptionFor(i, amounts.length),
    amount,
  }));
}
