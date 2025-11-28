// components/Providers.js - App providers wrapper
"use client";

/**
 * App-wide providers wrapper.
 *
 * Note: Better Auth's useSession hook works without a provider wrapper
 * (unlike NextAuth which requires SessionProvider). The hook manages
 * session state internally via the authClient instance.
 *
 * This component exists as a central place to add future providers
 * (e.g., theme, toast notifications, etc.) if needed.
 */
export function Providers({ children }) {
  return <>{children}</>;
}
