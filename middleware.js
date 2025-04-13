import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export default clerkMiddleware((auth, req) => {
    const origin = req.headers.get("origin")
    const method = req.method

    const allowed = process.env.CORS_ALLOWED_ORIGINS || ''
    const allowedOrigins = allowed.split(',').map(o => o.trim())

    // Build CORS response
    const corsHeaders = {
        "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : '',
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true"
    }

    // 🛑 Handle preflight request
    if (method === "OPTIONS") {
        return new NextResponse(null, {
            status: 204,
            headers: corsHeaders
        })
    }

    // ✅ For non-OPTIONS requests, proceed and set CORS headers
    const res = NextResponse.next()
    Object.entries(corsHeaders).forEach(([key, value]) => {
        if (value) res.headers.set(key, value)
    })

    return res
})

export const config = {
    matcher: ["/((?!_next|.*\\..*).*)", "/api/:path*"]
}


