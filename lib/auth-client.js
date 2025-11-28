// lib/auth-client.js - Better Auth client configuration
"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

// Export commonly used hooks and methods
export const { useSession, signIn, signUp, signOut } = authClient;
