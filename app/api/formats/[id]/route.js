// backend/app/api/formats/[id]/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Format from '@/models/Format'
import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    await connectToDB()
    const format = await Format.findById(params.id)
    
    if (!format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(format)
  } catch (error) {
    console.error('Error fetching format:', error)
    return NextResponse.json(
      { error: 'Error fetching format' },
      { status: 500 }
    )
  }
}

export const PUT = adminAuth(async (req) => {
  try {
    await connectToDB()
    const body = await req.json()

    const format = await Format.findById(req.id)
    if (!format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404 }
      )
    }

    const updatedFormat = await Format.findByIdAndUpdate(
      req.id,
      { $set: body },
      { new: true }
    )

    return NextResponse.json(updatedFormat)
  } catch (error) {
    console.error('Error updating format:', error)
    return NextResponse.json(
      { error: 'Error updating format' },
      { status: 500 }
    )
  }
})

export const DELETE = adminAuth(async (req) => {
  try {
    await connectToDB()
    const format = await Format.findById(req.id)

    if (!format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404 }
      )
    }

    await Format.findByIdAndDelete(req.id)
    return NextResponse.json({ message: 'Format deleted successfully' })
  } catch (error) {
    console.error('Error deleting format:', error)
    return NextResponse.json(
      { error: 'Error deleting format' },
      { status: 500 }
    )
  }
})