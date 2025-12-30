/**
 * Test Helper Utilities for API Testing
 *
 * Provides utilities for:
 * - Creating mock Next.js Request objects
 * - Authentication helpers
 * - Database cleanup
 */

import mongoose from 'mongoose'
import { NextRequest } from 'next/server'

/**
 * Create a mock Next.js Request object
 * @param {string} url - The request URL
 * @param {Object} options - Request options (method, headers, body)
 * @returns {NextRequest} - Mock request object
 */
export function createMockRequest(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
  } = options

  const requestInit = {
    method,
    headers: new Headers(headers),
  }

  // Add body for POST/PUT/PATCH requests
  if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    requestInit.body = JSON.stringify(body)
    requestInit.headers.set('Content-Type', 'application/json')
  }

  return new NextRequest(url, requestInit)
}

/**
 * Create an authenticated request with admin API key
 * @param {string} url - The request URL
 * @param {Object} options - Request options (method, body)
 * @returns {NextRequest} - Authenticated mock request
 */
export function createAuthenticatedRequest(url, options = {}) {
  const { headers = {}, ...restOptions } = options

  return createMockRequest(url, {
    ...restOptions,
    headers: {
      ...headers,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
    },
  })
}

/**
 * Parse response body as JSON
 * @param {Response} response - The response object
 * @returns {Promise<Object>} - Parsed JSON body
 */
export async function getResponseBody(response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch (e) {
    return text
  }
}

/**
 * Clear all collections in the test database
 * Useful for resetting state between tests
 */
export async function clearDatabase() {
  const collections = mongoose.connection.collections

  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

/**
 * Close database connection
 * Call this in afterAll() hooks
 */
export async function closeDatabase() {
  await mongoose.connection.close()
}

// Counter to ensure unique test data even within the same millisecond
let uniqueCounter = 0

/**
 * Create a test category object
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} - Category data
 */
export function createTestCategory(overrides = {}) {
  const timestamp = Date.now()
  const unique = uniqueCounter++
  return {
    name: `Test Category ${timestamp}-${unique}`,
    slug: `test-category-${timestamp}-${unique}`,
    ...overrides,
  }
}

/**
 * Create a test photo object
 * @param {string|ObjectId} categoryId - Category ID to associate with (ObjectId or string)
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} - Photo data
 */
export function createTestPhoto(categoryId, overrides = {}) {
  const timestamp = Date.now()
  const unique = uniqueCounter++
  return {
    title: `Test Photo ${timestamp}-${unique}`,
    slug: `test-photo-${timestamp}-${unique}`,
    category: categoryId, // Accept ObjectId or string
    imageUrl: `https://test.cloudinary.com/image-${timestamp}-${unique}.jpg`,
    publicID: `test-public-id-${timestamp}-${unique}`, // Note: capital D as per Photo model
    width: 1920,
    height: 1080,
    aspectRatio: 1.78,
    featured: false,
    fullLength: false,
    useDefaultSizes: true,
    // Optional fields with sensible defaults
    description: '',
    keywords: [],
    sizes: [],
    location: '',
    format: null,
    imageFormat: null,
    ...overrides,
  }
}

/**
 * Create a test size object
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} - Size data
 */
export function createTestSize(overrides = {}) {
  const timestamp = Date.now()
  return {
    name: `Test Size ${timestamp}`,
    width: 8,
    height: 10,
    unit: 'in',
    price: 25,
    ...overrides,
  }
}

/**
 * Create a test frame object
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} - Frame data
 */
export function createTestFrame(overrides = {}) {
  const timestamp = Date.now()
  return {
    style: `Test Frame ${timestamp}`,
    price: 50,
    ...overrides,
  }
}

/**
 * Create a test format object
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} - Format data
 */
export function createTestFormat(overrides = {}) {
  const timestamp = Date.now()
  return {
    name: `Test Format ${timestamp}`,
    price: 100,
    ...overrides,
  }
}
