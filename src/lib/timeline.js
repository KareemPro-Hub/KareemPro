// ══════════════════ Project process timeline ══════════════════
// Single source of truth for both the admin's detailed view and the client's
// simplified view. `projects.timeline_step` stores a step KEY (text), not a
// number — packages with a mobile app have extra, more granular steps that
// packages without one don't, so a fixed step count doesn't fit every tier.

function packageTier(packageName) {
  const name = (packageName || "").split("|")[0].trim();
  if (name.includes("الاحترافية")) return "professional";
  if (name.includes("المتميزة")) return "premium";
  return "economic"; // no mobile app in this tier
}

// Per-tier wording for the one step whose description depends on the kind of
// app being built (WebView vs Native) — everything else is tier-agnostic.
const APP_START_BY_TIER = {
  premium: {
    title: "بدء تطوير التطبيق",
    desc: "بدء العمل على تطبيق الجوال بنظام WebView.",
  },
  professional: {
    title: "بدء تطوير التطبيق",
    desc: "بدء العمل على تطبيق الجوال الأصلي (Native).",
  },
};

// Every possible step, in order.
// - `tiers`: restricts a step to specific package tiers (omit = all tiers).
// - `clientGroup`: several admin-only steps can collapse into one row on the
//   client's simplified view. Steps without it are their own row 1:1.
const STEPS = [
  {
    key: "contract_payment",
    title: "العقد والدفعة الأولى",
    desc: "توقيع العقد + تأكيد استلام الدفعة الأولى.",
    clientTitle: "تم بدء المشروع",
    clientDesc: "تم توقيع العقد واستلام الدفعة الأولى.",
  },
  {
    key: "data_collection",
    title: "جمع بيانات المشروع",
    desc: "إرسال نموذج البيانات وانتظار استكمال المطلوب من العميل.",
    clientTitle: "استكمال البيانات",
    clientDesc: "في انتظار بيانات المشروع المطلوبة.",
  },
  {
    key: "requirements_review",
    title: "مراجعة المتطلبات",
    desc: "مراجعة البيانات وتحديد نطاق التنفيذ حسب الباقة.",
    clientTitle: "مراجعة المتطلبات",
    clientDesc: "جاري مراجعة البيانات وتجهيز خطة التنفيذ.",
  },
  {
    key: "identity_structure",
    title: "تجهيز الهوية والهيكل",
    desc: "إعداد الشكل العام، الصفحات الأساسية، وهيكل المنصة.",
    clientGroup: "platform_build",
  },
  {
    key: "platform_build",
    title: "تنفيذ المنصة",
    desc: "بناء المنصة وتنفيذ الخصائص الأساسية المتفق عليها.",
    clientGroup: "platform_build",
  },
  {
    key: "integrations",
    title: "الربط والإعدادات",
    desc: "ربط الدومين، بوابة الدفع، الإيميلات، والخدمات اللازمة.",
    clientGroup: "platform_build",
  },
  // ── App-only sub-stages (packages with a mobile app only) ──
  {
    key: "app_start",
    tiers: ["premium", "professional"],
    title: "بدء تطوير التطبيق",
    desc: "بدء العمل على تطبيق الجوال.",
  },
  {
    key: "app_beta",
    tiers: ["premium", "professional"],
    title: "تجهيز النسخة الأولية للتطبيق",
    desc: "تجهيز نسخة أولية (Beta) من التطبيق للمراجعة الداخلية.",
  },
  {
    key: "app_review",
    tiers: ["premium", "professional"],
    title: "مراجعة التطبيق والموافقة عليه",
    desc: "مراجعة التطبيق والتأكد من مطابقته للمتفق عليه، وعرضه على العميل لأخذ موافقته.",
  },
  {
    key: "app_approved",
    tiers: ["premium", "professional"],
    title: "اعتماد التطبيق",
    desc: "اعتماد النسخة النهائية للتطبيق تمهيدًا لنشره على المتجرين.",
  },
  {
    key: "initial_preview",
    title: "المعاينة الأولية",
    desc: "إرسال نسخة أولية للعميل لمراجعة الشكل العام وتجربة المنصة.",
    clientTitle: "المعاينة الأولية",
    clientDesc: "تم تجهيز نسخة أولية من المشروع للمراجعة.",
  },
  {
    key: "testing_launch",
    title: "الاختبار والنشر",
    desc: "اختبار المنصة والتطبيق وتجهيز النشر أو التسليم النهائي.",
    clientTitle: "الاختبار النهائي",
    clientDesc: "جاري اختبار المنصة والتأكد من جاهزيتها.",
  },
  {
    key: "delivery_support",
    title: "التسليم والدعم",
    desc: "تسليم المشروع وتفعيل فترة الدعم الفني.",
    clientTitle: "التسليم والدعم الفني",
    clientDesc: "تم تسليم المشروع وبدء فترة الدعم الفني.",
  },
];

function resolveStep(step, tier) {
  if (step.key === "app_start" && APP_START_BY_TIER[tier]) {
    return { ...step, ...APP_START_BY_TIER[tier] };
  }
  return step;
}

// Full breakdown for the admin, adapted to the project's package.
export function getAdminTimeline(packageName) {
  const tier = packageTier(packageName);
  return STEPS.filter((s) => !s.tiers || s.tiers.includes(tier)).map((s) => resolveStep(s, tier));
}

// Simplified breakdown for the client: every step is its own row unless it
// has a `clientGroup`, in which case consecutive same-group steps collapse
// into a single row. Each row carries `memberKeys` — the admin step keys it
// represents — so we can map the admin's current key back to a client row.
export function getClientTimeline(packageName) {
  const tier = packageTier(packageName);
  const steps = STEPS.filter((s) => !s.tiers || s.tiers.includes(tier)).map((s) => resolveStep(s, tier));

  const rows = [];
  for (const step of steps) {
    const groupKey = step.clientGroup || step.key;
    const existing = rows.find((r) => r.key === groupKey);
    if (existing) {
      existing.memberKeys.push(step.key);
      continue;
    }
    rows.push({
      key: groupKey,
      title: step.clientTitle || (groupKey === "platform_build" ? "جاري تنفيذ المنصة" : step.title),
      desc:
        step.clientDesc ||
        (groupKey === "platform_build"
          ? "بدأ العمل على تجهيز المنصة حسب الباقة المختارة."
          : step.desc),
      memberKeys: [step.key],
    });
  }
  return rows;
}

// Maps the admin's current step key to the client row that represents it.
export function adminKeyToClientKey(packageName, adminKey) {
  const rows = getClientTimeline(packageName);
  const row = rows.find((r) => r.memberKeys.includes(adminKey));
  return row ? row.key : rows[0]?.key;
}
