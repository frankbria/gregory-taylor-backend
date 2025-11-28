# Gregory Taylor Backend

A Next.js 15 application serving as the backend API and admin dashboard for a photography e-commerce site.

## Overview

This project provides:
- **REST API** endpoints for a separate frontend application
- **Admin Dashboard** for managing photos, categories, sizes, frames, formats, prices, and orders
- **Stripe Integration** for checkout and payment webhooks
- **Cloudinary Integration** for image storage and delivery
- **Better Auth** for self-hosted admin authentication

## Features

- Photo management with categories, sizes, frames, and formats
- Dynamic pricing system
- Order management with status tracking
- Secure admin authentication (email/password)
- Token-based API protection for mutations
- CORS support for cross-origin frontend requests
- Responsive admin dashboard UI

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Better Auth (self-hosted)
- **Payments**: Stripe Checkout & Webhooks
- **Image Storage**: Cloudinary
- **Styling**: Tailwind CSS

## Installation

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Stripe account
- Cloudinary account

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/frankbria/gregory-taylor-backend.git
   cd gregory-taylor-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables (see [Configuration](#configuration))

5. Start the development server:
   ```bash
   npm run dev
   ```

The server runs on [http://localhost:4000](http://localhost:4000) by default.

## Commands

```bash
npm run dev      # Start dev server on port 4000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Configuration

Copy `.env.example` to `.env` and configure:

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `BETTER_AUTH_SECRET` | Secret for session encryption (generate: `openssl rand -base64 32`) |
| `NEXT_PUBLIC_ADMIN_API_KEY` | Token for API authentication (generate: `openssl rand -hex 32`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins |

## API Endpoints

### Public Endpoints (GET)

| Endpoint | Description |
|----------|-------------|
| `/api/photos` | List all photos |
| `/api/photos/by-name/[slug]` | Get photo by slug |
| `/api/categories` | List all categories |
| `/api/gallery/[slug]` | Get gallery by category slug |
| `/api/sizes` | List all sizes |
| `/api/frames` | List all frames |
| `/api/formats` | List all formats |
| `/api/checkout` | Create Stripe checkout session |

### Protected Endpoints

POST, PUT, and DELETE operations require the `Authorization: Bearer <NEXT_PUBLIC_ADMIN_API_KEY>` header.

### Stripe Webhooks

Configure these webhooks in Stripe Dashboard pointing to `/api/webhooks/stripe`:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

## Authentication

### Admin UI Authentication

The admin dashboard uses Better Auth for session-based authentication:

```javascript
// Client-side usage
import { useSession, signIn, signOut } from "@/lib/auth-client";

const { data: session, isPending } = useSession();

// Sign in
await signIn.email({ email, password }, {
  onSuccess: () => router.push("/admin"),
  onError: (ctx) => setError(ctx.error?.message)
});
```

### API Authentication

API mutations are protected with token-based authentication:

```javascript
import { adminAuth } from '@/lib/adminAuth'

// Protected endpoint
export const POST = adminAuth(async (request) => {
  // Handler code
})
```

## Admin Dashboard

Access the admin dashboard at `/admin` after signing in. Features include:

- **Photos**: Upload, edit, and manage photo listings
- **Categories**: Organize photos into categories
- **Sizes/Frames/Formats**: Configure product options
- **Prices**: Set pricing for different configurations
- **Orders**: View and manage customer orders

## Project Structure

```
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── api/             # API routes
│   │   ├── auth/        # Better Auth endpoints
│   │   ├── photos/      # Photo CRUD
│   │   ├── categories/  # Category CRUD
│   │   ├── checkout/    # Stripe checkout
│   │   └── webhooks/    # Stripe webhooks
│   ├── sign-in/         # Sign in page
│   └── sign-up/         # Sign up page
├── components/          # React components
├── lib/                 # Utilities and configurations
│   ├── auth.js          # Better Auth server config
│   ├── auth-client.js   # Better Auth client hooks
│   ├── adminAuth.js     # API auth middleware
│   ├── db.js            # MongoDB connection
│   └── utils.js         # Helper functions
└── models/              # Mongoose models
```

## Development

### First Admin User

After deployment, register the first admin user at `/sign-up`. Better Auth stores users in MongoDB collections:
- `user` - User accounts
- `session` - Active sessions
- `account` - Credential accounts

### CORS Configuration

The API supports CORS for cross-origin requests. Configure allowed origins in `CORS_ALLOWED_ORIGINS`:

```env
CORS_ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000
```

## Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Environment Setup

Ensure all environment variables are configured in your deployment platform. The `BETTER_AUTH_SECRET` and other secrets should never be exposed to the client bundle.

### Post-Deployment Checklist

- [ ] Register first admin user via `/sign-up`
- [ ] Verify sign in/out functionality
- [ ] Test API endpoints
- [ ] Configure Stripe webhooks
- [ ] Verify CORS headers

## What's New

### Better Auth Migration (Latest)

- Replaced Clerk with Better Auth for self-hosted authentication
- Custom sign-in/sign-up forms with server-side password validation
- Session-based authentication with secure cookie handling
- Removed external authentication dependency

### Security Improvements

- Server-side password validation (minimum 8 characters)
- Secrets properly isolated from client bundle
- Lazy initialization for Stripe to avoid build-time errors
- Consistent environment variable naming

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check for issues
5. Submit a pull request

## License

This project is private and proprietary.

## Related

- [Gregory Taylor Frontend](https://github.com/frankbria/gregory-taylor-frontend) - Customer-facing storefront
