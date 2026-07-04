import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client — use in Server Components, Server Actions, Route Handlers.
// Reads/writes the auth session via cookies, and respects Row Level Security.
//
// Pass { remember: false } (e.g. from a "keep me signed in" checkbox that was
// left unchecked) to force the session cookie to expire when the browser
// closes instead of persisting for weeks — this is what actually implements
// "remember me" since Supabase itself always issues a long-lived refresh
// token; the only lever we have client-side is the cookie's own lifetime.
export async function createClient({ remember = true } = {}) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const finalOptions = remember
                ? options
                : { ...options, maxAge: undefined, expires: undefined };
              cookieStore.set(name, value, finalOptions);
            });
          } catch {
            // Called from a Server Component — middleware handles refresh instead.
          }
        },
      },
    }
  );
}

// Admin client — service role key, bypasses RLS. Server-only. Never import in a
// file that could end up in a Client Component bundle.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
