import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendMagicLinkEmail } from "@/lib/email";

// Passwordless client login — step 1 of 2. The /login page posts just an
// email here; if it belongs to a registered client we generate a one-time
// Supabase login link (token_hash flavor) and send it inside the branded
// Resend email. Clicking the button hits /auth/confirm (step 2), which
// verifies the token server-side and lands them in /portal fully signed in.
//
// Always responds ok — never reveals whether an email is registered
// (prevents account enumeration), same policy as forgot-password.
export async function POST(request) {
  const { email } = await request.json();

  const cleanEmail = email?.toString().trim().toLowerCase();
  if (!cleanEmail) {
    return NextResponse.json({ error: "اكتب بريدك الإلكتروني أولاً." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Only registered clients get login links — silently ignore anyone else.
  const { data: client } = await admin
    .from("clients")
    .select("id, full_name, email")
    .ilike("email", cleanEmail)
    .maybeSingle();

  if (client) {
    try {
      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: cleanEmail,
      });
      const tokenHash = data?.properties?.hashed_token;
      if (!error && tokenHash) {
        const actionUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=/portal`;
        await sendMagicLinkEmail({
          to: cleanEmail,
          clientName: client.full_name,
          actionUrl,
          isWelcome: false,
        });
      } else if (error) {
        console.error("[magic-link] generateLink failed:", error.message);
      }
    } catch (sendError) {
      // Logged, not surfaced — the response stays identical either way.
      console.error("[magic-link] send failed:", sendError);
    }
  }

  return NextResponse.json({ ok: true });
}
