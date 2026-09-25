import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { createAdminClient } from "@/lib/supabase/server";
import { RP_NAME, relyingParty, saveChallenge, currentAdmin } from "@/lib/passkeys";

// Step 1 of registering a passkey — only for a signed-in admin.
export async function POST(request) {
  const user = await currentAdmin();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { rpID } = relyingParty(request);
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("admin_passkeys")
    .select("credential_id, transports")
    .eq("admin_email", user.email);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: user.email,
    userDisplayName: "مدير Kareem Pro",
    // Stable per admin, so re-registering on the same device replaces the
    // old passkey instead of piling up duplicates in the device's keychain.
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    // Don't register a second passkey on a device that already has one.
    excludeCredentials: (existing || []).map((c) => ({
      id: c.credential_id,
      transports: c.transports || undefined,
    })),
    authenticatorSelection: {
      // Discoverable, so the login button needs no email at all.
      residentKey: "required",
      userVerification: "required",
    },
  });

  await saveChallenge(options.challenge);
  return NextResponse.json(options);
}
