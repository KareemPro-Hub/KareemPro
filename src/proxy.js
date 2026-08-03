import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function proxy(request) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  // Dedicated login pages are public and do not need a Supabase session check.
  if (path === "/admin/login" || path === "/team/login") {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Everyone lands on the same shared /login screen (3-way role tabs) —
  // ?role= preselects the right tab and ?next= sends them back to the exact
  // page they were trying to reach.
  if ((path.startsWith("/portal") || path.startsWith("/auth/set-password")) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("role", "client");
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Protect the admin area and send unauthenticated users to its dedicated login.
  if (path.startsWith("/admin") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.delete("role");
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Protect the team portal and send unauthenticated users to its dedicated login.
  if (path.startsWith("/team") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/team/login";
    url.searchParams.delete("role");
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/team/:path*", "/auth/set-password"],
};
