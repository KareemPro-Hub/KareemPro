import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Step 2 of the two-step login-link flow — the real verifier. Only reached
// by an actual browser (the /auth/confirm bot shield forwards here via JS),
// so the single-use token is spent on a human, not a link-preview bot.
//
// If the token turns out already used/invalid but this browser ALREADY has
// a session (e.g. the client tapped the email link first, then the WhatsApp
// one — same link, single-use), we send them straight into the portal
// instead of a confusing login screen: they're signed in either way.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/portal";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Token dead — but if this device is already signed in, just continue.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Surfaced in Vercel runtime logs — "otp_expired" here usually means the
    // link was single-use and already consumed/invalidated, not a timeout.
    console.error("[auth-confirm] verifyOtp failed:", error.code || "", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
