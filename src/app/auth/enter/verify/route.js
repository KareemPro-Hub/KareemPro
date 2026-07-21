import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redeemLoginToken } from "@/lib/loginLinks";

// Step 2 of the platform login-link flow — the real verifier. Only reached by
// an actual browser (the /auth/enter bot shield forwards here via JS), so a
// link preview never burns the link.
//
// Our token identifies the client; the Supabase session is then created the
// standard way by minting a fresh OTP for that email and verifying it
// server-side. That indirection is the whole point: our tokens can be issued
// per message and all stay valid, while Supabase only ever holds the one
// short-lived OTP it needs at this exact moment.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("t");
  const next = searchParams.get("next") || "/portal";

  const admin = createAdminClient();
  const supabase = await createClient();

  const email = await redeemLoginToken(admin, token);

  if (email) {
    const { data, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = data?.properties?.hashed_token;

    if (!linkError && tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: tokenHash,
      });
      if (!error) return NextResponse.redirect(`${origin}${next}`);
      console.error("[auth-enter] verifyOtp failed:", error.code || "", error.message);
    } else if (linkError) {
      console.error("[auth-enter] generateLink failed:", linkError.message);
    }
  } else {
    console.error("[auth-enter] token invalid or expired");
  }

  // Expired/unknown token — but if this device already has a session, just
  // send them in rather than showing a pointless login screen.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return NextResponse.redirect(`${origin}${next}`);

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
