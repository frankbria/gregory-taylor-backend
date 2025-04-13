// app/api/photos/route.js
import { NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import Photo from '@/models/Photo'
import Category from '@/models/Category'
import { generateSlug, ensureUniqueSlug } from '@/lib/utils'

export const dynamic = 'force-dynamic' // allows POST in serverless

// Helper to check if a slug exists
async function checkPhotoSlugExists(slug, excludeId = null) {
  const query = { slug }
  if (excludeId) {
    query._id = { $ne: excludeId }
  }
  const existing = await Photo.findOne(query)
  return !!existing
}

// GET all photos
export async function GET() {
  try {
    await connectToDB()
    const photos = await Photo.find()
      .populate('category')
      .populate('sizes')
      .sort({ createdAt: -1 }) // Sort by newest first
    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos', details: error.message },
      { status: 500 }
    )
  }
}

// POST a new photo
export async function POST(request) {
  try {
    await connectToDB()
    const data = await request.json()
    
    console.log('Received photo data:', data)
    
    if (!data.title || !data.title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }
    
    // Generate a base slug from the title
    const baseSlug = generateSlug(data.title)
    console.log('Generated base slug:', baseSlug)
    
    // Ensure the slug is unique
    const slug = await ensureUniqueSlug(baseSlug, null, checkPhotoSlugExists)
    console.log('Final unique slug:', slug)
    
    // Create the photo with the generated slug
    const photoData = {
      ...data,
      slug
    }
    
    console.log('Creating photo with data:', photoData)
    
    const photo = await Photo.create(photoData)
    
    console.log('Created photo with slug:', photo.slug)
    
    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error('Error creating photo:', error)
    return NextResponse.json(
      { error: 'Failed to create photo', details: error.message },
      { status: 500 }
    )
  }
}

// PUT update a photo
export async function PUT(request) {
  try {
    await connectToDB()
    const data = await request.json()
    
    // If title is being updated, generate a new slug
    if (data.title) {
      const baseSlug = generateSlug(data.title)
      data.slug = await ensureUniqueSlug(baseSlug, data._id, checkPhotoSlugExists)
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
    console.error('Error updating photo:', error)
    return NextResponse.json(
      { error: 'Failed to update photo', details: error.message },
      { status: 500 }
    )
  }
}
