// ══════════════════ WhatsApp message helpers ══════════════════
// All client communication happens over WhatsApp (Kareem's clients come from
// ads straight into his WhatsApp — many never open email). Nothing here sends
// anything by itself: every function just builds a wa.me URL that opens the
// client's chat with the message pre-typed, and Kareem himself presses Send.
// Emails keep firing automatically in the background as the backup channel.
//
// Pure functions only — safe to import from client components.

// Normalizes a phone number into wa.me's international digits-only format.
// Handles the common ways a number gets typed in the admin form:
//   "+966 50 706 9605" → "966507069605"
//   "0507069605"       → "966507069605"  (Saudi mobile, leading 0)
//   "01012345678"      → "201012345678"  (Egyptian mobile, 11 digits)
//   "00966507069605"   → "966507069605"  (international 00 prefix)
export function normalizeWhatsAppPhone(phone) {
  if (!phone) return null;
  let digits = phone.toString().replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("05") && digits.length === 10) digits = "966" + digits.slice(1);
  else if (digits.startsWith("01") && digits.length === 11) digits = "2" + digits;
  else if (digits.startsWith("0")) digits = "966" + digits.slice(1);
  return digits;
}

// Country dial codes for the WhatsApp-number fields (new client + edit
// client). Saudi first (most clients), then the rest of the region.
export const DIAL_CODES = [
  { code: "966", label: "🇸🇦 السعودية +966" },
  { code: "20", label: "🇪🇬 مصر +20" },
  { code: "971", label: "🇦🇪 الإمارات +971" },
  { code: "965", label: "🇰🇼 الكويت +965" },
  { code: "974", label: "🇶🇦 قطر +974" },
  { code: "973", label: "🇧🇭 البحرين +973" },
  { code: "968", label: "🇴🇲 عُمان +968" },
  { code: "962", label: "🇯🇴 الأردن +962" },
  { code: "964", label: "🇮🇶 العراق +964" },
  { code: "218", label: "🇱🇾 ليبيا +218" },
  { code: "213", label: "🇩🇿 الجزائر +213" },
  { code: "212", label: "🇲🇦 المغرب +212" },
  { code: "216", label: "🇹🇳 تونس +216" },
  { code: "249", label: "🇸🇩 السودان +249" },
  { code: "967", label: "🇾🇪 اليمن +967" },
  { code: "961", label: "🇱🇧 لبنان +961" },
  { code: "970", label: "🇵🇸 فلسطين +970" },
  { code: "963", label: "🇸🇾 سوريا +963" },
  { code: "1", label: "🇺🇸 أمريكا/كندا +1" },
  { code: "44", label: "🇬🇧 بريطانيا +44" },
];

