# Critical Security Issues - Backend

> **Priority: P0 - Must fix before production launch**
>
> These issues represent critical security vulnerabilities in the backend that could lead to data breaches, unauthorized access, or financial loss.

---

## Issue: Replace NEXT_PUBLIC_ADMIN_API_KEY with server-side authentication

**Labels:** `security`, `critical`, `authentication`
**Priority:** P0
**Estimated Effort:** 4 hours

### Summary

The backend uses `NEXT_PUBLIC_ADMIN_API_KEY` as a bearer token for admin API authentication. The `NEXT_PUBLIC_` prefix causes Next.js to embed this token in client-side JavaScript bundles, making it publicly visible in browser DevTools. This is a **critical security vulnerability** that exposes all admin operations.

### Current Implementation

**`lib/adminAuth.js`:**
```javascript
export function adminAuth(handler) {
  return async (req, res) => {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (token !== process.env.NEXT_PUBLIC_ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler(req)
  }
}
```

**Problem:** Any user can open browser DevTools → Application → Sources, search for `NEXT_PUBLIC_ADMIN_API_KEY`, and extract the token.

### Impact

- **Severity:** Critical
- Attackers can:
  - Delete all photos and Cloudinary images
  - Create/modify/delete categories, sizes, frames, formats, prices
  - Access/modify all orders
  - Upload malicious content
  - Completely destroy the photography catalog

### Proposed Solution

Use Better Auth sessions instead of token-based auth:

```javascript
// lib/adminAuth.js
import { auth } from '@/lib/auth'

export async function adminAuth(handler) {
  return async (req) => {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(req, session)
  }
}
```

Update all admin API routes to use session-based auth instead of bearer token.

### Acceptance Criteria

- [ ] `NEXT_PUBLIC_ADMIN_API_KEY` removed from `.env` and code
- [ ] Admin API routes use Better Auth session validation
- [ ] Existing admin dashboard functionality works without changes
- [ ] Unauthorized requests to admin APIs return 401
- [ ] API keys not visible in client-side bundles

### Testing

1. Open DevTools → Search for "API_KEY" in sources → Should find nothing
2. Call admin API without session → Expect 401
3. Call admin API with valid session → Expect success
4. Sign out, try admin API → Expect 401

---

## Issue: Implement rate limiting for authentication and API endpoints

**Labels:** `security`, `critical`, `performance`
**Priority:** P0
**Estimated Effort:** 3 hours

### Summary

The backend has no rate limiting, making it vulnerable to brute-force password attacks, API spam, and denial-of-service attempts.

### Current Behavior

- Unlimited sign-in attempts per IP/user
- Unlimited API calls to public endpoints
- Unlimited admin API mutations
- No protection against automated attacks

### Impact

- **Severity:** Critical
- **Risks:**
  - Brute-force password attacks
  - Cloudinary quota exhaustion via excessive image requests
  - Database overload from query spam
  - Denial of service to legitimate users

### Proposed Solution

Install rate limiting middleware:

```bash
npm install express-rate-limit
```

**`lib/rateLimiter.js`:**
```javascript
import rateLimit from 'express-rate-limit'

// Authentication endpoints - strict limits
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
})

// Admin mutations - moderate limits
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
})

// Public API - generous limits
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // 300 requests per minute
})

// Image uploads - very strict
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
})
```

Apply to appropriate routes.

### Rate Limit Configuration

| Endpoint Category | Window | Max Requests | Reasoning |
|------------------|--------|--------------|-----------|
| `/api/auth/*` | 15 min | 5 | Prevent brute force |
| `/api/upload` | 1 hour | 10 | Prevent storage abuse |
| Admin mutations | 1 min | 60 | Normal admin usage |
| Public GET endpoints | 1 min | 300 | High traffic tolerance |

### Acceptance Criteria

- [ ] Rate limiting middleware installed and configured
- [ ] Authentication endpoints limited to 5 attempts per 15 minutes
- [ ] Image uploads limited to 10 per hour
- [ ] Admin API limited to 60 requests per minute
- [ ] Public API limited to 300 requests per minute
- [ ] Rate limit headers returned
- [ ] Appropriate error messages when limits exceeded

### Testing

1. Attempt 6 sign-ins in 15 minutes → 6th should be blocked
2. Upload 11 images in 1 hour → 11th should be blocked
3. Make 301 public API calls in 1 minute → 301st blocked
4. Verify `X-RateLimit-*` headers present in responses

---

## Issue: Add CSRF protection to admin mutations

