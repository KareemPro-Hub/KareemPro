// Generates the branded "إيصال استلام دفعة" PDF that gets attached to a
// project's files the moment an admin confirms a stage as paid (see
// advanceStage in admin/actions.js). Rendered via a real headless Chromium
// so the Arabic RTL text, the site's own FrutigerArabic font, and the
// gradient/brand styling come out pixel-identical to the rest of the app —
// a plain PDF library (pdf-lib/pdfkit) can't shape Arabic text properly.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kareempro.com";

function receiptHtml({ receiptNumber, dateLabel, dateValue, clientName, projectTitle, stageTitle, amount, remaining }) {
  const amountValue = Number(amount).toLocaleString("en-US");
  const remainingValue = Number(remaining).toLocaleString("en-US");
  const riyal = `${SITE_URL}/riyal-symbol-black.png`;
  const logo = `${SITE_URL}/logo-transparent.png`;
  const fontRoman = `${SITE_URL}/FrutigerLTArabic55Roman.ttf`;
  const fontBold = `${SITE_URL}/FrutigerLTArabic65Bold.ttf`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<style>
  @font-face { font-family: 'FrutigerArabic'; src: url('${fontRoman}'); font-weight: 400; }
  @font-face { font-family: 'FrutigerArabic'; src: url('${fontBold}'); font-weight: 700; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'FrutigerArabic', sans-serif; background: #fbf9f6; color: #2a2a35; direction: rtl; }
  .sheet { width: 100%; min-height: 100vh; position: relative; }
  .topbar { height: 10px; width: 100%; background: linear-gradient(90deg, #ffa826, #ff5535, #d9187a); }
  .header { padding: 40px 56px 24px 56px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee0d2; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { width: 40px; height: 45px; }
  .brand-text { font-size: 15px; font-weight: 700; letter-spacing: 1px; color: #2a2a35; direction: ltr; }
  .brand-text span { color: #ff5535; }
  .doc-meta { text-align: left; direction: ltr; font-size: 12px; color: #9a8f80; line-height: 1.8; }
  .doc-meta b { color: #2a2a35; font-size: 13px; }
  .title-block { text-align: center; padding: 34px 56px 8px 56px; }
  .title-block h1 { font-size: 24px; font-weight: 700; margin: 0 0 6px 0; color: #1e2a3a; }
  .title-block p { margin: 0; font-size: 14px; color: #7a6a5a; }
  .info-row { display: flex; justify-content: center; gap: 60px; padding: 24px 56px 0 56px; }
  .info-item { text-align: center; }
  .info-item .label { font-size: 12px; color: #9a8f80; margin-bottom: 4px; }
  .info-item .value { font-size: 15px; font-weight: 700; color: #2a2a35; }
  .amount-card { margin: 32px 56px 0 56px; background: linear-gradient(135deg, #fffaf4, #fdeee0 60%, #fbe0c6); border: 1.5px solid rgba(255,140,40,.35); border-radius: 20px; padding: 28px; text-align: center; }
  .amount-card .label { font-size: 13px; color: #9a6a3a; font-weight: 700; margin-bottom: 8px; }
  .amount-card .value { font-size: 42px; font-weight: 700; color: #1e2a3a; direction: ltr; display: inline-flex; align-items: center; gap: 8px; }
  .amount-card .riyal { width: 26px; height: 30px; }
  .riyal-inline { width: 15px; height: 17px; vertical-align: -2px; margin: 0 2px; }
  .details-table { margin: 28px 56px 0 56px; border: 1px solid #eee0d2; border-radius: 14px; overflow: hidden; }
  .details-table .row { display: flex; justify-content: space-between; padding: 16px 22px; font-size: 14px; }
  .details-table .row:not(:last-child) { border-bottom: 1px solid #f2e9dc; }
  .details-table .row .k { color: #7a6a5a; }
  .details-table .row .v { font-weight: 700; color: #2a2a35; direction: ltr; }
  .details-table .row.remaining .v { color: #c1590a; }
  /* Forces the day/month/year digit-and-slash sequence to render starting
     from the right edge (day first) instead of the browser's default bidi
     reordering of numeric runs inside an RTL page. */
  .date-rtl { direction: rtl; unicode-bidi: bidi-override; }
  .footer { margin-top: 44px; padding: 24px 56px 40px 56px; text-align: center; }
  .footer p { font-size: 13px; color: #9a8f80; line-height: 1.9; margin: 0 0 14px 0; }
  .footer .tag { font-size: 11px; color: #b8ad9e; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="topbar"></div>
    <div class="header">
      <div class="brand">
        <img src="${logo}" />
        <div class="brand-text">KAREEM <span>PRO</span></div>
      </div>
      <div class="doc-meta">
        <div><b>إيصال رقم</b> ${receiptNumber}</div>
        <div>${dateLabel}</div>
      </div>
    </div>

    <div class="title-block">
      <h1>إيصال استلام دفعة</h1>
      <p>مشروعك يتقدم خطوة جديدة نحو الاكتمال</p>
    </div>

    <div class="info-row">
      <div class="info-item">
        <div class="label">صاحب المشروع</div>
        <div class="value">${clientName}</div>
      </div>
      <div class="info-item">
        <div class="label">المشروع</div>
        <div class="value">${projectTitle}</div>
      </div>
    </div>

    <div class="amount-card">
      <div class="label">المبلغ المستلَم — ${stageTitle}</div>
      <div class="value">${amountValue} <img class="riyal" src="${riyal}" /></div>
    </div>

    <div class="details-table">
      <div class="row">
        <div class="k">تاريخ السداد</div>
        <div class="v date-rtl">${dateValue}</div>
      </div>
      <div class="row">
        <div class="k">المرحلة</div>
        <div class="v" style="direction:rtl">${stageTitle}</div>
      </div>
      <div class="row remaining">
        <div class="k">المتبقي من قيمة المشروع</div>
        <div class="v">${remainingValue} <img class="riyal-inline" src="${riyal}" /></div>
      </div>
    </div>

    <div class="footer">
      <p>شكرًا لثقتك بنا، ونتطلع لإكمال رحلة مشروعك معك.</p>
      <div class="tag">Kareem Pro © جميع الحقوق محفوظة</div>
    </div>
  </div>
</body>
</html>`;
}

// Renders the receipt to a PDF Buffer using headless Chromium
// (@sparticuz/chromium ships the binary Vercel's Node runtime can execute;
// puppeteer-core drives it — the full "puppeteer" package isn't used since
// it tries to download its own Chromium at install time, which doesn't work
// in a serverless build).
export async function generatePaymentReceiptPdf(data) {
  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = await import("puppeteer-core");

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(receiptHtml(data), { waitUntil: "networkidle0" });
    const pdfBytes = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}
