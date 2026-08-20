import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({
            request: req,
          });
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

  const { pathname } = req.nextUrl;

  // Define paths that require authentication
  const protectedPaths = ["/dashboard", "/onboarding"];

  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // If attempting to access a protected path without a valid user, redirect to login
  if (isProtectedPath && !user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is logged in, check 2FA and onboarding status for routing
  if (user && isProtectedPath) {
    // Check 2FA requirement (Assurance Level)
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (mfaData && mfaData.currentLevel === "aal1" && mfaData.nextLevel === "aal2") {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/2fa-verify";
      return NextResponse.redirect(redirectUrl);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    const isOnboarded = profile?.onboarding_completed ?? false;

    // First-time user trying to access /dashboard -> Redirect to /onboarding
    if (!isOnboarded && pathname.startsWith("/dashboard")) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      return NextResponse.redirect(redirectUrl);
    }

    // Already onboarded user trying to access /onboarding -> Redirect to /dashboard
    if (isOnboarded && pathname.startsWith("/onboarding")) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (OAuth callback endpoint)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth/callback).*)",
  ],
};