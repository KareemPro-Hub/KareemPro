// ══════════════════ Admin passkeys (الدخول بالبصمة) ══════════════════
// Server-only helpers for WebAuthn sign-in on the admin login page. The
// admin registers a passkey once per device from the dashboard sidebar;
// after that the login page's "الدخول بالبصمة" button signs him in with
// Face ID / Touch ID / the fingerprint sensor — no email, no password.
//
// Credentials live in public.admin_passkeys (RLS on, no policies: only the
// service-role client used here can touch it). The one-time challenge for
// each ceremony rides in a short-lived httpOnly cookie, so no extra table.
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const RP_NAME = "Kareem Pro";
const CHALLENGE_COOKIE = "kp_pk_challenge";

// The relying-party ID is the bare domain, so a passkey made on
// kareempro.com also works on www.kareempro.com (and vice-versa).
export function relyingParty(request) {
  const url = new URL(request.url);
  const rpID = url.hostname.replace(/^www\./, "");
  const expectedOrigin =
    rpID === "localhost"
      ? [url.origin]
      : Array.from(new Set([url.origin, `https://${rpID}`, `https://www.${rpID}`]));
  return { rpID, expectedOrigin };
}

export async function saveChallenge(challenge) {
  const store = await cookies();
  store.set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/passkey",
    maxAge: 300,
  });
}

// Read-once: the cookie is cleared as soon as it's read, so a challenge can
// never be replayed.
export async function takeChallenge() {
  const store = await cookies();
  const value = store.get(CHALLENGE_COOKIE)?.value || null;
  store.set(CHALLENGE_COOKIE, "", { path: "/auth/passkey", maxAge: 0 });
  return value;
}

// The signed-in user, but only if their email is on the admins allowlist.
export async function currentAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data: row } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();
  return row ? user : null;
}

// A short, human label for the device a passkey was made on — shown nowhere
// yet, but makes the table readable if a device ever needs revoking.
export function deviceLabel(request) {
  const ua = request.headers.get("user-agent") || "";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  return "جهاز آخر";
}