**Labels:** `security`, `critical`
**Priority:** P0
**Estimated Effort:** 3 hours

### Summary

Admin dashboard mutations (POST/PUT/DELETE) have no Cross-Site Request Forgery (CSRF) protection. An attacker could trick an authenticated admin into executing state-changing requests via malicious websites.

### Attack Scenario

1. Admin signs into dashboard
2. Admin visits malicious site in another tab
3. Malicious site makes authenticated requests to admin API
4. Resources deleted/modified without admin's knowledge

### Proposed Solution

Implement CSRF token validation:

```bash
npm install csrf
```

```javascript
// lib/csrf.js
import csrf from 'csrf'
const tokens = new csrf()

export function generateCsrfToken() {
  return tokens.create(process.env.CSRF_SECRET)
}

export function verifyCsrfToken(token) {
  return tokens.verify(process.env.CSRF_SECRET, token)
}

export async function csrfProtection(req) {
  const token = req.headers.get('x-csrf-token')
  if (!token || !verifyCsrfToken(token)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }
  return null
}
```

Apply to all admin POST/PUT/DELETE routes.

### Acceptance Criteria

- [ ] CSRF protection implemented
- [ ] All admin POST/PUT/DELETE routes validate CSRF tokens
- [ ] Admin dashboard includes CSRF token in requests
- [ ] Missing/invalid CSRF token returns 403 error
- [ ] Public GET endpoints exempt from CSRF checks

### Testing

1. Make admin mutation without token → Expect 403
2. Make admin mutation with valid token → Expect success
3. Make admin mutation with expired token → Expect 403

---

## Issue: Add comprehensive input validation with Zod

**Labels:** `security`, `critical`, `validation`
**Priority:** P0
**Estimated Effort:** 6 hours

### Summary

API endpoints lack comprehensive input validation and sanitization, creating risks for NoSQL injection, XSS attacks, and malformed data in the database.

### Current Gaps

1. No file type validation on `/api/upload`
2. No validation of order totals
3. No sanitization of user-provided text
4. No maximum length checks on string fields

### Proposed Solution

Install Zod for schema validation:

```bash
npm install zod
```

**`lib/validations.js`:**
```javascript
import { z } from 'zod'

export const photoSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  keywords: z.array(z.string().max(50)).max(20).optional(),
  imageUrl: z.string().url(),
  publicID: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  featured: z.boolean().optional(),
  fullLength: z.boolean().optional(),
  location: z.string().max(200).trim().optional(),
})

export const orderSchema = z.object({
  userId: z.string().max(100).optional(),
  items: z.array(orderItemSchema).min(1).max(50),
  totalAmount: z.number().positive().max(1000000),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
  stripeSessionId: z.string().min(1),
})

export const uploadFileSchema = z.object({
  size: z.number().max(50 * 1024 * 1024), // 50MB max
  type: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff']),
})
```

Apply validation to all API routes before database operations.

### Acceptance Criteria

- [ ] Zod installed and validation schemas created
- [ ] All POST/PUT endpoints validate input
- [ ] File uploads validate type, size, and magic bytes
- [ ] Invalid input returns 400 with descriptive errors
- [ ] No unvalidated user input reaches database

### Testing

1. POST photo with missing title → Expect 400
2. POST order with negative price → Expect 400
3. Upload .exe file renamed to .jpg → Expect 400
4. Upload 100MB image → Expect 400

---

## Issue: Add security headers via middleware

**Labels:** `security`, `headers`
**Priority:** P1
**Estimated Effort:** 2 hours

### Summary

The application doesn't set security-related HTTP headers, leaving it vulnerable to clickjacking, MIME-sniffing, and XSS.

### Missing Headers

1. Content-Security-Policy (CSP)
2. X-Frame-Options
3. X-Content-Type-Options
4. Referrer-Policy
5. Strict-Transport-Security (HSTS)

### Proposed Solution

Add security headers in middleware:

```javascript
// middleware.js (update existing file)
export function middleware(req) {
  const res = NextResponse.next()

  // Content Security Policy
  res.headers.set('Content-Security-Policy', "default-src 'self'; ...")

  // Clickjacking protection
  res.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME-sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer policy
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // HSTS (production only)
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return res
}
```

### Acceptance Criteria

- [ ] All security headers configured
- [ ] CSP allows necessary resources but blocks others
- [ ] Headers present in all responses
- [ ] Admin dashboard works correctly with headers

### Testing