// Splits a stored number back into { dial, local } so the edit form can
// preselect the right country. Longest dial code wins (e.g. "1" vs "20").
export function splitDialCode(phone) {
  const digits = (phone || "").toString().replace(/\D/g, "");
  if (!digits) return { dial: "966", local: "" };
  const match = [...DIAL_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((d) => digits.startsWith(d.code));
  return match
    ? { dial: match.code, local: digits.slice(match.code.length) }
    : { dial: "966", local: digits };
}

export function buildWhatsAppUrl(phone, text) {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

// Opens the client's WhatsApp chat with the message pre-typed, and copies
// the same message to the clipboard as a safety net.
//
// Why not a plain wa.me link everywhere: on desktop, wa.me hands the text to
// the installed WhatsApp app, whose macOS build mangles emoji into "?" —
// WhatsApp Web renders them correctly, so desktop goes straight to
// web.whatsapp.com. Mobile keeps wa.me (it opens the native app properly).
// Returns true when the clipboard copy also succeeded.
export async function openWhatsApp(phone, text) {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return false;

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

  const url = isMobile
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://web.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(text)}`;

  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch {
    // Clipboard permissions vary — the prefilled text is the primary path.
  }

  window.open(url, "_blank", "noopener,noreferrer");
  return copied;
}

const PORTAL_URL = "https://kareempro.com/portal";

// ── The four approved message templates (see the WhatsApp design mockups
// Kareem signed off on). *asterisks* render as bold inside WhatsApp. ──

export function welcomeMessage({ clientName, loginUrl }) {
  return (
    `أهلًا بك أ. ${clientName} 🤝\n\n` +
    `يسعدنا انضمامك إلى *Kareem Pro*.\n` +
    `لوحة التحكم الخاصة بمشروعك أصبحت جاهزة، ومنها تتابع كل شيء لحظة بلحظة:\n\n` +
    `📋 العرض الفني والمالي\n` +
    `🛠️ مراحل تنفيذ المشروع\n` +
    `💳 الدفعات والإيصالات\n` +
    `📁 الملفات والتسليمات\n\n` +
    `اضغط الرابط وستدخل مباشرة — *بدون اسم مستخدم أو كلمة سر* 🚀\n` +
    loginUrl
  );
}

export function paymentRequestMessage({ clientName, stageTitle, amount, loginUrl }) {
  const amountValue = Number(amount).toLocaleString("en-US");
  return (
    `أ. ${clientName}، مشروعك جاهز لينطلق للمحطة القادمة 🚀\n\n` +
    `حان موعد *"${stageTitle}"* لتفعيل المرحلة ومباشرة العمل فورًا:\n\n` +
    `💰 المبلغ المستحق: *${amountValue} ريال*\n\n` +
    `🏦 التحويل يكون عبر وسيلة الدفع المناسبة اللي تم إرسالها على الواتساب.\n\n` +
    `بعد التحويل، فضلاً زودنا بصورة الإيصال عبر الواتساب لننطلق مباشرة 🚀\n` +
    (loginUrl || PORTAL_URL)
  );
}

// ── Overdue first-payment reminder ──────────────────────────────────────
// Deliberately NOT a variant of paymentRequestMessage above: that one is
// upbeat ("مشروعك جاهز لينطلق 🚀") and fits a stage that has just been
// opened for payment. This one is for a stage that has been sitting in
// "awaiting_payment" long enough that the project is effectively on hold —
// so the voice is calm, formal and corporate, the pause is framed as a
// standing policy rather than a personal decision, and the only real
// pressure in the message is the dated reservation deadline at the end.
//
// The deadline defaults to RESERVATION_DAYS days from the moment the button
// is pressed; nothing is ever sent automatically, so Kareem can still edit
// the date (or drop the preview-link line for a project that has no
// preview) inside WhatsApp before pressing Send.
const RESERVATION_DAYS = 7;

function reservationDeadline(days = RESERVATION_DAYS) {
  // "-u-nu-latn": Arabic month/weekday names but Latin digits, so the date
  // matches the "2,000 ريال" figure in the same message instead of mixing
  // ٢٠٢٦-style Arabic-Indic numerals into it.
  return new Date(Date.now() + days * 86400000).toLocaleDateString("ar-EG-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function overduePaymentMessage({
  clientName,
  projectTitle,
  stageTitle,
  amount,
  deadline,
  loginUrl,
}) {
  const amountValue = Number(amount).toLocaleString("en-US");
  const deadlineText = deadline || reservationDeadline();
  return (
    `أ. ${clientName}، تحية طيبة\n\n` +
    `مشروع *${projectTitle}* لا يزال موقوفًا لحين استلام *${stageTitle}* وفق العقد الموقّع.\n\n` +
    `وقد تم إيقاف رابط المعاينة تلقائيًا، وهو إجراء يسري على أي مشروع لم تُفعَّل مرحلته الأولى. العمل المنجز محفوظ بالكامل ✅\n\n` +
    `💰 المستحق للتفعيل: *${amountValue} ريال*\n\n` +
    `وإن كان لديكم أي عائق، أخبرونا بصراحة لنتصرف على أساسه.\n\n` +
    `📌 المشروع محجوز في جدول التنفيذ حتى *${deadlineText}*، وبعدها يُخلى الموعد، ويُعاد جدولته لمشروع آخر حسب المتاح.\n\n` +
    (loginUrl || PORTAL_URL)
  );
}

export function paymentConfirmedMessage({ clientName, stageTitle, amount, loginUrl }) {
  const amountValue = Number(amount).toLocaleString("en-US");
  return (
    `تم تأكيد استلام *"${stageTitle}"* بنجاح ✅\n\n` +
    `شكرًا لثقتك أ. ${clientName} ❤️\n\n` +
    `💰 المبلغ المستلَم: *${amountValue} ريال*\n\n` +
    `🧾 إيصال الاستلام الرسمي (PDF) أصبح جاهزًا في قسم "الملفات والتسليمات" بلوحة تحكمك 👇\n` +
    (loginUrl || PORTAL_URL)
  );
}

// Mirrors the new-file email word for word (same heading, same body, same
// closing line) so the client gets one consistent message on both channels.
export function newFileMessage({ projectTitle, fileName, typeLabel, typeIcon, loginUrl }) {
  return (
    `وصلك ملف جديد 📁\n\n` +
    `أضفنا ملفًا جديدًا لمشروعك *"${projectTitle}"* في قسم "الملفات والتسليمات".\n\n` +
    `📁 اسم الملف: *${fileName}*\n` +
    `${typeIcon} النوع: *${typeLabel}*\n\n` +
    `تقدر تستعرض الملف وتحمّله في أي وقت من لوحة التحكم الخاصة بك 👇\n` +
    (loginUrl || PORTAL_URL)
  );
}

export function discountMessage({ clientName, oldPrice, newPrice, discountAmount, loginUrl }) {
  const fmt = (v) => Number(v).toLocaleString("en-US");
  return (
    `خبر سعيد يا أ. ${clientName} 🎉\n\n` +
    `لأنك شريك نجاح لا مجرد عميلٍ عابر، أهديناك خصمًا تستحقه على قيمة مشروعك.\n\n` +
    `💰 القيمة قبل الخصم: ~${fmt(oldPrice)} ريال~\n` +
    `✅ القيمة بعد الخصم: *${fmt(newPrice)} ريال*\n` +
    `🎁 قيمة الخصم: *${fmt(discountAmount)} ريال*\n\n` +
    `تم تحديث دفعات السداد تلقائيًا في لوحة تحكمك 👇\n\n` +
    `نتمنى لك تجربة رائعة معنا، ونشكرك على ثقتك ❤️\n` +
    (loginUrl || PORTAL_URL)
  );
}

export function progressMessage({ stepTitle, stepDesc, loginUrl }) {
  const descLine = stepDesc ? `⚙️ ${stepDesc}\n\n` : "";
  return (
    `مشروعك يتقدّم 🚀\n\n` +
    `دخلنا رسميًا مرحلة *"${stepTitle}"*:\n\n` +
    descLine +
    `تقدر تتابع كل خطوة لحظة بلحظة من لوحة التحكم 👇\n` +
    (loginUrl || PORTAL_URL)
  );
}

// ── ما يُعرض تحت اسم صاحب المشروع في لوحة الإدارة ──
// حسابات العملاء الجدد تُنشأ بإيميل داخلي مولّد من رقم الواتساب
// (…@no-mail.kareempro.com) لأن Supabase لا يقبل حسابًا بلا إيميل — وهو
// معرّف داخلي لا يُرسل عليه شيء، فلا معنى لعرضه. نعرض رقم الواتساب بدلًا
// منه، ونُبقي الإيميل الحقيقي ظاهرًا للعملاء القدامى الذين لديهم واحد.
const INTERNAL_EMAIL_DOMAIN = "@no-mail.kareempro.com";

export function isInternalEmail(email) {
  return (email || "").toLowerCase().endsWith(INTERNAL_EMAIL_DOMAIN);
}

export function contactLine(client) {
  if (!client) return "";
  if (client.email && !isInternalEmail(client.email)) return client.email;
  const digits = normalizeWhatsAppPhone(client.phone);
  return digits ? `+${digits}` : "";
}
