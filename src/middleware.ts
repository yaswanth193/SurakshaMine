import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRouteAllowed, type UserRole } from "@/lib/permissions";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(
            ({ name, value }: { name: string; value: string }) => {
              request.cookies.set(name, value);
            }
          );

          response = NextResponse.next({ request });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }: {
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }) => {
              response.cookies.set(name, value, options);
            }
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public: the employee incident-alert enrolment page has no
  // SurakshaMine login of its own, and the subscribe endpoint it
  // calls is meant to be reachable from an employee's own phone.
  // const isPublicAlertsPath =
  //   path.startsWith("/alerts/") || path === "/api/push/subscribe";

  const isPublicAlertsPath =
    path.startsWith("/alerts/") || path === "/api/push/subscribe" || path === "/sw.js";

  if (path === "/" || path === "/login" || isPublicAlertsPath) {
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile && !isRouteAllowed(profile.role as UserRole, path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};