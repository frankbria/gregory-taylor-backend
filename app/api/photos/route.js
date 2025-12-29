// app/api/photos/route.js

export const runtime = "nodejs";

import { NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import Photo from '@/models/Photo'
import Category from '@/models/Category'
import Size from '@/models/Size' // Add this import
import { generateSlug, ensureUniqueSlug } from '@/lib/utils'
import { adminAuth } from '@/lib/adminAuth'
import { corsHeaders } from '@/lib/utils'
import { getDisplayUrl } from '@/lib/cloudinary'


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
export async function GET(request) {

  // console.log("Clerk secret is:", !!process.env.CLERK_SECRET_KEY);

  // const query = request.query ? request.query : {}
  // console.log('Query:', query)

  try {
    await connectToDB()
    const photos = await Photo.find()
      .populate('category')
      .populate('sizes')
      .sort({ createdAt: -1 }) // Sort by newest first

    // Transform photos to use displayUrl instead of raw imageUrl and publicID
    const transformedPhotos = photos.map(photo => {
      const photoObj = photo.toObject()
      return {
        _id: photoObj._id,
        title: photoObj.title,
        slug: photoObj.slug,
        description: photoObj.description,
        keywords: photoObj.keywords,
        category: photoObj.category,
        featured: photoObj.featured,
        fullLength: photoObj.fullLength,
        sizes: photoObj.sizes,
        location: photoObj.location,
        width: photoObj.width,
        height: photoObj.height,
        aspectRatio: photoObj.aspectRatio,
        imageFormat: photoObj.imageFormat,
        displayUrl: getDisplayUrl(photoObj.publicID, {
          width: photoObj.fullLength ? 1600 : 1200
        }),
        createdAt: photoObj.createdAt,
        updatedAt: photoObj.updatedAt,
      }
    })

    return new Response(JSON.stringify(transformedPhotos), {
      headers: corsHeaders(request)
    })
  } catch (error) {
    console.error('Error fetching photos:', error)
    return new Response( "Error fetching photos", { status: 500,
      headers: corsHeaders(request) }
    )
     }
  }

// POST a new photo
export const POST = adminAuth(async (request) => {
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
})

// PUT update a photo
export const PUT = adminAuth(async (req) => {
  try {
    await connectToDB()
    const data = await req.json()

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
})
