import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side email+password sign-in for the admin login page.
// Runs through the server Supabase client so the session cookie is written
// with next/headers' cookies().set() — the same codec the middleware reads
// with — avoiding any mismatch that a purely client-side sign-in could hit.
export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "بيانات ناقصة." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // The credentials are valid, but the admin tab is only for actual admins:
  // otherwise a client/team account "succeeds" here then gets bounced around
  // by requireAdmin with no explanation. Fail loudly and clean up instead.
  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (!adminRow) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "هذا الحساب ليس حساب مدير. اختر التبويب المناسب لك (النخبة أو فريق العمل)." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
