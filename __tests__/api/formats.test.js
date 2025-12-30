/**
 * Tests for /api/formats endpoint
 *
 * Tests CRUD operations:
 * - GET /api/formats - List all formats (auto-creates defaults if empty)
 * - POST /api/formats - Create a new format (authenticated)
 * - PUT /api/formats - Update a format (authenticated, expects _id in body)
 * - GET /api/formats/[id] - Get a single format
 * - PUT /api/formats/[id] - Update a format (authenticated, params-based)
 * - DELETE /api/formats/[id] - Delete a format (authenticated)
 */

import { GET as GET_ALL, POST, PUT as PUT_BODY } from '@/app/api/formats/route'
import { GET as GET_ONE, PUT, DELETE } from '@/app/api/formats/[id]/route'
import Format from '@/models/Format'
import {
  createMockRequest,
  createAuthenticatedRequest,
  getResponseBody,
} from '../utils/testHelpers'
import { setupDatabase, clearAllCollections, teardownDatabase } from '../utils/dbHelpers'

describe('/api/formats', () => {
  beforeAll(async () => {
    await setupDatabase()
  })

  beforeEach(async () => {
    await clearAllCollections()
  })

  afterAll(async () => {
    await teardownDatabase()
  })

  describe('GET /api/formats', () => {
    it('should create default formats when none exist', async () => {
      const request = createMockRequest('http://localhost:4010/api/formats')
      const response = await GET_ALL(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0].name).toBeDefined()
      expect(data[0].price).toBeDefined()
    })

    it('should return existing formats without creating defaults', async () => {
      // Create a custom format
      await Format.create({ name: 'Wood Print', price: 175 })

      const request = createMockRequest('http://localhost:4010/api/formats')
      const response = await GET_ALL(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.length).toBe(1)
      expect(data[0].name).toBe('Wood Print')
      expect(data[0].price).toBe(175)
    })

    it('should include CORS headers in response', async () => {
      const request = createMockRequest('http://localhost:4010/api/formats', {
        headers: { 'Origin': 'http://localhost:3000' },
      })
      const response = await GET_ALL(request)

      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(true)
    })
  })

  describe('POST /api/formats', () => {
    it('should create a new format when authenticated', async () => {
      const formatData = { name: 'Glass', price: 225 }
      const request = createAuthenticatedRequest('http://localhost:4010/api/formats', {
        method: 'POST',
        body: formatData,
      })

      const response = await POST(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(201)
      expect(data.name).toBe('Glass')
      expect(data.price).toBe(225)
      expect(data._id).toBeDefined()

      // Verify it was actually saved to DB
      const savedFormat = await Format.findById(data._id)
      expect(savedFormat).not.toBeNull()
      expect(savedFormat.name).toBe('Glass')
    })

    it('should reject request without authentication', async () => {
      const formatData = { name: 'Ceramic', price: 180 }
      const request = createMockRequest('http://localhost:4010/api/formats', {
        method: 'POST',
        body: formatData,
      })

      const response = await POST(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should enforce unique name constraint', async () => {
      // Create first format
      await Format.create({ name: 'Fabric', price: 90 })

      // Try to create duplicate
      const request = createAuthenticatedRequest('http://localhost:4010/api/formats', {
        method: 'POST',
        body: { name: 'Fabric', price: 95 },
      })

      // This should fail at the database level due to unique constraint
      const response = await POST(request)
      expect(response.status).toBe(500)
    })
  })

  describe('PUT /api/formats (body-based)', () => {
    it('should update a format when authenticated', async () => {
      // Create a format
      const format = await Format.create({ name: 'Vinyl', price: 60 })

      const request = createAuthenticatedRequest('http://localhost:4010/api/formats', {
        method: 'PUT',
        body: { _id: format._id.toString(), name: 'Vinyl Updated', price: 65 },
      })

      const response = await PUT_BODY(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.name).toBe('Vinyl Updated')
      expect(data.price).toBe(65)

      // Verify it was actually updated in DB
      const updatedFormat = await Format.findById(format._id)
      expect(updatedFormat.name).toBe('Vinyl Updated')
      expect(updatedFormat.price).toBe(65)
    })

    it('should return 400 if _id is missing', async () => {
      const request = createAuthenticatedRequest('http://localhost:4010/api/formats', {
        method: 'PUT',
        body: { name: 'Silk', price: 120 },
      })

      const response = await PUT_BODY(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should reject update without authentication', async () => {
      const format = await Format.create({ name: 'Linen', price: 85 })

      const request = createMockRequest('http://localhost:4010/api/formats', {
        method: 'PUT',
        body: { _id: format._id.toString(), price: 90 },
      })

      const response = await PUT_BODY(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('GET /api/formats/[id]', () => {
    it('should return a single format by ID', async () => {
      const format = await Format.create({ name: 'Aluminum', price: 140 })

      const request = createMockRequest(`http://localhost:4010/api/formats/${format._id}`)
      const response = await GET_ONE(request, { params: { id: format._id.toString() } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.name).toBe('Aluminum')
      expect(data.price).toBe(140)
    })

    it('should return 404 for non-existent format', async () => {
      const fakeId = '507f1f77bcf86cd799439011' // Valid MongoDB ObjectId format
      const request = createMockRequest(`http://localhost:4010/api/formats/${fakeId}`)
      const response = await GET_ONE(request, { params: { id: fakeId } })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/formats/[id] (params-based)', () => {
    it('should update a format when authenticated', async () => {
      const format = await Format.create({ name: 'Plastic', price: 40 })

      const request = createAuthenticatedRequest(`http://localhost:4010/api/formats/${format._id}`, {
        method: 'PUT',
        body: { name: 'Plastic Updated', price: 45 },
      })

      const response = await PUT(request, { params: { id: format._id.toString() } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.name).toBe('Plastic Updated')
      expect(data.price).toBe(45)

      // Verify it was actually updated in DB
      const updatedFormat = await Format.findById(format._id)
      expect(updatedFormat.name).toBe('Plastic Updated')
    })

    it('should reject update without authentication', async () => {
      const format = await Format.create({ name: 'Cardboard', price: 20 })

      const request = createMockRequest(`http://localhost:4010/api/formats/${format._id}`, {
        method: 'PUT',
        body: { price: 25 },
      })

      const response = await PUT(request, { params: { id: format._id.toString() } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('DELETE /api/formats/[id]', () => {
    it('should delete a format when authenticated', async () => {
      const format = await Format.create({ name: 'Cork', price: 55 })

      const request = createAuthenticatedRequest(`http://localhost:4010/api/formats/${format._id}`, {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: format._id.toString() } })

      expect(response.status).toBe(200)

      // Verify it was actually deleted from DB
      const deletedFormat = await Format.findById(format._id)
      expect(deletedFormat).toBeNull()
    })

    it('should reject delete without authentication', async () => {
      const format = await Format.create({ name: 'Foam', price: 30 })

      const request = createMockRequest(`http://localhost:4010/api/formats/${format._id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: format._id.toString() } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return 404 when deleting non-existent format', async () => {
      const fakeId = '507f1f77bcf86cd799439011'
      const request = createAuthenticatedRequest(`http://localhost:4010/api/formats/${fakeId}`, {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: fakeId } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })
  })
})
