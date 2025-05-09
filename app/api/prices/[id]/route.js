// backend/app/api/prices/[id]/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Price from '@/models/Price'
import { adminAuth } from '@/lib/adminAuth'

export const PUT = adminAuth(async (req) => {
  await connectToDB()
  const body = await req.json()
  const updated = await Price.findByIdAndUpdate(req.id, body, { new: true })
  return Response.json(updated)
})

export const DELETE = adminAuth(async (req) => {
  await connectToDB()
  await Price.findByIdAndDelete(req.id)
  return new Response(null, { status: 204 })
})
