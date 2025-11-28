# Migration Plan: Clerk to Better Auth

**Status: COMPLETED**

## Overview

Replace Clerk authentication with Better Auth - a framework-agnostic TypeScript authentication library. This migration will:
- Remove external auth dependency (Clerk)
- Use self-hosted authentication with MongoDB storage
- Maintain existing admin API token authentication (unchanged)
- Provide similar UX with pre-built UI components

## Current Clerk Touchpoints

| File | Clerk Usage |
|------|-------------|
| `app/layout.js` | `ClerkProvider` wrapper |
| `app/page.js` | `SignedIn`, `SignedOut`, `useUser` |
| `app/admin/page.js` | `SignedIn`, `SignedOut`, `RedirectToSignIn`, `UserButton` |
| `app/sign-in/[[...sign-in]]/page.js` | `SignIn` component |
| `app/sign-up/[[...sign-up]]/page.js` | `SignUp` component |
| `components/AdminShell.js` | `SignedIn`, `SignedOut`, `UserButton` |
| `middleware.js` | No Clerk usage (uses custom logic) |
| `next.config.mjs` | Clerk env vars exposed |
| `package.json` | `@clerk/clerk-react`, `@clerk/nextjs` |

## Component Mapping

| Clerk | Better Auth Equivalent |
|-------|----------------------|
| `ClerkProvider` | `AuthUIProvider` |
| `SignedIn` | `{session && ...}` |
| `SignedOut` | `{!session && ...}` |
| `useUser()` | `authClient.useSession()` |
| `UserButton` | `UserButton` from better-auth-ui |
| `SignIn` | `AuthCard` or custom form |
| `SignUp` | `AuthCard` or custom form |
| `RedirectToSignIn` | `router.push('/sign-in')` |

---

## Phase 1: Install Dependencies & Setup Auth Infrastructure

### 1.1 Install packages
```bash
npm install better-auth @daveyplate/better-auth-ui
npm uninstall @clerk/clerk-react @clerk/nextjs
```

### 1.2 Create `lib/auth.js` - Server-side auth configuration
```javascript
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

// Reuse existing mongoose connection
const getMongoClient = async () => {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  return mongoose.connection.getClient();
};

export const auth = betterAuth({
  database: mongodbAdapter(await getMongoClient().then(c => c.db())),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

### 1.3 Create `lib/auth-client.js` - Client-side auth
```javascript
"use client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "",
});

export const { useSession, signIn, signUp, signOut } = authClient;
```

### 1.4 Create `app/api/auth/[...all]/route.js` - Auth API routes
```javascript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

---

## Phase 2: Create Provider & Update Layout

### 2.1 Create `components/Providers.js`
```javascript
"use client";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Providers({ children }) {
  const router = useRouter();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      Link={Link}
    >
      {children}
    </AuthUIProvider>
  );
}
```

### 2.2 Update `app/layout.js`
- Remove `ClerkProvider` import
- Import and wrap with `Providers` component
- Remove Clerk-related code

---

## Phase 3: Replace Auth Pages

### 3.1 Update `app/sign-in/[[...sign-in]]/page.js`
Replace Clerk `SignIn` with Better Auth form or `AuthCard`:
```javascript
"use client";
import { AuthCard } from "@daveyplate/better-auth-ui";

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <AuthCard view="SIGN_IN" />
    </div>
  );
}
```

### 3.2 Update `app/sign-up/[[...sign-up]]/page.js`
Similar pattern with `view="SIGN_UP"`

### 3.3 Route structure options
- Keep `[[...sign-in]]` catch-all route, OR
- Simplify to `app/(auth)/sign-in/page.js`

---

## Phase 4: Update Components

### 4.1 Update `app/page.js`
```javascript
"use client";
import { useSession } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();

  // Replace SignedIn/SignedOut with conditional rendering
  if (isPending) return <LoadingSpinner />;

  return (
    <div>
      {session ? (
        // Previously SignedIn content
        <button onClick={() => router.push('/admin')}>Continue to Admin</button>
      ) : (
        // Previously SignedOut content
        <Link href="/sign-in">Sign In to Admin</Link>
      )}
    </div>
  );
}
```

### 4.2 Update `components/AdminShell.js`
```javascript
"use client";
import { useSession, signOut } from "@/lib/auth-client";
import { UserButton } from "@daveyplate/better-auth-ui";

export default function AdminShell({ children }) {
  const { data: session, isPending } = useSession();

  if (isPending) return <LoadingSpinner />;

  return (
    <div className="flex h-screen">
      <aside>
        {/* Sidebar content */}
      </aside>
      <main>
        {session ? (
          children
        ) : (
          <div>
            <p>You must be signed in to access admin.</p>
            <Link href="/sign-in">Sign In</Link>
          </div>
        )}
      </main>
    </div>
  );
}
```

### 4.3 Update `app/admin/page.js`
- Remove Clerk imports
- Keep redirect logic (currently just redirects to /admin/photos)

---

## Phase 5: Update Middleware

### 5.1 Update `middleware.js`
Add session checking for admin routes:
```javascript
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public API paths (unchanged)
  const publicPaths = ['/api/checkout', '/api/photos', ...];

  // Check admin UI routes
  if (pathname.startsWith('/admin')) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // Existing API path logic...
  return NextResponse.next();
}
```

---

## Phase 6: Environment Variables

### 6.1 Add new variables
```env
BETTER_AUTH_SECRET=<generate-secure-secret>
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

### 6.2 Remove from `next.config.mjs`
```javascript
// Remove these:
CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
```

---

## Phase 7: Cleanup & Testing

### 7.1 Remove Clerk packages
```bash
npm uninstall @clerk/clerk-react @clerk/nextjs
```

### 7.2 Update `CLAUDE.md`
Document new auth patterns and Better Auth usage.

### 7.3 Testing checklist
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Sign out
- [ ] Session persistence across refresh
- [ ] Protected admin routes redirect when unauthenticated
- [ ] Admin dashboard access when authenticated
- [ ] API endpoints still work (adminAuth.js unchanged)

---

## Database Collections

Better Auth will auto-create these MongoDB collections:
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth/credential accounts
- `verification` - Email verification tokens

---

## Notes

1. **Admin API Authentication** - The existing `lib/adminAuth.js` token-based auth for API routes remains unchanged. Better Auth handles UI authentication only.

2. **No User Migration** - Since this is an admin-only app with likely few users, manual re-registration is acceptable. For production with many users, a migration script would be needed.

3. **Better Auth UI** - Using `@daveyplate/better-auth-ui` provides pre-built shadcn-styled components. If custom styling is needed, build forms manually using `authClient.signIn.email()` etc.

4. **Session Strategy** - Better Auth uses secure HTTP-only cookies by default, similar to Clerk.
