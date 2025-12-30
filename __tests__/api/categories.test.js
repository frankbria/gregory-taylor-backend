/**
 * Tests for /api/categories endpoint
 *
 * Tests CRUD operations:
 * - GET /api/categories - List all categories with featured images
 * - POST /api/categories - Create a new category (authenticated)
 * - PUT /api/categories/[id] - Update a category (authenticated)
 * - DELETE /api/categories/[id] - Delete a category (authenticated)
 * - OPTIONS /api/categories - CORS preflight
 */

import { GET, POST, OPTIONS } from '@/app/api/categories/route'
import { PUT, DELETE } from '@/app/api/categories/[id]/route'
import Category from '@/models/Category'
import Photo from '@/models/Photo'
import {
  createMockRequest,
  createAuthenticatedRequest,
  getResponseBody,
  createTestCategory,
  createTestPhoto,
} from '../utils/testHelpers'
import { setupDatabase, clearAllCollections, teardownDatabase } from '../utils/dbHelpers'

describe('/api/categories', () => {
  beforeAll(async () => {
    await setupDatabase()
  })

  beforeEach(async () => {
    await clearAllCollections()
  })

  afterAll(async () => {
    await teardownDatabase()
  })

  describe('GET /api/categories', () => {
    it('should return an empty array when no categories exist', async () => {
      const request = createMockRequest('http://localhost:4010/api/categories')
      const response = await GET(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0)
    })

    it('should return all categories sorted by name', async () => {
      // Create test categories - use helper defaults which are unique
      const cat1 = await Category.create({ ...createTestCategory(), name: `AAA-${Date.now()}-${Math.random()}`, slug: `aaa-${Date.now()}-${Math.random()}` })
      const cat2 = await Category.create({ ...createTestCategory(), name: `BBB-${Date.now()}-${Math.random()}`, slug: `bbb-${Date.now()}-${Math.random()}` })
      const cat3 = await Category.create({ ...createTestCategory(), name: `CCC-${Date.now()}-${Math.random()}`, slug: `ccc-${Date.now()}-${Math.random()}` })

      const request = createMockRequest('http://localhost:4010/api/categories')
      const response = await GET(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.length).toBe(3)
      // Verify sorting by checking alphabetical order
      expect(data[0].name.startsWith('AAA')).toBe(true)
      expect(data[1].name.startsWith('BBB')).toBe(true)
      expect(data[2].name.startsWith('CCC')).toBe(true)
    })

    it('should include featured image URL when a featured photo exists', async () => {
      // Create category with unique name using helper defaults
      const category = await Category.create(createTestCategory())

      // Create a featured photo with publicID for Cloudinary transformation
      const featuredPhoto = await Photo.create(
        createTestPhoto(category._id, {
          featured: true,
          publicID: 'test-photos/featured-wildlife',
          imageUrl: 'https://test.cloudinary.com/featured-wildlife.jpg',
        })
      )

      const request = createMockRequest('http://localhost:4010/api/categories')
      const response = await GET(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.length).toBe(1)
      // Verify that featuredImage is a Cloudinary URL (transformed from publicID)
      expect(data[0].featuredImage).toBeDefined()
      expect(data[0].featuredImage).toContain('cloudinary.com')
      expect(data[0].featuredImage).toContain('test-photos/featured-wildlife')
    })

    it('should have null featuredImage when no featured photo exists', async () => {
      // Create category without featured photo
      await Category.create(createTestCategory())

      const request = createMockRequest('http://localhost:4010/api/categories')
      const response = await GET(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.length).toBe(1)
      expect(data[0].featuredImage).toBeNull()
    })

    it('should include CORS headers in response', async () => {
      const request = createMockRequest('http://localhost:4010/api/categories', {
        headers: { 'Origin': 'http://localhost:3000' },
      })
      const response = await GET(request)

      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(true)
    })
  })

  describe('POST /api/categories', () => {
    it('should create a new category when authenticated', async () => {
      const categoryData = createTestCategory({ name: 'Portraits', slug: 'portraits' })
      const request = createAuthenticatedRequest('http://localhost:4010/api/categories', {
        method: 'POST',
        body: categoryData,
      })

      const response = await POST(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(201)
      expect(data.name).toBe('Portraits')
      expect(data.slug).toBe('portraits')
      expect(data._id).toBeDefined()

      // Verify it was actually saved to DB
      const savedCategory = await Category.findById(data._id)
      expect(savedCategory).not.toBeNull()
      expect(savedCategory.name).toBe('Portraits')
    })

    it('should reject request without authentication', async () => {
      const categoryData = createTestCategory({ name: 'Landscapes', slug: 'landscapes' })
      const request = createMockRequest('http://localhost:4010/api/categories', {
        method: 'POST',
        body: categoryData,
      })

      const response = await POST(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should reject request with invalid token', async () => {
      const categoryData = createTestCategory({ name: 'Wildlife', slug: 'wildlife' })
      const request = createMockRequest('http://localhost:4010/api/categories', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer invalid-token' },
        body: categoryData,
      })

      const response = await POST(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(403)
      expect(data.error).toContain('Forbidden')
    })

    it('should enforce unique name constraint', async () => {
      // Create first category with unique name
      const uniqueName = `Nature-${Date.now()}-${Math.random()}`
      const categoryData = createTestCategory({ name: uniqueName, slug: `nature-${Date.now()}-${Math.random()}` })
      await Category.create(categoryData)

      // Try to create duplicate with same name but different slug
      const request = createAuthenticatedRequest('http://localhost:4010/api/categories', {
        method: 'POST',
        body: { name: uniqueName, slug: `nature-2-${Date.now()}-${Math.random()}` },
      })

      // This should fail at the database level due to unique constraint
      const response = await POST(request)
      expect(response.status).toBe(500)
    })
  })

  describe('PUT /api/categories/[id]', () => {
    it('should update a category when authenticated', async () => {
      // Create a category with unique names using helper
      const category = await Category.create(createTestCategory())

      const newName = `Updated-${Date.now()}-${Math.random()}`
      const newSlug = `updated-${Date.now()}-${Math.random()}`

      const request = createAuthenticatedRequest(`http://localhost:4010/api/categories/${category._id}`, {
        method: 'PUT',
        body: { name: newName, slug: newSlug },
      })

      const response = await PUT(request, { params: { id: category._id.toString() } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.name).toBe(newName)
      expect(data.slug).toBe(newSlug)

      // Verify it was actually updated in DB
      const updatedCategory = await Category.findById(category._id)
      expect(updatedCategory.name).toBe(newName)
    })

    it('should reject update without authentication', async () => {
      const category = await Category.create(createTestCategory())

      const request = createMockRequest(`http://localhost:4010/api/categories/${category._id}`, {
        method: 'PUT',
        body: { name: 'Updated Name', slug: 'updated' },
      })

      const response = await PUT(request, { params: { id: category._id.toString() } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('DELETE /api/categories/[id]', () => {
    it('should delete a category when authenticated', async () => {
      // Create a category
      const category = await Category.create(createTestCategory())

      const request = createAuthenticatedRequest(`http://localhost:4010/api/categories/${category._id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: category._id.toString() } })

      expect(response.status).toBe(204)

      // Verify it was actually deleted from DB
      const deletedCategory = await Category.findById(category._id)
      expect(deletedCategory).toBeNull()
    })

    it('should reject delete without authentication', async () => {
      const category = await Category.create(createTestCategory())

      const request = createMockRequest(`http://localhost:4010/api/categories/${category._id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: category._id.toString() } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('OPTIONS /api/categories', () => {
    it('should handle CORS preflight request', async () => {
      const request = createMockRequest('http://localhost:4010/api/categories', {
        method: 'OPTIONS',
        headers: { 'Origin': 'http://localhost:3000' },
      })

      const response = await OPTIONS(request)

      expect(response.status).toBe(204)
      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(true)
    })
  })
})
