// /api/photos/[id]/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Photo from '@/models/Photo'
import Category from '@/models/Category'
import { v2 as cloudinary } from 'cloudinary'
import mongoose from 'mongoose'
import { generateSlug, ensureUniqueSlug } from '@/lib/utils'
import { adminAuth } from '@/lib/adminAuth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Helper to slugify titles
/*
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}
    */

// Helper to check if a slug exists
async function checkPhotoSlugExists(slug, excludeId = null) {
  const query = { slug }
  if (excludeId) {
    query._id = { $ne: excludeId }
  }
  const existing = await Photo.findOne(query)
  return !!existing
}

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    await connectToDB()
    const photo = await Photo.findById(params.id).populate('category sizes')
    if (!photo) return new Response('Photo not found', { status: 404 })
    return Response.json(photo)
  } catch (error) {
    console.error('Error fetching photo:', error)
    return new Response('Error fetching photo', { status: 500 })
  }
}

export const PUT = adminAuth(async (request) => {
  try {
    await connectToDB()
    
    // Extract ID from the URL instead of using params
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]
    
    const existingPhoto = await Photo.findById(id)
    if (!existingPhoto) return new Response('Photo not found', { status: 404 })

    const body = await request.json()
    const baseSlug = generateSlug(body.title || existingPhoto.title)

    // Normalize keywords
    if (typeof body.keywords === 'string') {
      body.keywords = body.keywords.split(',').map(k => k.trim())
    }

    // Enforce size override structure
    if (body.useDefaultSizes) {
      body.sizes = []
    }

    // Generate slug if missing or title changed
    const titleChanged = body.title && body.title !== existingPhoto.title

    if (!body.slug || titleChanged) {
      body.slug = await ensureUniqueSlug(baseSlug, id, checkPhotoSlugExists)
    }

    try {
      // Create a new document with all the updated fields
      const updatedPhoto = {
        ...existingPhoto.toObject(),
        ...body,
        slug: body.slug, // Explicitly set the slug
        location: body.location // Explicitly set the location
      }
      
      // Use findOneAndReplace to completely replace the document
      const result = await Photo.findOneAndReplace(
        { _id: id },
        updatedPhoto,
        { new: true, runValidators: true }
      )
      
      // If the replace didn't work, try a direct MongoDB update
      if (!result || !result.slug) {
        // Get the MongoDB connection
        const db = mongoose.connection.db
        
        // Perform a direct update on the collection
        await db.collection('photos').updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { $set: { 
            slug: body.slug,
            location: body.location // Explicitly set the location in the direct update
          }}
        )
        
        // Fetch the updated document
        const finalDoc = await Photo.findById(id)
        return Response.json(finalDoc)
      }
      
      return Response.json(result)
    } catch (error) {
      console.error('Error updating photo:', error)
      return new Response('Error updating photo: ' + error.message, { status: 500 })
    }
  } catch (error) {
    console.error('Error updating photo:', error)
    return new Response('Error updating photo', { status: 500 })
  }
})

export const DELETE = adminAuth(async (req) => {
  // Extract ID from the URL instead of using params
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const id = pathParts[pathParts.length - 1]

  await connectToDB()

  const photo = await Photo.findById(id)
  if (!photo) return new Response('Photo not found', { status: 404 })

  // Delete from Cloudinary
  if (photo.publicID) {
    try {
      await cloudinary.uploader.destroy(photo.publicID)
    } catch (err) {
      console.error('Cloudinary delete error:', err)
      return new Response('Error deleting from Cloudinary', { status: 500 })
    }
  }

  // Delete from MongoDB
  try {
    await Photo.findByIdAndDelete(id)
  } catch (err) {
    console.error('DB delete error:', err)
    return new Response('Error deleting from database', { status: 500 })
  }

  return new Response('Photo deleted successfully', { status: 200 })
})
