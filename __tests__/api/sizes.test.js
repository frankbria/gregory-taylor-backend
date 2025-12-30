/**
 * Tests for /api/sizes endpoint
 *
 * Tests CRUD operations:
 * - GET /api/sizes - List all sizes
 * - POST /api/sizes - Create a new size (authenticated)
 * - PUT /api/sizes/[id] - Update a size (authenticated)
 * - DELETE /api/sizes/[id] - Delete a size (authenticated)
 */

import { GET, POST } from '@/app/api/sizes/route'
import { PUT, DELETE } from '@/app/api/sizes/[id]/route'
import Size from '@/models/Size'
import {
  createMockRequest,
  createAuthenticatedRequest,
  getResponseBody,
  createTestSize,
} from '../utils/testHelpers'
import { setupDatabase, clearAllCollections, teardownDatabase } from '../utils/dbHelpers'

describe('/api/sizes', () => {
  beforeAll(async () => {
    await setupDatabase()
  })

  beforeEach(async () => {
    await clearAllCollections()
  })

  afterAll(async () => {
    await teardownDatabase()
  })

  describe('GET /api/sizes', () => {
    it('should return an empty array when no sizes exist', async () => {
      const request = createMockRequest('http://localhost:4010/api/sizes')
      const response = await GET(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0)
    })

    it('should return all sizes', async () => {
      // Create test sizes
      await Size.create({ name: '8x10', width: 8, height: 10, price: 25 })
      await Size.create({ name: '11x14', width: 11, height: 14, price: 35 })
      await Size.create({ name: '16x20', width: 16, height: 20, price: 50 })

      const request = createMockRequest('http://localhost:4010/api/sizes')
      const response = await GET(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.length).toBe(3)
    })

    it('should include CORS headers in response', async () => {
      const request = createMockRequest('http://localhost:4010/api/sizes', {
        headers: { 'Origin': 'http://localhost:3000' },
      })
      const response = await GET(request)

      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(true)
    })
  })

  describe('POST /api/sizes', () => {
    it('should create a new size when authenticated', async () => {
      const sizeData = { name: '8x10', width: 8, height: 10, price: 25 }
      const request = createAuthenticatedRequest('http://localhost:4010/api/sizes', {
        method: 'POST',
        body: sizeData,
      })

      const response = await POST(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(201)
      expect(data.name).toBe('8x10')
      expect(data.width).toBe(8)
      expect(data.height).toBe(10)
      expect(data.price).toBe(25)
      expect(data._id).toBeDefined()

      // Verify it was actually saved to DB
      const savedSize = await Size.findById(data._id)
      expect(savedSize).not.toBeNull()
      expect(savedSize.name).toBe('8x10')
    })

    it('should reject request without authentication', async () => {
      const sizeData = { name: '11x14', width: 11, height: 14, price: 35 }
      const request = createMockRequest('http://localhost:4010/api/sizes', {
        method: 'POST',
        body: sizeData,
      })

      const response = await POST(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should reject request with invalid token', async () => {
      const sizeData = { name: '16x20', width: 16, height: 20, price: 50 }
      const request = createMockRequest('http://localhost:4010/api/sizes', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer invalid-token' },
        body: sizeData,
      })

      const response = await POST(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(403)
      expect(data.error).toContain('Forbidden')
    })
  })

  describe('PUT /api/sizes/[id]', () => {
    it('should update a size when authenticated', async () => {
      // Create a size
      const size = await Size.create({ name: '8x10', width: 8, height: 10, price: 25 })

      const request = createAuthenticatedRequest(`http://localhost:4010/api/sizes/${size._id}`, {
        method: 'PUT',
        body: { name: '8x10 Updated', price: 30 },
      })

      const response = await PUT(request, { params: { id: size._id.toString() } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.name).toBe('8x10 Updated')
      expect(data.price).toBe(30)

      // Verify it was actually updated in DB
      const updatedSize = await Size.findById(size._id)
      expect(updatedSize.name).toBe('8x10 Updated')
      expect(updatedSize.price).toBe(30)
    })

    it('should reject update without authentication', async () => {
      const size = await Size.create({ name: '11x14', width: 11, height: 14, price: 35 })

      const request = createMockRequest(`http://localhost:4010/api/sizes/${size._id}`, {
        method: 'PUT',
        body: { price: 40 },
      })

      const response = await PUT(request, { params: { id: size._id.toString() } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('DELETE /api/sizes/[id]', () => {
    it('should delete a size when authenticated', async () => {
      // Create a size
      const size = await Size.create({ name: '16x20', width: 16, height: 20, price: 50 })

      const request = createAuthenticatedRequest(`http://localhost:4010/api/sizes/${size._id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: size._id.toString() } })

      expect(response.status).toBe(204)

      // Verify it was actually deleted from DB
      const deletedSize = await Size.findById(size._id)
      expect(deletedSize).toBeNull()
    })

    it('should reject delete without authentication', async () => {
      const size = await Size.create({ name: '8x10', width: 8, height: 10, price: 25 })

      const request = createMockRequest(`http://localhost:4010/api/sizes/${size._id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: size._id.toString() } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })
})
