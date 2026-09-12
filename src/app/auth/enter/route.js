import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DEFAULT_PREVIEW, previewCopyFor } from "@/lib/servicePreview";

// ── Preview copy for THIS client's service line ──
// The card used to carry one generic pair of lines for every client. We know
// which service the link belongs to from the token: token → client → their
// project (or, before they accept, their proposal) → its title. Wrapped in
// try/catch and falling back to the old generic pair, because a link preview
// is never worth breaking a login over. Preview bots hit this route too, so
// keep it to the two cheapest possible lookups.
async function previewForToken(token) {
  try {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("login_tokens")
      .select("client_id")
      .eq("token", token)
      .maybeSingle();
    if (!row?.client_id) return DEFAULT_PREVIEW;

    const { data: project } = await admin
      .from("projects")
      .select("title, package_name")
      .eq("client_id", row.client_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (project) return previewCopyFor(`${project.title || ""} ${project.package_name || ""}`);

    const { data: proposal } = await admin
      .from("proposals")
      .select("project_title")
      .eq("client_id", row.client_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (proposal?.project_title) return previewCopyFor(proposal.project_title);
  } catch (previewError) {
    console.error("[auth/enter] preview lookup failed:", previewError);
  }
  return DEFAULT_PREVIEW;
}

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

  const preview = await previewForToken(t);

  return new NextResponse(
    // No robots "noindex" here on purpose: WhatsApp's link-preview crawler
    // skips pages that carry it, which killed the branded preview card. The
    // page is harmless to leave crawlable — every URL carries a unique
    // one-time token and is never linked from anywhere public.
    `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Kareem Pro — بوابة الدخول</title>` +
      // Rich link preview (the big branded card) when the login link is
      // shared over WhatsApp. Without these, WhatsApp renders a bare one-line
      // card for this page.
      //
      // The image MUST stay a small JPEG: WhatsApp silently drops the
      // thumbnail from a preview when the og:image is over ~600 KB, which is
      // exactly what happened while this pointed at og-banner-v2.png (647 KB)
      // — the card still rendered, just with no banner. og-banner-v2.jpg is
      // the same artwork at 1200x630 and ~120 KB. Keep any replacement under
      // ~300 KB.
      `<meta property="og:title" content="${preview.title}"/><meta property="og:description" content="${preview.description}"/><meta property="og:site_name" content="Kareem Pro"/><meta property="og:type" content="website"/><meta property="og:url" content="https://kareempro.com"/><meta property="og:locale" content="ar_SA"/><meta property="og:image" content="https://kareempro.com/og-banner-v2.jpg"/><meta property="og:image:type" content="image/jpeg"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="Kareem Pro — إبداع بصري"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${preview.title}"/><meta name="twitter:description" content="${preview.description}"/><meta name="twitter:image" content="https://kareempro.com/og-banner-v2.jpg"/></head><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1440;color:#ffffff;font-family:-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;"><div style="text-align:center;padding:24px;"><img src="${origin}/logo-transparent.png" width="52" height="58" alt="Kareem Pro" style="margin-bottom:14px;"/><div style="font-size:17px;font-weight:700;margin-bottom:6px;">جارِ تسجيل دخولك...</div><div style="font-size:13px;color:#a9adcf;">لحظة واحدة وهتكون داخل لوحة التحكم</div></div><script>location.replace(${JSON.stringify(target)});</script></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}
