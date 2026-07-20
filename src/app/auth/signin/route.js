import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Server-side email+password sign-in — now for ADMIN and TEAM only.
//
// Clients are fully passwordless (see /auth/magic-link + /auth/confirm):
// their stored password hashes were wiped when the system switched over, and
// this route refuses client accounts outright so the old password path can
// never be revived for them — even by someone hitting the endpoint directly.
//
// Everyone stays signed in until they explicitly log out — no "remember me"
// toggle, no silent expiry. createClient() defaults to a long-lived cookie
// (see lib/supabase/server.js), so we always use that default here.
export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "بيانات ناقصة." }, { status: 400 });
  }

  const cleanEmail = email.toString().trim().toLowerCase();

  // Client accounts have no password by design — send them to the
  // passwordless flow instead of failing with a confusing credentials error.
  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("id")
    .ilike("email", cleanEmail)
    .maybeSingle();

  if (client) {
    return NextResponse.json(
      {
        error:
          "حسابك بيشتغل بدون كلمة سر — اختر تبويب \"النخبة\" واكتب بريدك ليصلك رابط الدخول المباشر.",
      },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
