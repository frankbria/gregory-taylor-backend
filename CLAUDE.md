# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gregory Taylor Backend - A Next.js 15 application serving as the backend/admin dashboard for a photography e-commerce site. It provides:
- REST API endpoints for a separate frontend application
- Admin dashboard for managing photos, categories, sizes, frames, formats, prices, and orders
- Stripe integration for checkout and webhooks
- Cloudinary integration for image storage
- Clerk authentication for admin access

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
- **Protected endpoints**: POST/PUT/DELETE operations require `Authorization: Bearer <ADMIN_API_KEY>` header
- All routes use `export const runtime = "nodejs"` for MongoDB compatibility

### Authentication Pattern
```javascript
// Public GET, protected modifications
export async function GET(request) { /* no auth */ }
export const POST = adminAuth(async (request) => { /* protected */ })
```

- `lib/adminAuth.js` - Token-based auth middleware wrapping handlers
- `lib/apiClient.js` - Axios client auto-injecting admin API key for admin dashboard requests
- Clerk handles admin user sign-in (UI only, not API auth)

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
- Uses `AdminShell` component wrapper with Clerk's `SignedIn`/`SignedOut`
- All admin pages are client components using `apiClient` for authenticated requests

## Environment Variables

Required:
- `MONGODB_URI` - MongoDB connection string
- `ADMIN_API_KEY` - Token for API authentication
- `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk auth
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - Image uploads
- `CORS_ALLOWED_ORIGINS` - Comma-separated allowed origins for CORS

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
