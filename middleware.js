// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // List of paths that should be publicly accessible (API)
  const publicApiPaths = [
    '/api/checkout',
    '/api/photos',
    '/api/categories',
    '/api/sizes',
    '/api/frames',
    '/api/formats',
    '/api/auth', // Better Auth endpoints
  ];

  // Check if the path starts with any of the public API paths
  const isPublicApiPath = publicApiPaths.some(path =>
    pathname.startsWith(path)
  );

  // Also allow paths that match specific patterns
  const isPublicPattern = [
    /^\/api\/photos\/by-name\/.*/,
    /^\/api\/gallery\/.*/
  ].some(pattern => pattern.test(pathname));

  // If it's a public API path or matches a pattern, allow access
  if (isPublicApiPath || isPublicPattern) {
    return NextResponse.next();
  }

  // Auth pages should be accessible without session
  const authPaths = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password'];
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));
  if (isAuthPath) {
    return NextResponse.next();
  }

  // Protect admin routes - check for Better Auth session cookie
  // Better Auth uses 'better-auth.session_token' cookie by default
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('better-auth.session_token');
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
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
