// backend/app/api/prices/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Price from '@/models/Price'
import Size from '@/models/Size'

export async function GET() {
  await connectToDB()
  const prices = await Price.find().populate('sizeId')
  return Response.json(prices)
}

export async function POST(req) {
  await connectToDB()
  const body = await req.json()
  const newPrice = await Price.create(body)
  return Response.json(newPrice, { status: 201 })
}
