import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware({
    publicRoutes: ["/", "/photo/:id"], // allow public access to gallery & photo pages
    ignoreRoutes: ["/api/(.*)"], // skip protecting backend routes
});

export const config = {
    matcher: ["/((?!_next|.*\\..*).*)", "/api/:path*"], // match everything except static files
}

export function middleware(req) {

    const origin = req.headers.get("origin");
    const res = NextResponse.next();

    // Parse allowed origins from environment variable
    const allowed = process.env.CORS_ALLOWED_ORIGINS || ''
    const allowedOrigins = allowed.split(',').map(o => o.trim());

    if (origin && allowedOrigins.includes(origin)) {
        res.headers.set("Access-Control-Allow-Origin", "*");
        res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    
    return res;
}

