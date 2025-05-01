// backend/app/api/frames/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Frame from '@/models/Frame'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET all frames
export async function GET() {
  try {
    await connectToDB()
    
    // Check if there are any frames
    const frameCount = await Frame.countDocuments()
    
    // If no frames exist, create some default frames
    if (frameCount === 0) {
      console.log('No frames found, creating default frames')
      const defaultFrames = [
        { style: 'Black', price: 50 },
        { style: 'White', price: 50 },
        { style: 'Natural Wood', price: 75 },
        { style: 'Walnut', price: 100 }
      ]
      
      await Frame.insertMany(defaultFrames)
      console.log('Default frames created')
    }
    
    // Fetch all frames
    const frames = await Frame.find().sort({ style: 1 })
    console.log(`Found ${frames.length} frames`)
    
    return NextResponse.json(frames)
  } catch (error) {
    console.error('Error fetching frames:', error)
    return NextResponse.json(
      { error: 'Failed to fetch frames', details: error.message },
      { status: 500 }
    )
  }
}

// POST a new frame
export async function POST(req) {
  try {
    await connectToDB()
    const body = await req.json()
    
    const frame = await Frame.create(body)
    return NextResponse.json(frame, { status: 201 })
  } catch (error) {
    console.error('Error creating frame:', error)
    return NextResponse.json(
      { error: 'Failed to create frame', details: error.message },
      { status: 500 }
    )
  }
}

// PUT update a frame
export async function PUT(req) {
  try {
    await connectToDB()
    const body = await req.json()
    
    if (!body._id) {
      return NextResponse.json({ error: 'Frame ID is required' }, { status: 400 })
    }
    
    const frame = await Frame.findByIdAndUpdate(
      body._id,
      { style: body.style, price: body.price },
      { new: true, runValidators: true }
    )
    
    if (!frame) {
      return NextResponse.json({ error: 'Frame not found' }, { status: 404 })
    }
    
    return NextResponse.json(frame)
  } catch (error) {
    console.error('Error updating frame:', error)
    return NextResponse.json(
      { error: 'Failed to update frame', details: error.message },
      { status: 500 }
    )
  }
} 