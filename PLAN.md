# Migration Plan: Clerk to Better Auth

**Status: COMPLETED** - Ready for testing after deployment

## Overview

Replace Clerk authentication with Better Auth - a framework-agnostic TypeScript authentication library. This migration:
- Removes external auth dependency (Clerk)
- Uses self-hosted authentication with MongoDB storage
- Maintains existing admin API token authentication (unchanged)
- Provides custom sign-in/sign-up forms

## Implementation Summary

### Files Created
| File | Purpose |
|------|---------|
| `lib/auth.js` | Server-side Better Auth config with MongoDB adapter |
| `lib/auth-client.js` | Client-side auth hooks (`useSession`, `signIn`, `signUp`, `signOut`) |
| `app/api/auth/[...all]/route.js` | Better Auth API endpoints |
| `components/Providers.js` | App wrapper (simplified, no AuthUIProvider needed) |
| `.env.example` | Template for required environment variables |

### Files Modified
| File | Changes |
|------|---------|
| `app/layout.js` | Replaced `ClerkProvider` with `Providers` |
| `app/page.js` | Replaced Clerk hooks with `useSession` |
| `app/sign-in/[[...sign-in]]/page.js` | Custom sign-in form using `signIn.email()` |
| `app/sign-up/[[...sign-up]]/page.js` | Custom sign-up form using `signUp.email()` |
| `components/AdminShell.js` | Session-based auth with custom user menu |
| `app/admin/page.js` | Removed Clerk imports |
| `middleware.js` | Added Better Auth session cookie check for `/admin` routes |
| `next.config.mjs` | Removed Clerk env vars, added `BETTER_AUTH_SECRET` |
| `package.json` | Removed Clerk packages, added `better-auth` |

### Files Removed (dependencies)
- `@clerk/clerk-react`
- `@clerk/nextjs`

---

## Technical Details

### Authentication Pattern

**Client-side session check:**
```javascript
import { useSession } from "@/lib/auth-client";

const { data: session, isPending } = useSession();

// Conditional rendering
{session ? <AuthenticatedContent /> : <SignInPrompt />}
```

**Sign in/out:**
```javascript
import { signIn, signOut } from "@/lib/auth-client";

// Sign in
await signIn.email({ email, password }, {
  onSuccess: () => router.push("/admin"),
  onError: (ctx) => setError(ctx.error?.message)
});

// Sign out
await signOut();
```

### Middleware Protection

The middleware checks for Better Auth's session cookie on admin routes:
```javascript
if (pathname.startsWith('/admin')) {
  const sessionCookie = request.cookies.get('better-auth.session_token');
  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
}
```

Note: Uses direct cookie access instead of `getSessionCookie` from better-auth/cookies due to Edge Runtime compatibility.

### Lazy Initialization

`lib/auth.js` uses lazy initialization to handle build-time scenarios when environment variables aren't available:
```javascript
let syncAuth = null;
try {
  if (process.env.MONGODB_URI) {
    syncAuth = betterAuth({...});
  }
} catch (e) {
  console.warn("Auth initialization deferred");
}
export const auth = syncAuth;
```

---

## Environment Variables

### Required (add to `.env`)
```env
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

### Removed
```env
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
```

---

## Database Collections

Better Auth auto-creates these MongoDB collections on first use:
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth/credential accounts
- `verification` - Email verification tokens

---

## Post-Deployment Testing Checklist

- [ ] Sign up new admin user via `/sign-up`
- [ ] Sign in with created user via `/sign-in`
- [ ] Verify session persists across page refresh
- [ ] Sign out and verify redirect to sign-in
- [ ] Access `/admin` without session → redirects to `/sign-in`
- [ ] Access `/admin` with session → shows admin dashboard
- [ ] Verify API endpoints work (photos, categories, etc.)
- [ ] Verify admin API mutations work (create/update/delete)

---

## Notes

1. **Admin API Authentication** - The existing `lib/adminAuth.js` token-based auth for API routes remains unchanged. Better Auth handles UI authentication only.

2. **No User Migration** - Clerk users won't automatically migrate. First admin user must register via `/sign-up` after deployment.

3. **Custom Forms vs better-auth-ui** - Originally planned to use `@daveyplate/better-auth-ui` components, but `AuthCard` export issues led to custom form implementation. This provides more styling control.

4. **Session Strategy** - Better Auth uses secure HTTP-only cookies (`better-auth.session_token`), similar to Clerk's approach.
