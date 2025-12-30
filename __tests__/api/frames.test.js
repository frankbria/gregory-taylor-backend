/**
 * Tests for /api/frames endpoint
 *
 * Tests CRUD operations:
 * - GET /api/frames - List all frames (auto-creates defaults if empty)
 * - POST /api/frames - Create a new frame (authenticated)
 * - PUT /api/frames - Update a frame (authenticated, expects _id in body)
 * - GET /api/frames/[id] - Get a single frame
 * - DELETE /api/frames/[id] - Delete a frame
 */

import { GET as GET_ALL, POST, PUT } from '@/app/api/frames/route'
import { GET as GET_ONE, DELETE } from '@/app/api/frames/[id]/route'
import Frame from '@/models/Frame'
import {
  createMockRequest,
  createAuthenticatedRequest,
  getResponseBody,
} from '../utils/testHelpers'
import { setupDatabase, clearAllCollections, teardownDatabase } from '../utils/dbHelpers'

describe('/api/frames', () => {
  beforeAll(async () => {
    await setupDatabase()
  })

  beforeEach(async () => {
    await clearAllCollections()
  })

  afterAll(async () => {
    await teardownDatabase()
  })

  describe('GET /api/frames', () => {
    it('should create default frames when none exist', async () => {
      const request = createMockRequest('http://localhost:4010/api/frames')
      const response = await GET_ALL(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0].style).toBeDefined()
      expect(data[0].price).toBeDefined()
    })

    it('should return existing frames without creating defaults', async () => {
      // Create a custom frame
      await Frame.create({ style: 'Custom Gold', price: 125 })

      const request = createMockRequest('http://localhost:4010/api/frames')
      const response = await GET_ALL(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.length).toBe(1)
      expect(data[0].style).toBe('Custom Gold')
      expect(data[0].price).toBe(125)
    })

    it('should include CORS headers in response', async () => {
      const request = createMockRequest('http://localhost:4010/api/frames', {
        headers: { 'Origin': 'http://localhost:3000' },
      })
      const response = await GET_ALL(request)

      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(true)
    })
  })

  describe('POST /api/frames', () => {
    it('should create a new frame when authenticated', async () => {
      const frameData = { style: 'Bronze', price: 85 }
      const request = createAuthenticatedRequest('http://localhost:4010/api/frames', {
        method: 'POST',
        body: frameData,
      })

      const response = await POST(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(201)
      expect(data.style).toBe('Bronze')
      expect(data.price).toBe(85)
      expect(data._id).toBeDefined()

      // Verify it was actually saved to DB
      const savedFrame = await Frame.findById(data._id)
      expect(savedFrame).not.toBeNull()
      expect(savedFrame.style).toBe('Bronze')
    })

    it('should reject request without authentication', async () => {
      const frameData = { style: 'Silver', price: 90 }
      const request = createMockRequest('http://localhost:4010/api/frames', {
        method: 'POST',
        body: frameData,
      })

      const response = await POST(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should enforce unique style constraint', async () => {
      // Create first frame
      await Frame.create({ style: 'Mahogany', price: 110 })

      // Try to create duplicate
      const request = createAuthenticatedRequest('http://localhost:4010/api/frames', {
        method: 'POST',
        body: { style: 'Mahogany', price: 115 },
      })

      // This should fail at the database level due to unique constraint
      const response = await POST(request)
      expect(response.status).toBe(500)
    })
  })

  describe('PUT /api/frames', () => {
    it('should update a frame when authenticated', async () => {
      // Create a frame
      const frame = await Frame.create({ style: 'Oak', price: 95 })

      const request = createAuthenticatedRequest('http://localhost:4010/api/frames', {
        method: 'PUT',
        body: { _id: frame._id.toString(), style: 'Oak Updated', price: 100 },
      })

      const response = await PUT(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.style).toBe('Oak Updated')
      expect(data.price).toBe(100)

      // Verify it was actually updated in DB
      const updatedFrame = await Frame.findById(frame._id)
      expect(updatedFrame.style).toBe('Oak Updated')
      expect(updatedFrame.price).toBe(100)
    })

    it('should return 400 if _id is missing', async () => {
      const request = createAuthenticatedRequest('http://localhost:4010/api/frames', {
        method: 'PUT',
        body: { style: 'Pine', price: 70 },
      })

      const response = await PUT(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should reject update without authentication', async () => {
      const frame = await Frame.create({ style: 'Cedar', price: 80 })

      const request = createMockRequest('http://localhost:4010/api/frames', {
        method: 'PUT',
        body: { _id: frame._id.toString(), price: 85 },
      })

      const response = await PUT(request)
      const data = await getResponseBody(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('GET /api/frames/[id]', () => {
    it('should return a single frame by ID', async () => {
      const frame = await Frame.create({ style: 'Bamboo', price: 65 })

      const request = createMockRequest(`http://localhost:4010/api/frames/${frame._id}`)
      const response = await GET_ONE(request, { params: { id: frame._id.toString() } })
      const data = await getResponseBody(response)

      expect(response.status).toBe(200)
      expect(data.style).toBe('Bamboo')
      expect(data.price).toBe(65)
    })

    it('should return 404 for non-existent frame', async () => {
      const fakeId = '507f1f77bcf86cd799439011' // Valid MongoDB ObjectId format
      const request = createMockRequest(`http://localhost:4010/api/frames/${fakeId}`)
      const response = await GET_ONE(request, { params: { id: fakeId } })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/frames/[id]', () => {
    it('should delete a frame', async () => {
      const frame = await Frame.create({ style: 'Maple', price: 105 })

      const request = createMockRequest(`http://localhost:4010/api/frames/${frame._id}`, {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: frame._id.toString() } })

      expect(response.status).toBe(200)

      // Verify it was actually deleted from DB
      const deletedFrame = await Frame.findById(frame._id)
      expect(deletedFrame).toBeNull()
    })

    it('should return 404 when deleting non-existent frame', async () => {
      const fakeId = '507f1f77bcf86cd799439011'
      const request = createMockRequest(`http://localhost:4010/api/frames/${fakeId}`, {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: fakeId } })

      expect(response.status).toBe(404)
    })
  })
})
