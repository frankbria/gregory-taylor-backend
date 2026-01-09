# Gregory Taylor Backend

[![Follow on X](https://img.shields.io/twitter/follow/FrankBria18044?style=social)](https://x.com/FrankBria18044)

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
| `INVITE_CODE` | Secret code for user registration (optional) |

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

### Admin User Registration

Registration is controlled via invite code. If `INVITE_CODE` is set, users must access:

```
https://yourdomain.com/sign-up?code=YOUR_INVITE_CODE
```

Without a valid code, the sign-up page displays "Registration Closed". This prevents unauthorized account creation while allowing you to invite specific users.

Better Auth stores users in MongoDB collections:
- `user` - User accounts
- `session` - Active sessions
- `account` - Credential accounts

### CORS Configuration

The API supports CORS for cross-origin requests. Configure allowed origins in `CORS_ALLOWED_ORIGINS`:

```env
CORS_ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000
```

## Deployment

### CI/CD Pipeline

This project uses GitHub Actions for automated deployment:

- **Trigger**: Push to `main` branch or manual workflow dispatch
- **Process**: Build on GitHub runner → rsync to server → PM2 restart
- **Environment**: Uses GitHub Environments (`production`) for secrets

#### Required GitHub Secrets (production environment)

| Secret | Description |
|--------|-------------|
| `SERVER_HOST` | Server IP/hostname |
| `SERVER_USER` | SSH username |
| `SSH_PRIVATE_KEY` | Private key for SSH access |
| All env vars | Same as `.env.example` |

#### Required GitHub Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `DEPLOY_PATH` | `/var/www/gregory-taylor-backend` | Server deployment directory |
| `APP_PORT` | `4001` | Port for the app (avoid defaults on shared servers) |
| `PM2_APP_NAME` | `gregory-taylor-backend` | PM2 process name |
| `SERVER_SSH_PORT` | `22` | SSH port (optional) |

### Manual Deployment

```bash
npm run build
npm run start
```

### Server Requirements

- Node.js 20+
- PM2 (`npm install -g pm2`)
- Nginx (for reverse proxy/SSL)

### Post-Deployment Checklist

- [ ] Configure GitHub secrets and variables
- [ ] Set up nginx server block with SSL (certbot)
- [ ] Register admin user via `/sign-up?code=YOUR_INVITE_CODE`
- [ ] Verify sign in/out functionality
- [ ] Test API endpoints
- [ ] Configure Stripe webhooks
- [ ] Verify CORS headers (must include admin panel's own domain)

## What's New

### CI/CD & Registration Controls (Latest)

- GitHub Actions CI/CD pipeline with automated deployment
- PM2 process management for production reliability
- Invite code protection for user registration
- Server-side validation prevents registration bypass

### Better Auth Migration

- Replaced Clerk with Better Auth for self-hosted authentication
- Custom sign-in/sign-up forms with server-side password validation
- Session-based authentication with secure cookie handling
- Removed external authentication dependency

### Security Improvements

- Invite-only registration when `INVITE_CODE` is set
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
