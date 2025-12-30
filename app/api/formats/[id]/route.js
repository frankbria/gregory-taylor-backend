// backend/app/api/formats/[id]/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Format from '@/models/Format'
import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/adminAuth'
import { corsHeaders } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
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
      { error: 'Error fetching format' },
      { status: 500, headers: corsHeaders(request) }
    )
  }
}

export const PUT = adminAuth(async (req, { params }) => {
  try {
    await connectToDB()
    const body = await req.json()

    const format = await Format.findById(params.id)
    if (!format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404, headers: corsHeaders(req) }
      )
    }

    const updatedFormat = await Format.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    )

    return NextResponse.json(updatedFormat, { headers: corsHeaders(req) })
  } catch (error) {
    console.error('Error updating format:', error)
    return NextResponse.json(
      { error: 'Error updating format' },
      { status: 500, headers: corsHeaders(req) }
    )
  }
})

export const DELETE = adminAuth(async (req, { params }) => {
  try {
    await connectToDB()
    const format = await Format.findById(params.id)

    if (!format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404, headers: corsHeaders(req) }
      )
    }

    await Format.findByIdAndDelete(params.id)
    return NextResponse.json({ message: 'Format deleted successfully' }, { headers: corsHeaders(req) })
  } catch (error) {
    console.error('Error deleting format:', error)
    return NextResponse.json(
      { error: 'Error deleting format' },
      { status: 500, headers: corsHeaders(req) }
    )
  }
})