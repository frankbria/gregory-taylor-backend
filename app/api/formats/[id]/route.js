// backend/app/api/formats/[id]/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Format from '@/models/Format'
import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/adminAuth'
import { corsHeaders } from '@/lib/utils'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid format ID' },
        { status: 400, headers: corsHeaders(request) }
      )
    }

    await connectToDB()
    const format = await Format.findById(params.id)

    if (!format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404, headers: corsHeaders(request) }
      )
    }

    return NextResponse.json(format, { headers: corsHeaders(request) })
  } catch (error) {
    console.error('Error fetching format:', error)
    return NextResponse.json(
      { error: 'Failed to fetch format' },
      { status: 500, headers: corsHeaders(request) }
    )
  }
}

export const PUT = adminAuth(async (req, { params }) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid format ID' },
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

    // Attempt to update the format
    const updatedFormat = await Format.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true, context: 'query' }
    )

    // Check if format was found
    if (!updatedFormat) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404, headers: corsHeaders(req) }
      )
    }

    return NextResponse.json(updatedFormat, { headers: corsHeaders(req) })
  } catch (error) {
    console.error('Error updating format:', error)
    return NextResponse.json(
      { error: 'Failed to update format', details: error.message },
      { status: 500, headers: corsHeaders(req) }
    )
  }
})

export const DELETE = adminAuth(async (req, { params }) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid format ID' },
        { status: 400, headers: corsHeaders(req) }
      )
    }

    await connectToDB()

    // Attempt to delete the format
    const deleted = await Format.findByIdAndDelete(params.id)

    // Check if format was found
    if (!deleted) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404, headers: corsHeaders(req) }
      )
    }

    return NextResponse.json({ message: 'Format deleted successfully' }, { headers: corsHeaders(req) })
  } catch (error) {
    console.error('Error deleting format:', error)
    return NextResponse.json(
      { error: 'Failed to delete format' },
      { status: 500, headers: corsHeaders(req) }
    )
  }
})