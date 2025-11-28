// components/Providers.js - App providers wrapper
"use client";

export function Providers({ children }) {
  // Better Auth client-side state is managed via the authClient hooks
  // No additional provider wrapper needed for basic auth functionality
  return <>{children}</>;
}
