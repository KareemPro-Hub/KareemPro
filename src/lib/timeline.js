// ══════════════════ Project process timeline ══════════════════
// Single source of truth for both the admin's detailed view and the client's
// simplified view. `projects.timeline_step` stores a step KEY (text), not a
// number — packages with a mobile app have extra steps that packages without
// one don't, so a fixed step count doesn't fit every tier.

function packageTier(packageName) {
  const name = (packageName || "").split("|")[0].trim();
  if (name.includes("الاحترافية")) return "professional";
  if (name.includes("المتميزة")) return "premium";
  return "economic"; // no mobile app in this tier
}

// Every possible step, in order (admin's 10-step process).
// - `tiers`: restricts a step to specific package tiers (omit = all tiers).
// - `clientGroup`: several admin-only steps can collapse into one row on the
//   client's simplified view. Steps without it are their own row 1:1.
const STEPS = [
  {
    key: "contract_payment",
    title: "العقد والدفعة الأولى",
    desc: "توقيع العقد وتأكيد استلام الدفعة الأولى.",
    clientTitle: "تم بدء المشروع",
    clientDesc: "تم توقيع العقد واستلام الدفعة الأولى.",
  },
  {
    key: "data_collection",
    title: "جمع بيانات المشروع",
    desc: "إرسال نموذج البيانات المطلوبة، واستلام البيانات اللازمة من العميل.",
    clientTitle: "استكمال البيانات",
    clientDesc: "في انتظار بيانات المشروع المطلوبة.",
  },
  {
    key: "requirements_review",
    title: "مراجعة المتطلبات",
    desc: "مراجعة البيانات وتحديد نطاق التنفيذ حسب الباقة المختارة.",
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
    key: "platform_execution",
    title: "تنفيذ المنصة",
    desc: "بناء المنصة وتنفيذ الخصائص الأساسية المتفق عليها.",
    clientGroup: "platform_build",
  },
  {
    key: "integrations_setup",
    title: "الربط والإعدادات",
    desc: "ربط الدومين، بوابة الدفع، الإيميلات، والخدمات اللازمة.",
    clientGroup: "platform_build",
  },
  {
    key: "initial_preview_approval",
    title: "المعاينة الأولية والاعتماد",
    desc: "تجهيز نسخة أولية من المنصة واعتماد الشكل العام قبل النشر.",
    clientTitle: "المعاينة الأولية والاعتماد",
    clientDesc: "تم تجهيز نسخة أولية من المشروع لمراجعة الشكل العام واعتماده.",
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
    clientTitle: "التسليم والدعم الفني",
    clientDesc: "تم تسليم المشروع وبدء فترة الدعم الفني.",
  },
];

// Full breakdown for the admin, adapted to the project's package.
export function getAdminTimeline(packageName) {
  const tier = packageTier(packageName);
  return STEPS.filter((s) => !s.tiers || s.tiers.includes(tier));
}

// Simplified breakdown for the client: every step is its own row unless it
// has a `clientGroup`, in which case consecutive same-group steps collapse
// into a single row. Each row carries `memberKeys` — the admin step keys it
// represents — so we can map the admin's current key back to a client row.
export function getClientTimeline(packageName) {
  const steps = getAdminTimeline(packageName);

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
