// backend/app/api/route.js

// Inserting this file to try to avoid Clerk middleware issues

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(req) {
    const { userId } = auth();
    if (!userId) return NextResponse.redirect('/sign-in');

    // CORS Logic
    const origin = req.headers.get('origin');
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS || '';
    const allowedOriginsArray = allowedOrigins.split(',').map(o => o.trim()).filter(Boolean);
    const isAllowedOrigin = origin && allowedOriginsArray.includes(origin);
    
    // Build CORS response
    const corsHeaders = {
        ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    }

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: corsHeaders,
        })
    }

        // ✅ For non-OPTIONS requests, proceed and set CORS headers if allowed
    const res = NextResponse.next()
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.headers.set(key, value)
    })

    return res
}



