# Testing & Quality Issues - Backend

> **Priority: P0-P1 - Establish quality gates**
>
> Critical gap: Backend has ZERO test coverage. This is a production blocker.

---

## Issue: Set up Jest testing infrastructure

**Labels:** `testing`, `critical`, `infrastructure`
**Priority:** P0
**Estimated Effort:** 3 hours

### Summary

The backend has no testing framework installed. Need to set up Jest with appropriate configuration for Next.js API routes and MongoDB.

### Proposed Setup

```bash
npm install --save-dev jest @shelf/jest-mongodb supertest
```

**`jest.config.js`:**
```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: [
    'app/api/**/*.js',
    'lib/**/*.js',
    'models/**/*.js',
    '!**/*.test.js',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}
```

**`jest.setup.js`:**
```javascript
// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db'
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_xxx'
process.env.NEXT_PUBLIC_ADMIN_API_KEY = 'test-admin-key'
process.env.BETTER_AUTH_SECRET = 'test-secret'
```

**Add test scripts to `package.json`:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Acceptance Criteria

- [ ] Jest installed and configured
- [ ] MongoDB memory server for isolated tests
- [ ] Environment variables mocked
- [ ] Test scripts in package.json
- [ ] Coverage thresholds set to 80%

---

## Issue: Add API route tests for photos endpoints

**Labels:** `testing`, `api`
**Priority:** P0
**Estimated Effort:** 6 hours

### Summary

Photo CRUD endpoints have no tests. Need comprehensive tests for all photo operations.

### Proposed Tests

```javascript
// app/api/photos/__tests__/route.test.js
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import dbConnect from '@/lib/db'
import Photo from '@/models/Photo'
import Category from '@/models/Category'

jest.mock('@/lib/db')
jest.mock('@/models/Photo')
jest.mock('@/models/Category')

describe('GET /api/photos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns all photos with populated category', async () => {
    const mockPhotos = [
      {
        _id: '1',
        title: 'Test Photo',
        imageUrl: 'photo.jpg',
        category: { _id: 'cat1', name: 'Landscapes' },
      },
    ]

    Photo.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPhotos),
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/photos')
    const response = await GET(request)
    const data = await response.json()

    expect(data).toEqual(mockPhotos)
    expect(response.status).toBe(200)
  })

  it('handles database errors gracefully', async () => {
    Photo.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('DB Error')),
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/photos')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})

describe('POST /api/photos', () => {
  it('creates photo with valid data', async () => {
    const mockPhoto = {
      title: 'New Photo',
      imageUrl: 'new.jpg',
      publicID: 'new-photo',
      slug: 'new-photo',
    }

    Photo.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(mockPhoto),
    }))

    const request = new NextRequest('http://localhost:3000/api/photos', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-admin-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockPhoto),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.title).toBe('New Photo')
  })

  it('rejects unauthorized requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/photos', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('validates required fields', async () => {
    // Test missing title, imageUrl, etc.
  })
})
```

### Acceptance Criteria

- [ ] Tests for GET /api/photos
- [ ] Tests for POST /api/photos (with auth)
- [ ] Tests for GET /api/photos/[id]
- [ ] Tests for PUT /api/photos (update)
- [ ] Tests for DELETE /api/photos/[id] (with Cloudinary cleanup)
- [ ] Tests cover success and error cases
- [ ] Tests verify authorization requirements
- [ ] Achieve >80% coverage on photo routes

---

## Issue: Add Stripe webhook tests

**Labels:** `testing`, `payments`, `critical`
**Priority:** P0
**Estimated Effort:** 4 hours

### Summary

Stripe webhook handler has no tests. Given the payment implications, this is a critical gap.

### Proposed Tests

```javascript
// app/api/webhooks/stripe/__tests__/route.test.js
import { POST } from '../route'
import { NextRequest } from 'next/server'
import stripe from 'stripe'
import Order from '@/models/Order'

jest.mock('stripe')
jest.mock('@/models/Order')

describe('POST /api/webhooks/stripe', () => {
  const mockStripe = {
    webhooks: {
      constructEvent: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    stripe.mockReturnValue(mockStripe)
  })

  it('handles checkout.session.completed event', async () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          payment_intent: 'pi_123',
          payment_status: 'paid',
        },
      },
    }

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

    Order.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 })

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature',
      },
      body: JSON.stringify(mockEvent),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(Order.updateOne).toHaveBeenCalledWith(
      { stripeSessionId: 'cs_123' },
      expect.objectContaining({
        paymentStatus: 'paid',
        status: 'paid',
      })
    )
  })

  it('rejects invalid signatures', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'invalid',
      },
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('handles async_payment_failed event', async () => {
    // Test failure scenarios
  })

  it('handles checkout.session.expired event', async () => {
    // Test expiration
  })
})
```

### Acceptance Criteria

- [ ] Tests for all webhook event types
- [ ] Tests verify signature validation
- [ ] Tests confirm order status updates
- [ ] Tests handle database errors gracefully
- [ ] Tests verify payment_intent_id populated
- [ ] Achieve >80% coverage on webhook handler

---

## Issue: Add model validation tests

**Labels:** `testing`, `models`
**Priority:** P1
**Estimated Effort:** 3 hours

### Summary

Mongoose models have no tests. Need to verify schema validation, indexes, and virtual properties work correctly.

### Proposed Tests

