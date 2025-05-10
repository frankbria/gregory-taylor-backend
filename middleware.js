// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  // List of paths that should be publicly accessible
  const publicPaths = [
    '/api/checkout',
    '/api/photos',
    '/api/categories',
    '/api/sizes',
    '/api/frames',
    '/api/formats'
  ];
  
  // Check if the path starts with any of the public paths
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Also allow paths that match specific patterns
  const isPublicPattern = [
    /^\/api\/photos\/by-name\/.*/,
    /^\/api\/gallery\/.*/
  ].some(pattern => pattern.test(request.nextUrl.pathname));

  // If it's a public path or matches a pattern, allow access
  if (isPublicPath || isPublicPattern) {
    return NextResponse.next();
  }

  // For all other api routes, check the authentication cookie
  // This would be handled by your adminAuth middleware for specific routes
  return NextResponse.next();
}

// Define which routes the middleware should run on
export const config = {
  matcher: [
    // Only run middleware on API routes
    "/api/:path*",
    // Skip static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
