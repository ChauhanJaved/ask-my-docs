import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `fetch` inside
export async function middleware(request: NextRequest) {
  // Get the current pathname
  const { pathname } = request.nextUrl;

  // Define paths that require authentication
  const protectedPaths = [
    "/dashboard",
    "/dashboard/",
    "/dashboard/documents",
    "/dashboard/chats",
    "/dashboard/settings",
  ];

  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // If it's not a protected path, allow the request to continue
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // For authenticated routes, check for a valid session
  // In a real implementation, we would verify the session with Supabase
  // For now, we'll check for a simple token in cookies (this is just for demo)
  const sessionToken = request.cookies.get("sb-token")?.value;

  // If no session token exists, redirect to login page
  if (!sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If we have a session token, allow the request to continue
  // In a real app, we would validate this token with Supabase
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};