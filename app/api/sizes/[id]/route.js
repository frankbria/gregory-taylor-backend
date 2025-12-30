// backend/app/api/sizes/[id]/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Size from '@/models/Size'
import Photo from '@/models/Photo'
import Price from '@/models/Price'
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
    const updated = await Size.findByIdAndUpdate(params.id, body, { new: true, runValidators: true, context: 'query' })

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
      { error: 'Failed to update size', details: error.message },
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

    // Check if size exists and has associated photos or prices
    const photoCount = await Photo.countDocuments({ sizes: params.id })
    const priceCount = await Price.countDocuments({ sizeId: params.id })

    if (photoCount > 0 || priceCount > 0) {
      const details = []
      if (photoCount > 0) {
        details.push(`${photoCount} photo(s)`)
      }
      if (priceCount > 0) {
        details.push(`${priceCount} price(s)`)
      }

      return NextResponse.json(
        {
          error: 'Cannot delete size with associated references',
          details: `This size has ${details.join(' and ')}. Please reassign or delete them first.`
        },
        { status: 409, headers: corsHeaders(req) }
      )
    }

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
