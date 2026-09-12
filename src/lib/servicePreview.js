// ══════════════════ Link-preview copy per service line ══════════════════
// The login link shared over WhatsApp renders a branded preview card (see
// app/auth/enter/route.js). Its two text lines used to be one generic pair
// for every client — "من البداية حتى التسليم / مشروعك أمامك خطوة بخطوة" —
// which said nothing about what the client is actually buying. These lines
// speak to the specific service instead, so the card sells the thing in the
// message rather than the company in general.
//
// Written without tanween on purpose, to match the package cards.

// Mirrors detectServiceType() in app/portal/OnboardingFunnel.js — same
// keywords, same order, same fallback. Kept as its own copy here because
// that one lives inside a "use client" component and importing it into a
// server route would pull React along with it. If a service keyword ever
// changes, change it in BOTH places.
export function detectServiceType(text) {
  const t = text || "";
  if (/بلوجر|blogger/i.test(t)) return "blogger";
  if (/مقال/.test(t)) return "articles";
  if (/صيدلي|Urs/i.test(t)) return "pharmacy";
  if (/تعليق صوتي/i.test(t)) return "voiceover";
  if (/فيديو/i.test(t)) return "video";
  if (/تطبيق/i.test(t)) return "platform-apps";
  return "platform";
}

// The generic pair stays the fallback: it's what every client got before, so
// an unknown service (or a failed lookup) is never worse than it was.
export const DEFAULT_PREVIEW = {
  title: "من البداية حتى التسليم",
  description: "مشروعك أمامك خطوة بخطوة",
};

const PREVIEW_BY_SERVICE = {
  articles: {
    title: "مقالات تصنع الفرق",
    description: "محتوى احترافي يرفع مدونتك ويؤهلها للربح",
  },
  blogger: {
    title: "مدونة ربحية جاهزة لأدسنس",
    description: "من الإنشاء حتى أول دخل حقيقي",
  },
  pharmacy: {
    title: "أدر صيدلياتك بذكاء",
    description: "تحكم كامل في المخزون والمبيعات من مكان واحد",
  },
  "platform-apps": {
    title: "منصة وتطبيقات باسمك",
    description: "حضور رقمي كامل على الويب والجوال",
  },
  platform: {
    title: "منصتك الرقمية تبدأ هنا",
    description: "بناء احترافي من الفكرة حتى الإطلاق",
  },
  video: {
    title: "فيديو يوقف التمرير",
    description: "إنتاج سينمائي يحكي قصة علامتك",
  },
  voiceover: {
    title: "صوت يترك أثر",
    description: "تعليق صوتي إبداعي يرفع قيمة عملك",
  },
};

export function previewCopyFor(text) {
  return PREVIEW_BY_SERVICE[detectServiceType(text)] || DEFAULT_PREVIEW;
}
