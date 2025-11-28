# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gregory Taylor Backend - A Next.js 15 application serving as the backend/admin dashboard for a photography e-commerce site. It provides:
- REST API endpoints for a separate frontend application
- Admin dashboard for managing photos, categories, sizes, frames, formats, prices, and orders
- Stripe integration for checkout and webhooks
- Cloudinary integration for image storage
- Better Auth for admin authentication (self-hosted)

## Commands

```bash
npm run dev      # Start dev server on port 4000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

### API Routes (app/api/)
- **Public endpoints**: `/api/photos`, `/api/categories`, `/api/sizes`, `/api/frames`, `/api/formats`, `/api/checkout`, `/api/gallery/[slug]`, `/api/photos/by-name/[slug]`
- **Protected endpoints**: POST/PUT/DELETE operations require `Authorization: Bearer <NEXT_PUBLIC_ADMIN_API_KEY>` header
- All routes use `export const runtime = "nodejs"` for MongoDB compatibility

### Authentication

**UI Authentication (Better Auth)**:
- `lib/auth.js` - Server-side Better Auth config with MongoDB adapter
- `lib/auth-client.js` - Client-side auth hooks (`useSession`, `signIn`, `signOut`)
- `app/api/auth/[...all]/route.js` - Better Auth API endpoints
- `components/Providers.js` - AuthUIProvider wrapper

**API Authentication (Token-based)**:
```javascript
// Public GET, protected modifications
export async function GET(request) { /* no auth */ }
export const POST = adminAuth(async (request) => { /* protected */ })
```

- `lib/adminAuth.js` - Token-based auth middleware wrapping API handlers
- `lib/apiClient.js` - Axios client auto-injecting admin API key for requests

### Database
- MongoDB via Mongoose (`lib/db.js`)
- Cached connection pattern for serverless
- Models: Photo, Category, Size, Frame, Format, Price, Order

### Key Model Relationships (models/)
- Photo → Category (ObjectId ref)
- Photo → Size[] (ObjectId array ref)
- Photo → Format (ObjectId ref)
- Order → OrderItem[] (embedded schema with Photo ref)

### CORS Handling
`lib/utils.js:corsHeaders()` - Dynamic CORS based on `CORS_ALLOWED_ORIGINS` env var (comma-separated). Must be applied to all API responses serving the external frontend.

### Admin Dashboard (app/admin/)
- Uses `AdminShell` component wrapper with Better Auth session checking
- All admin pages are client components using `apiClient` for authenticated API requests
- Middleware redirects unauthenticated users to `/sign-in`

## Environment Variables

Required:
- `MONGODB_URI` - MongoDB connection string
- `BETTER_AUTH_SECRET` - Secret key for Better Auth session encryption
- `NEXT_PUBLIC_ADMIN_API_KEY` - Token for API authentication (NEXT_PUBLIC_ prefix for client access)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - Image uploads
- `CORS_ALLOWED_ORIGINS` - Comma-separated allowed origins for CORS (must include admin panel's own domain for Better Auth)

Optional:
- `INVITE_CODE` - If set, requires `/sign-up?code=XXX` for registration
- `NEXT_PUBLIC_INVITE_CODE` - Client-side version (must match `INVITE_CODE`)
- `PORT` - Server port (default 4000, use non-default on shared servers)

## Patterns to Follow

### API Route Structure
```javascript
export const runtime = "nodejs";
import { connectToDB } from '@/lib/db'
import { adminAuth } from '@/lib/adminAuth'
import { corsHeaders } from '@/lib/utils'

// GET - typically public
export async function GET(request) {
  await connectToDB()
  // ... fetch data
  return new Response(JSON.stringify(data), {
    headers: corsHeaders(request)
  })
}

// POST/PUT/DELETE - wrap with adminAuth
export const POST = adminAuth(async (request) => {
  await connectToDB()
  // ... mutate data
  return NextResponse.json(result, { status: 201 })
})
```

### Slug Generation
Use `generateSlug()` and `ensureUniqueSlug()` from `lib/utils.js` when creating resources with URL-friendly identifiers.

## Deployment

### CI/CD
- GitHub Actions workflow in `.github/workflows/deploy.yml`
- Builds on GitHub runner, rsyncs to server, restarts PM2
- Triggers on push to `main` or manual dispatch
- Uses GitHub Environments (`production`) for secrets/variables

### PM2 Configuration
- `ecosystem.config.cjs` - PM2 process configuration
- Uses delete + start (not reload) for reliability with errored processes

### Key Files
- `.github/workflows/deploy.yml` - CI/CD pipeline
- `ecosystem.config.cjs` - PM2 ecosystem config
