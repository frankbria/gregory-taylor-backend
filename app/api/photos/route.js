// app/api/photos/route.js
import { NextResponse } from 'next/server'
import connectToDB from '@/lib/db'
import Photo from '@/models/Photo'
import Category from '@/models/Category'
import { generateSlug } from '@/lib/utils'

export const dynamic = 'force-dynamic' // allows POST in serverless

// GET all photos
export async function GET() {
  try {
    await connectToDB()
    const photos = await Photo.find().populate('category').populate('sizes')
    return NextResponse.json(photos)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST a new photo
export async function POST(request) {
  try {
    await connectToDB()
    const data = await request.json()
    
    // Generate a slug from the title
    const slug = generateSlug(data.title)
    
    // Create the photo with the generated slug
    const photo = await Photo.create({
      ...data,
      slug
    })
    
    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT update a photo
export async function PUT(request) {
  try {
    await connectToDB()
    const data = await request.json()
    
    // If title is being updated, generate a new slug
    if (data.title) {
      data.slug = generateSlug(data.title)
    }
    
    const photo = await Photo.findByIdAndUpdate(
      data._id,
      data,
      { new: true, runValidators: true }
    ).populate('category').populate('sizes')
    
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }
    
    return NextResponse.json(photo)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
