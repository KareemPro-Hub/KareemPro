import crypto from "node:crypto";

// ══════════════════ Passwordless login links ══════════════════
// Every client-facing message (welcome, payment request, payment confirmed,
// project progress, discount, new file) carries a link that drops the client
// straight into their portal — no username, no password, ever.
//
// Why these and not Supabase's own magic links: Supabase stores only ONE
// valid OTP per user, so minting a link for the WhatsApp message instantly
// invalidated the one already sent by email — the client tapped it and got a
// login screen. That bug is exactly what this table exists to prevent: each
// message gets its own independent token and they all stay valid together.
//
// The Supabase session itself is still created the standard way — at
// redemption time (see /auth/enter/verify) we mint a fresh Supabase OTP and
// verify it server-side. These tokens are just the outer, multi-issue key.

const LINK_LIFETIME_DAYS = 7;

// Creates a fresh login token for a client and returns the full URL.
// Reusable within its lifetime on purpose: a client re-opening an older
// WhatsApp message should still get in, not hit a dead link.
export async function createLoginLink(admin, clientId) {
  if (!clientId) throw new Error("معرّف صاحب المشروع مفقود");

  const token = crypto.randomBytes(32).toString("base64url");
  const expires_at = new Date(Date.now() + LINK_LIFETIME_DAYS * 86400000).toISOString();

  const { error } = await admin
    .from("login_tokens")
    .insert({ client_id: clientId, token, expires_at });
  if (error) throw new Error(error.message);

  return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/enter?t=${token}`;
}

// Looks up a token and returns the client's email when it's still valid.
// Returns null for unknown/expired tokens — the caller decides what to show.
export async function redeemLoginToken(admin, token) {
  if (!token) return null;

  const { data: row } = await admin
    .from("login_tokens")
    .select("id, client_id, expires_at, clients(email)")
    .eq("token", token)
    .maybeSingle();

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  // Touch (not consume) — the link keeps working until it expires.
  await admin
    .from("login_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id);

  return row.clients?.email || null;
}
