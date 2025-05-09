// backend/app/api/sizes/[id]/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Size from '@/models/Size'
import { adminAuth } from '@/lib/adminAuth'

export const PUT = adminAuth(async (req) => {
  await connectToDB()
  const body = await req.json()
  const updated = await Size.findByIdAndUpdate(req.id, body, { new: true })
  return Response.json(updated)
})

export const DELETE = adminAuth(async (req) => {
  await connectToDB()
  await Size.findByIdAndDelete(req.id)
  return new Response(null, { status: 204 })
})
