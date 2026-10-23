import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentAdmin } from "@/lib/passkeys";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const user = await currentAdmin();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401, headers });
  const { data, error } = await createAdminClient().from("admin_passkeys")
    .select("id").eq("admin_email", user.email).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: "تعذّر التحقق من حالة البصمة." }, { status: 503, headers });
  // Account-level registration only: do not claim this browser has the key.
  return NextResponse.json({ enabled: !!data }, { headers });
}
