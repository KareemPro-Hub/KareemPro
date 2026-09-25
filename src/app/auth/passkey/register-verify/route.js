import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createAdminClient } from "@/lib/supabase/server";
import { relyingParty, takeChallenge, currentAdmin, deviceLabel } from "@/lib/passkeys";

// Step 2 of registering a passkey: verify the device's answer and store the
// public key. Nothing secret is stored — the private key never leaves the
// device.
export async function POST(request) {
  const user = await currentAdmin();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const expectedChallenge = await takeChallenge();
  if (!expectedChallenge) {
    return NextResponse.json({ error: "انتهت المهلة، جرّب تاني." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const { rpID, expectedOrigin } = relyingParty(request);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (e) {
    console.error("[passkey] register verify failed:", e?.message);
    return NextResponse.json({ error: "تعذّر التحقق من البصمة." }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "تعذّر التحقق من البصمة." }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;
  const admin = createAdminClient();
  const { error } = await admin.from("admin_passkeys").upsert(
    {
      admin_email: user.email,
      credential_id: credential.id,
      public_key: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter || 0,
      transports: credential.transports || [],
      device_label: deviceLabel(request),
    },
    { onConflict: "credential_id" }
  );
  if (error) {
    console.error("[passkey] save failed:", error.message);
    return NextResponse.json({ error: "تعذّر حفظ البصمة." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
