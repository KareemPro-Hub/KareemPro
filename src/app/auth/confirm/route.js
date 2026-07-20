import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles Supabase's token_hash-based email links (invite, magic link,
// recovery, signup confirmation, email change). This is the PKCE-safe path:
// the previous /auth/callback route only understood a `?code=` param, but
// Supabase's own {{ .ConfirmationURL }} actually redirects through its
// hosted verify endpoint and comes back with the session in a URL *hash
// fragment* (#access_token=...) — which a server route can never see, since
// fragments never get sent over HTTP. That's what produced the long ugly
// #access_token=... URL and dropped people back on /login instead of
// logging them in. Verifying token_hash server-side avoids all of that.
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
    // Surfaced in Vercel runtime logs — "otp_expired" here usually means the
    // link was single-use and already consumed/invalidated (e.g. a newer
    // link was generated for the same user), not an actual timeout.
    console.error("[auth-confirm] verifyOtp failed:", error.code || "", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
