// backend/app/api/sizes/[id]/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Size from '@/models/Size'
import { adminAuth } from '@/lib/adminAuth'
import { corsHeaders } from '@/lib/utils'
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

export const PUT = adminAuth(async (req, { params }) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid size ID' },
        { status: 400, headers: corsHeaders(req) }
      )
    }

    await connectToDB()

    // Validate request body
    const body = await req.json()
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'Request body cannot be empty' },
        { status: 400, headers: corsHeaders(req) }
      )
    }

    // Attempt to update the size
    const updated = await Size.findByIdAndUpdate(params.id, body, { new: true })

    // Check if size was found
    if (!updated) {
      return NextResponse.json(
        { error: 'Size not found' },
        { status: 404, headers: corsHeaders(req) }
      )
    }

    return NextResponse.json(updated, { headers: corsHeaders(req) })
  } catch (error) {
    console.error('Error updating size:', error)
    return NextResponse.json(
      { error: 'Failed to update size' },
      { status: 500, headers: corsHeaders(req) }
    )
  }
})

export const DELETE = adminAuth(async (req, { params }) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid size ID' },
        { status: 400, headers: corsHeaders(req) }
      )
    }

    await connectToDB()

    // Attempt to delete the size
    const deleted = await Size.findByIdAndDelete(params.id)

    // Check if size was found
    if (!deleted) {
      return NextResponse.json(
        { error: 'Size not found' },
        { status: 404, headers: corsHeaders(req) }
      )
    }

    return new Response(null, { status: 204, headers: corsHeaders(req) })
  } catch (error) {
    console.error('Error deleting size:', error)
    return NextResponse.json(
      { error: 'Failed to delete size' },
      { status: 500, headers: corsHeaders(req) }
    )
  }
})
