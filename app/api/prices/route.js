// backend/app/api/prices/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Price from '@/models/Price'
import Size from '@/models/Size'
import { adminAuth } from '@/lib/adminAuth'
import { corsHeaders } from '@/lib/utils'

export async function GET() {
  await connectToDB()
  const prices = await Price.find().populate('sizeId')
  return Response.json(prices, { headers: corsHeaders() })
}

export const POST = adminAuth(async (req) => {
  await connectToDB()
  const body = await req.json()
  const newPrice = await Price.create(body)
  return Response.json(newPrice, { status: 201 })
})
