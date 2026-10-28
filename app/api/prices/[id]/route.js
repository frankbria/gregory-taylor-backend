// backend/app/api/prices/[id]/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Price from '@/models/Price'
import { adminAuth } from '@/lib/adminAuth'

export const PUT = adminAuth(async (req, { params }) => {
  await connectToDB()
  const body = await req.json()
  const updated = await Price.findByIdAndUpdate(params.id, body, { new: true, runValidators: true })
  if (!updated) return Response.json({ error: 'Price not found' }, { status: 404 })
  return Response.json(updated)
})

export const DELETE = adminAuth(async (req, { params }) => {
  await connectToDB()
  await Price.findByIdAndDelete(params.id)
  return new Response(null, { status: 204 })
})
