import { NextResponse } from "next/server";

// Step 1 of the two-step login-link flow — a BOT SHIELD, not the verifier.
//
// Login links are single-use, and both WhatsApp and email clients prefetch
// URLs to render link previews. If this route verified the token directly
// on GET, the preview bot's fetch would consume it before the client ever
// tapped the link — leaving them a dead link and a login screen. So this
// route returns a tiny HTML page whose script immediately forwards the
// browser to /auth/confirm/verify (the real verifier). Preview bots don't
// execute JavaScript, so the token survives until a real human arrives.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/portal";

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const target = `${origin}/auth/confirm/verify?token_hash=${encodeURIComponent(token_hash)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`;

  return new NextResponse(
    `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/><title>Kareem Pro — تسجيل الدخول</title></head><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1440;color:#ffffff;font-family:-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;"><div style="text-align:center;padding:24px;"><img src="${origin}/logo-transparent.png" width="52" height="58" alt="Kareem Pro" style="margin-bottom:14px;"/><div style="font-size:17px;font-weight:700;margin-bottom:6px;">جارِ تسجيل دخولك...</div><div style="font-size:13px;color:#a9adcf;">لحظة واحدة وهتكون داخل لوحة التحكم</div></div><script>location.replace(${JSON.stringify(target)});</script></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}
