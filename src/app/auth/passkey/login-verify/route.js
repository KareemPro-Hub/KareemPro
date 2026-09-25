import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { relyingParty, takeChallenge } from "@/lib/passkeys";

const FAIL = "تعذّر الدخول بالبصمة. ادخل بكلمة السر وفعّل البصمة من جديد.";

// Step 2 of passkey sign-in: verify the signature against the stored public
// key, then open a normal Supabase session for that admin — the same
// "mint a magic-link OTP and verify it server-side" trick the WhatsApp login
// links use (see auth/enter/verify), so the session cookies are identical to
// a password login.
export async function POST(request) {
  const expectedChallenge = await takeChallenge();
  if (!expectedChallenge) {
    return NextResponse.json({ error: "انتهت المهلة، جرّب تاني." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: FAIL }, { status: 400 });

  const admin = createAdminClient();
  const { data: stored } = await admin
    .from("admin_passkeys")
    .select("id, admin_email, credential_id, public_key, counter, transports")
    .eq("credential_id", body.id)
    .maybeSingle();
  if (!stored) return NextResponse.json({ error: FAIL }, { status: 401 });

  const { rpID, expectedOrigin } = relyingParty(request);
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: stored.credential_id,
        publicKey: isoBase64URL.toBuffer(stored.public_key),
        counter: Number(stored.counter) || 0,
        transports: stored.transports || undefined,
      },
    });
  } catch (e) {
    console.error("[passkey] login verify failed:", e?.message);
    return NextResponse.json({ error: FAIL }, { status: 401 });
  }
  if (!verification.verified) return NextResponse.json({ error: FAIL }, { status: 401 });

  // Still an admin? (Removing an email from `admins` cascades its passkeys
  // away, but check anyway.)
  const { data: adminRow } = await admin
    .from("admins")
    .select("email")
    .eq("email", stored.admin_email)
    .maybeSingle();
  if (!adminRow) return NextResponse.json({ error: FAIL }, { status: 403 });

  await admin
    .from("admin_passkeys")
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", stored.id);

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: stored.admin_email,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    console.error("[passkey] generateLink failed:", linkError?.message);
    return NextResponse.json({ error: FAIL }, { status: 500 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (error) {
    console.error("[passkey] verifyOtp failed:", error.message);
    return NextResponse.json({ error: FAIL }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
