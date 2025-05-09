// backend/lib/adminAuth.js

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Middleware to protect admin-only routes
 * @param {Function} handler - The route handler to protect
 * @returns {Function} - Protected route handler
 */
export function adminAuth(handler) {
  return async (req) => {
    const { userId } = auth();
    
    // No user logged in
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if the user has admin role
    const isAdmin = await checkIfUserIsAdmin(userId);
    
    if (!isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden: Admin access required' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // User is authenticated and authorized as admin, proceed with the request
    return handler(req);
  };
}

/**
 * Check if a user has admin permissions
 * @param {string} userId - Clerk user ID
 * @returns {Promise<boolean>} - True if admin, false otherwise
 */
async function checkIfUserIsAdmin(userId) {
  // For simplicity, you can hardcode the admin userIds here temporarily
  // Replace this with your preferred approach (Clerk metadata, database lookup, etc.)
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  
  // Check if the userId is in the list of admin userIds
  if (adminUserIds.includes(userId)) {
    return true;
  }
  
  // To implement more sophisticated admin checking:
  // 1. Query Clerk for user metadata
  // const user = await clerkClient.users.getUser(userId);
  // return user.publicMetadata.role === 'admin';
  
  // 2. Or check against your own database
  
  return false;
}
