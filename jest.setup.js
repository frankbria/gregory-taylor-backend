// Jest setup file - runs before each test file

// Increase timeout for database operations
jest.setTimeout(10000)

// Mock environment variables
// globalSetup's globals don't reach test workers, but its process.env (the memory server) does
process.env.MONGODB_URI = global.__MONGO_URI__ || process.env.MONGODB_URI || 'mongodb://localhost:27017/test'
// Tests wipe every collection; never let that reach a real database
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(process.env.MONGODB_URI)) {
  throw new Error(`Refusing to run tests against non-local MONGODB_URI`)
}
process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.ADMIN_API_KEY = 'test-admin-api-key'
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy'
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_dummy'
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-api-key'
process.env.CLOUDINARY_API_SECRET = 'test-api-secret'
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:4010'

// Suppress console logs during tests (optional - comment out if you need to debug)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// }
