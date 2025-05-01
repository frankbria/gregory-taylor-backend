import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { corsHeaders } from '@/lib/utils';

export function middleware(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }

  // Proceed with request and attach CORS headers
  const response = NextResponse.next();
  Object.entries(corsHeaders(request)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: '/api/:path*',
}; 