import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { relyingParty, saveChallenge } from "@/lib/passkeys";

// Step 1 of passkey sign-in. Public: no email is asked for — the device
// offers whichever Kareem Pro passkey it holds (discoverable credential).
export async function POST(request) {
  const { rpID } = relyingParty(request);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
  });
  await saveChallenge(options.challenge);
  return NextResponse.json(options);
}
