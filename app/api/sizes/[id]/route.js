// backend/app/api/sizes/[id]/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Size from '@/models/Size'
import { adminAuth } from '@/lib/adminAuth'
import { corsHeaders } from '@/lib/utils'
import { NextResponse } from 'next/server'

export const PUT = adminAuth(async (req, { params }) => {
  await connectToDB()
  const body = await req.json()
  const updated = await Size.findByIdAndUpdate(params.id, body, { new: true })
  return NextResponse.json(updated, { headers: corsHeaders(req) })
})

export const DELETE = adminAuth(async (req, { params }) => {
  await connectToDB()
  await Size.findByIdAndDelete(params.id)
  return new Response(null, { status: 204, headers: corsHeaders(req) })
})