```javascript
// models/__tests__/Photo.test.js
import mongoose from 'mongoose'
import Photo from '../Photo'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

afterEach(async () => {
  await Photo.deleteMany({})
})

describe('Photo Model', () => {
  it('creates photo with valid data', async () => {
    const photoData = {
      title: 'Test Photo',
      imageUrl: 'https://example.com/photo.jpg',
      publicID: 'test-photo',
      slug: 'test-photo',
    }

    const photo = new Photo(photoData)
    await photo.save()

    expect(photo._id).toBeDefined()
    expect(photo.title).toBe('Test Photo')
    expect(photo.featured).toBe(false) // Default value
  })

  it('requires title field', async () => {
    const photo = new Photo({
      imageUrl: 'photo.jpg',
      publicID: 'test',
      slug: 'test',
    })

    await expect(photo.save()).rejects.toThrow()
  })

  it('enforces unique publicID', async () => {
    const photoData = {
      title: 'Photo 1',
      imageUrl: 'photo.jpg',
      publicID: 'duplicate',
      slug: 'photo-1',
    }

    await Photo.create(photoData)

    const duplicate = new Photo({
      ...photoData,
      title: 'Photo 2',
      slug: 'photo-2',
    })

    await expect(duplicate.save()).rejects.toThrow(/duplicate/)
  })

  it('generates unique slug on conflict', async () => {
    // Test slug generation logic if implemented
  })

  it('populates category reference', async () => {
    // Test category population
  })
})
```

### Acceptance Criteria

- [ ] Tests for Photo model
- [ ] Tests for Order model
- [ ] Tests for Category model
- [ ] Tests verify required fields
- [ ] Tests verify unique constraints
- [ ] Tests verify defaults
- [ ] Tests verify indexes

---

## Issue: Add checkout route integration tests

**Labels:** `testing`, `integration`, `critical`
**Priority:** P0
**Estimated Effort:** 5 hours

### Summary

The checkout route orchestrates Stripe session creation and order persistence. Need integration tests to ensure this critical flow works correctly.

### Proposed Tests

```javascript
// app/api/checkout/__tests__/integration.test.js
import { POST } from '../route'
import { NextRequest } from 'next/server'
import stripe from 'stripe'
import Order from '@/models/Order'
import Photo from '@/models/Photo'
import Size from '@/models/Size'
import Frame from '@/models/Frame'
import Format from '@/models/Format'

// Mock Stripe
jest.mock('stripe')

describe('Checkout Integration', () => {
  beforeEach(async () => {
    // Seed database with test data
    await Photo.create({
      _id: 'photo123',
      title: 'Test Photo',
      imageUrl: 'photo.jpg',
      publicID: 'test',
      slug: 'test',
    })

    await Size.create({ name: 'Large', price: 30000 }) // $300
    await Frame.create({ style: 'Black', price: 5000 }) // $50
    await Format.create({ name: 'Canvas', price: 10000 }) // $100
  })

  it('creates Stripe session and order with correct total', async () => {
    const mockSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    }

    stripe.mockReturnValue({
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue(mockSession),
        },
      },
    })

    const requestBody = {
      items: [
        {
          productId: 'photo123',
          size: 'Large',
          frame: 'Black',
          format: 'Canvas',
          unitPrice: 45000, // Client sends $450
          quantity: 1,
        },
      ],
      userId: 'user123',
    }

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.sessionId).toBe('cs_test_123')

    // Verify order created
    const order = await Order.findOne({ stripeSessionId: 'cs_test_123' })
    expect(order).toBeTruthy()
    expect(order.totalAmount).toBe(45000) // $450 (server recalculated)
    expect(order.items).toHaveLength(1)
    expect(order.status).toBe('created')
    expect(order.paymentStatus).toBe('pending')
  })

  it('recalculates prices server-side', async () => {
    // Test price manipulation detection
  })

  it('handles Stripe API errors', async () => {
    stripe.mockReturnValue({
      checkout: {
        sessions: {
          create: jest.fn().mockRejectedValue(new Error('Stripe error')),
        },
      },
    })

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'photo123', quantity: 1 }],
        userId: 'user123',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
  })
})
```

### Acceptance Criteria

- [ ] Test full checkout flow (API → Stripe → Order)
- [ ] Test server-side price recalculation
- [ ] Test Stripe session creation
- [ ] Test order persistence
- [ ] Test error scenarios
- [ ] Achieve >80% coverage

---

## Issue: Add CI/CD testing pipeline

**Labels:** `testing`, `ci-cd`, `infrastructure`
**Priority:** P1
**Estimated Effort:** 3 hours

### Summary

Tests aren't run in CI/CD. Need to add test execution to GitHub Actions workflow.

### Proposed Solution

Update `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      # ... existing build steps ...

  deploy:
    needs: build
    # Only deploy if tests pass
    # ... existing deploy steps ...
```

### Acceptance Criteria

- [ ] Tests run on every push and PR
- [ ] Failing tests block deployment
- [ ] Coverage report uploaded to Codecov
- [ ] Build only runs if tests pass

---

## Summary Table

| Issue | Priority | Estimated Effort |
|-------|----------|------------------|
| Set up Jest | P0 | 3 hours |
| Photo API tests | P0 | 6 hours |
| Stripe webhook tests | P0 | 4 hours |
| Model tests | P1 | 3 hours |
| Checkout integration tests | P0 | 5 hours |
| CI/CD pipeline | P1 | 3 hours |

**Total estimated effort:** ~24 hours (3 days)

**CRITICAL:** Backend currently has **0% test coverage**. This is a production blocker. Prioritize P0 issues immediately.
