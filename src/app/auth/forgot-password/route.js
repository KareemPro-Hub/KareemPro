import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Self-service "نسيت كلمة السر ؟" from the shared /login page. Sends the
// Supabase recovery email; the link goes through /auth/callback (the proven
// invite-flow path — the code exchange happens there) and lands on
// /auth/set-password with the right ?role= so the user continues to their
// own portal after picking a new password.
//
// Always responds ok — never reveals whether an email is registered
// (prevents account enumeration).
export async function POST(request) {
  const { email, role } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "اكتب بريدك الإلكتروني أولاً." }, { status: 400 });
  }

  const safeRole = ["admin", "team", "client"].includes(role) ? role : "client";
  const nextParam = encodeURIComponent(`/auth/set-password?role=${safeRole}`);

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${nextParam}`,
  });

  return NextResponse.json({ ok: true });
}
