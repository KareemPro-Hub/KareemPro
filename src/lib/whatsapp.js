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

export function buildWhatsAppUrl(phone, text) {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const PORTAL_URL = "https://kareempro.com/portal";

// ── The four approved message templates (see the WhatsApp design mockups
// Kareem signed off on). *asterisks* render as bold inside WhatsApp. ──

export function welcomeMessage({ clientName, loginUrl }) {
  return (
    `أهلاً بك أ. ${clientName} 🤝\n\n` +
    `يسعدنا انضمامك إلى *Kareem Pro*! لوحة التحكم الخاصة بمشروعك أصبحت جاهزة، ومنها تتابع كل شيء لحظة بلحظة:\n\n` +
    `✨ العرض الفني والمالي\n` +
    `🛠️ مراحل تنفيذ المشروع\n` +
    `💳 الدفعات والإيصالات\n` +
    `📁 الملفات والتسليمات\n\n` +
    `اضغط الرابط وستدخل مباشرة — *بدون اسم مستخدم أو كلمة سر* 🚀\n` +
    loginUrl
  );
}

export function paymentRequestMessage({ clientName, stageTitle, amount }) {
  const amountValue = Number(amount).toLocaleString("en-US");
  return (
    `أ. ${clientName}، مشروعك جاهز لينطلق للمحطة القادمة 🚀\n\n` +
    `حان موعد *"${stageTitle}"* لتفعيل المرحلة ومباشرة العمل فورًا:\n\n` +
    `💰 المبلغ المستحق: *${amountValue} ريال*\n\n` +
    `🏦 التحويل دولي من الراجحي إلى بنك مصر — ملف بيانات المستفيد بالخطوات موجود في لوحة التحكم وعلى إيميلك.\n\n` +
    `بعد التحويل، ابعت لنا صورة الإيصال هنا وننطلق مباشرة 🤝\n` +
    PORTAL_URL
  );
}

export function paymentConfirmedMessage({ clientName, stageTitle, amount }) {
  const amountValue = Number(amount).toLocaleString("en-US");
  return (
    `تم تأكيد استلام *"${stageTitle}"* بنجاح ✅\n\n` +
    `شكرًا لثقتك أ. ${clientName} ❤️\n\n` +
    `💰 المبلغ المستلَم: *${amountValue} ريال*\n\n` +
    `🧾 إيصال الاستلام الرسمي (PDF) أصبح جاهزًا في قسم "الملفات والتسليمات" بلوحة تحكمك 👇\n` +
    PORTAL_URL
  );
}

export function progressMessage({ stepTitle, stepDesc }) {
  const descLine = stepDesc ? `⚙️ ${stepDesc}\n\n` : "";
  return (
    `مشروعك يتقدّم 🚀\n\n` +
    `دخلنا رسميًا مرحلة *"${stepTitle}"*:\n\n` +
    descLine +
    `تقدر تتابع كل خطوة لحظة بلحظة من لوحة التحكم 👇\n` +
    PORTAL_URL
  );
}
