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

  return NextResponse.json({ ok: true });
}
