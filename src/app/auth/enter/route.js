import { NextResponse } from "next/server";

// Step 1 of the platform login-link flow — a BOT SHIELD, not the verifier.
//
// Login links are single-use, and both WhatsApp and email clients prefetch
// URLs to render link previews. If this route verified the token directly
// on GET, the preview bot's fetch would consume it before the client ever
// tapped the link — leaving them a dead link and a login screen. So this
// route returns a tiny HTML page whose script immediately forwards the
// browser to /auth/enter/verify (the real verifier). Preview bots don't
// execute JavaScript, so the token survives until a real human arrives.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const t = searchParams.get("t");
  const next = searchParams.get("next") || "/portal";

  if (!t) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const target = `${origin}/auth/enter/verify?t=${encodeURIComponent(t)}&next=${encodeURIComponent(next)}`;

  return new NextResponse(
    // No robots "noindex" here on purpose: WhatsApp's link-preview crawler
    // skips pages that carry it, which killed the branded preview card. The
    // page is harmless to leave crawlable — every URL carries a unique
    // one-time token and is never linked from anywhere public.
    `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Kareem Pro — بوابة الدخول</title>` +
      // Rich link preview (the big branded card) when the login link is
      // shared over WhatsApp — mirrors the homepage's OG tags. Without
      // these, WhatsApp renders a bare one-line card for this page.
      `<meta property="og:title" content="من البداية حتى التسليم"/><meta property="og:description" content="مشروعك أمامك خطوة بخطوة"/><meta property="og:site_name" content="Kareem Pro"/><meta property="og:type" content="website"/><meta property="og:url" content="https://kareempro.com"/><meta property="og:locale" content="ar_SA"/><meta property="og:image" content="https://kareempro.com/og-portal.jpg"/><meta property="og:image:type" content="image/jpeg"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="Kareem Pro — إبداع بصري"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="من البداية حتى التسليم"/><meta name="twitter:description" content="مشروعك أمامك خطوة بخطوة"/><meta name="twitter:image" content="https://kareempro.com/og-portal.jpg"/></head><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1440;color:#ffffff;font-family:-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;"><div style="text-align:center;padding:24px;"><img src="${origin}/logo-transparent.png" width="52" height="58" alt="Kareem Pro" style="margin-bottom:14px;"/><div style="font-size:17px;font-weight:700;margin-bottom:6px;">جارِ تسجيل دخولك...</div><div style="font-size:13px;color:#a9adcf;">لحظة واحدة وهتكون داخل لوحة التحكم</div></div><script>location.replace(${JSON.stringify(target)});</script></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}
