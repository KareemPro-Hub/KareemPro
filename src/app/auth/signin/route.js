import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Shared server-side email+password sign-in — used by both the client portal
// login and the admin login. Runs through the server Supabase client so the
// session cookie is written with next/headers' cookies().set(), matching
// what the middleware reads with.
export async function POST(request) {
  const { email, password, remember } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "بيانات ناقصة." }, { status: 400 });
  }

  // "تذكرني" unchecked -> session cookie only (gone once the browser closes).
  const supabase = await createClient({ remember: remember !== false });
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
