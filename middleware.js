// middleware.js
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { corsHeaders } from "@/lib/utils";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // --- CORS: handle preflight and attach headers for all /api/* routes ---
  if (pathname.startsWith('/api/')) {
    // Preflight: return 204 with CORS headers immediately
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    // Non-preflight API requests: continue to route handler with CORS headers
    const response = NextResponse.next();
    const headers = corsHeaders(request);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // --- Non-API routes below ---

  // Auth pages should be accessible without session
  const authPaths = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password'];
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));
  if (isAuthPath) {
    return NextResponse.next();
  }

  // Protect admin routes - check for Better Auth session cookie
  // (over HTTPS it is named '__Secure-better-auth.session_token'; getSessionCookie handles both)
  if (pathname.startsWith('/admin')) {
    if (!getSessionCookie(request)) {
      return NextResponse.redirect(new URL('/sign-in', process.env.BETTER_AUTH_URL || request.url));
    }
  }

  // For all other routes, allow access
  return NextResponse.next();
}

// Define which routes the middleware should run on
export const config = {
  matcher: [
    // Run on API routes and admin routes
    "/api/:path*",
    "/admin/:path*",
    // Skip static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
