/**
 * Database Helper Utilities
 *
 * Provides database connection and cleanup utilities for tests
 */

import mongoose from 'mongoose'
import { connectToDB } from '@/lib/db'

/**
 * Connect to the test database
 * Call this in beforeAll() or beforeEach()
 */
export async function setupDatabase() {
  await connectToDB()
  // Indexes build in the background; wait so unique-constraint tests don't race them
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))
}

/**
 * Clear all data from all collections
 * Call this in beforeEach() to ensure clean state
 */
export async function clearAllCollections() {
  const collections = mongoose.connection.collections

  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

/**
 * Disconnect from the database
 * Call this in afterAll()
 */
export async function teardownDatabase() {
  await mongoose.connection.close()
}

/**
 * Helper to run a function within a clean database context
 * Automatically clears before and disconnects after
 */
export async function withCleanDatabase(testFn) {
  await setupDatabase()
  await clearAllCollections()

  try {
    await testFn()
  } finally {
    await teardownDatabase()
  }
}
