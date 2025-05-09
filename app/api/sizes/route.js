// backend/app/api/sizes/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Size from '@/models/Size'
import { adminAuth } from '@/lib/adminAuth'

export async function GET() {
  await connectToDB()
  const sizes = await Size.find().sort({ createdAt: -1 })
  return Response.json(sizes)
}

export const POST = adminAuth(async (req) => {
  await connectToDB()
  const body = await req.json()
  const size = await Size.create(body)
  return Response.json(size, { status: 201 })
})
