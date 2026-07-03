"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client — safe to use in Client Components.
// Uses the public anon key, which is subject to Row Level Security.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