1. Check response headers in DevTools
2. Attempt to embed site in iframe → Should be blocked
3. Use Mozilla Observatory to scan site

---

## Issue: Implement audit logging for admin actions

**Labels:** `security`, `logging`, `compliance`
**Priority:** P2
**Estimated Effort:** 6 hours

### Summary

No audit trail exists for admin actions (photo deletions, order modifications, etc.). In case of security breach or accidental data loss, there's no record of who did what and when.

### Proposed Solution

Create AuditLog model and logging utility:

```javascript
// models/AuditLog.js
const auditLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: String,
  action: {
    type: String,
    required: true,
    enum: [
      'photo.create', 'photo.update', 'photo.delete',
      'category.create', 'category.update', 'category.delete',
      'order.create', 'order.update', 'order.delete',
      // ... etc
    ],
  },
  resourceType: { type: String, required: true },
  resourceId: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now, index: true },
})
```

Add logging to all admin mutation routes:

```javascript
await logAuditEvent({
  userId: session.user.id,
  userEmail: session.user.email,
  action: 'photo.delete',
  resourceType: 'Photo',
  resourceId: photoId,
  details: { title: photo.title },
  req,
})
```

Create admin page to view audit logs.

### Acceptance Criteria

- [ ] AuditLog model created
- [ ] All admin mutations log audit events
- [ ] Logs include userId, action, timestamp, IP, resource details
- [ ] Audit log viewer page accessible to admins
- [ ] Logs queryable by user, action type, date range
- [ ] Logs retained for at least 90 days

### Testing

1. Delete a photo → Check AuditLog for entry
2. Update order status → Verify audit log created
3. Query logs by userId → See only that user's actions

---

## Issue: Validate Stripe webhook signatures properly

**Labels:** `security`, `stripe`, `payments`
**Priority:** P1
**Estimated Effort:** 2 hours

### Summary

While Stripe webhook signatures are being verified, ensure the implementation is robust and includes proper error handling and idempotency.

### Current Implementation

**`app/api/webhooks/stripe/route.js`:**

The webhook handler verifies signatures but should also:
1. Handle duplicate events (idempotency)
2. Log all webhook events
3. Return 200 even on processing errors (to prevent Stripe retries)
4. Have timeout protection

### Proposed Enhancements

```javascript
export async function POST(req) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Check for duplicate events (idempotency)
  const existingEvent = await WebhookEvent.findOne({ eventId: event.id })
  if (existingEvent) {
    console.log(`Duplicate event ${event.id}, skipping`)
    return NextResponse.json({ received: true })
  }

  // Store event for idempotency
  await WebhookEvent.create({ eventId: event.id, processed: false })

  // Process event with timeout
  try {
    await Promise.race([
      processStripeEvent(event),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 25000)
      ),
    ])

    await WebhookEvent.updateOne(
      { eventId: event.id },
      { processed: true, processedAt: new Date() }
    )
  } catch (error) {
    console.error(`Failed to process event ${event.id}:`, error)
    // Still return 200 to prevent Stripe retries
    // Mark for manual review
    await WebhookEvent.updateOne(
      { eventId: event.id },
      { failed: true, error: error.message }
    )
  }

  return NextResponse.json({ received: true })
}
```

### Acceptance Criteria

- [ ] Webhook signature verification working
- [ ] Duplicate events detected and skipped
- [ ] All webhook events logged to database
- [ ] Processing timeout protection (25s max)
- [ ] Failed events marked for manual review
- [ ] Always returns 200 to Stripe

### Testing

1. Send test webhook from Stripe dashboard → Verify processing
2. Send same webhook twice → Second should be skipped
3. Simulate processing failure → Event marked as failed
4. Verify Stripe signature rejection for tampered payloads

---

## Summary Table

| Issue | Priority | Estimated Effort |
|-------|----------|------------------|
| Replace NEXT_PUBLIC_ADMIN_API_KEY | P0 | 4 hours |
| Implement rate limiting | P0 | 3 hours |
| Add CSRF protection | P0 | 3 hours |
| Add input validation (Zod) | P0 | 6 hours |
| Add security headers | P1 | 2 hours |
| Implement audit logging | P2 | 6 hours |
| Validate Stripe webhooks | P1 | 2 hours |

**Total estimated effort:** ~26 hours (3-4 days for one developer)

**Priority Summary:**
- **P0 (Must Fix):** 16 hours - Critical vulnerabilities
- **P1 (Should Fix):** 4 hours - Important security hardening
- **P2 (Nice to Have):** 6 hours - Compliance and forensics
