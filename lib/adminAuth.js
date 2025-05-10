// backend/lib/adminAuth.js

import { NextResponse } from 'next/server'

/**
 * Simple token-based authentication middleware
 * @param {Function} handler - The route handler to protect
 * @returns {Function} - Protected route handler
 */
export function adminAuth(handler) {
  return async (req) => {
    try {
      // Check for authorization header
      const authHeader = req.headers.get('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized - Missing or invalid token' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const token = authHeader.split(' ')[1];
      const adminToken = process.env.ADMIN_API_KEY;
      
      // Check if the token matches the admin API key
      if (token !== adminToken) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden: Admin access required' }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // User is authenticated and authorized as admin, proceed with the request
      return handler(req);
    } catch (error) {
      console.error('Auth error:', error);
      return new NextResponse(JSON.stringify({ error: 'Authentication error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}
