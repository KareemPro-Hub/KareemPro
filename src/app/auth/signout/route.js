import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303 forces the browser to follow up with a GET (not a repeated POST,
  // which is what the default 307 does and is exactly what caused the
  // "405 Method Not Allowed" screen on "/" after signing out).
  return NextResponse.redirect(new URL("/", request.url), 303);
}
