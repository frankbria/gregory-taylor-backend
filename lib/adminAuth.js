// backend/lib/adminAuth.js

import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

function jsonError(error, status) {
  return new NextResponse(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function keyMatches(token, key) {
  const a = Buffer.from(token);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Protects a route handler. Accepts either:
 * - a Better Auth session cookie (admin dashboard), or
 * - `Authorization: Bearer <ADMIN_API_KEY>` (server-to-server; ADMIN_API_KEY is server-only)
 * @param {Function} handler - The route handler to protect
 * @returns {Function} - Protected route handler
 */
export function adminAuth(handler) {
  return async (req, context) => {
    try {
      const authHeader = req.headers.get('Authorization');

      if (authHeader?.startsWith('Bearer ')) {
        const adminKey = process.env.ADMIN_API_KEY;
        if (!adminKey || !keyMatches(authHeader.slice(7), adminKey)) {
          return jsonError('Forbidden: Admin access required', 403);
        }
        return handler(req, context);
      }

      // Loaded lazily so requests without a cookie never touch the auth DB
      if (req.headers.get('cookie')) {
        const { initializeAuth } = await import('@/lib/auth');
        const auth = await initializeAuth();
        const session = auth && await auth.api.getSession({ headers: req.headers });
        if (session) {
          return handler(req, context);
        }
      }

      return jsonError('Unauthorized - Missing or invalid credentials', 401);
    } catch (error) {
      console.error('Auth error:', error);
      return jsonError('Authentication error', 500);
    }
  };
}
