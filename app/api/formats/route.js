// backend/app/api/formats/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Format from '@/models/Format'
import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/adminAuth'
import { corsHeaders } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET all formats
export async function GET(req) {
  try {
    await connectToDB()
    
    // Check if there are any formats
    const formatCount = await Format.countDocuments()
    
    // If no formats exist, create some default formats
    if (formatCount === 0) {
      console.log('No formats found, creating default formats')
      const defaultFormats = [
        { name: 'Canvas', price: 100 },
        { name: 'Metal', price: 150 },
        { name: 'Acrylic', price: 200 },
        { name: 'Paper', price: 50 }
      ]
      
      await Format.insertMany(defaultFormats)
      console.log('Default formats created')
    }
    
    // Fetch all formats
    const formats = await Format.find().sort({ name: 1 })
    console.log(`Found ${formats.length} formats`)
    
    return new Response(JSON.stringify(formats), {
      status: 200,
      headers: corsHeaders(req)
    })
  } catch (error) {
    console.error('Error fetching formats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch formats', details: error.message },
      { status: 500 }
    )
  }
}

// POST a new format
export const POST = adminAuth(async (req) => {
  try {
    await connectToDB()
    const body = await req.json()
    
    const format = await Format.create(body)
    return NextResponse.json(format, { status: 201 })
  } catch (error) {
    console.error('Error creating format:', error)
    return NextResponse.json(
      { error: 'Failed to create format', details: error.message },
      { status: 500 }
    )
  }
})

// PUT update a format
export const PUT = adminAuth(async (req) => {
  try {
    await connectToDB()
    const body = await req.json()
    
    if (!body._id) {
      return NextResponse.json({ error: 'Format ID is required' }, { status: 400 })
    }
    
    const format = await Format.findByIdAndUpdate(
      body._id,
      { name: body.name, price: body.price },
      { new: true, runValidators: true }
    )
    
    if (!format) {
      return NextResponse.json({ error: 'Format not found' }, { status: 404 })
    }
    
    return NextResponse.json(format)
  } catch (error) {
    console.error('Error updating format:', error)
    return NextResponse.json(
      { error: 'Failed to update format', details: error.message },
      { status: 500 }
    )
  }
})