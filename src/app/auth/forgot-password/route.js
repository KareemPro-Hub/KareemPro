import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Self-service "نسيت كلمة السر ؟" from the shared /login page — ADMIN and
// TEAM only (clients are passwordless and their tab doesn't show this link).
// Sends the Supabase recovery email; the link goes through /auth/callback
// and lands on /auth/set-password with the right ?role=.
//
// Always responds ok — never reveals whether an email is registered
// (prevents account enumeration).
export async function POST(request) {
  const { email, role } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "اكتب بريدك الإلكتروني أولاً." }, { status: 400 });
  }

  // Never issue a password-recovery link for a client account — that would
  // hand them a password again and reopen the flow we just retired.
  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("id")
    .ilike("email", email.toString().trim().toLowerCase())
    .maybeSingle();
  if (client) return NextResponse.json({ ok: true });

  const safeRole = ["admin", "team", "client"].includes(role) ? role : "client";
  const nextParam = encodeURIComponent(`/auth/set-password?role=${safeRole}`);

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${nextParam}`,
  });

  return NextResponse.json({ ok: true });
}
