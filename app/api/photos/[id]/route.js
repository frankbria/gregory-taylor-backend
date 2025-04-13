// /api/photos/[id]/route.js

import { connectToDB } from '@/lib/db'
import Photo from '@/models/Photo'
import Category from '@/models/Category'
import { v2 as cloudinary } from 'cloudinary'
import mongoose from 'mongoose'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Helper to slugify titles
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper to ensure unique slug
async function ensureUniqueSlug(baseSlug, photoId = null) {
  let slug = baseSlug
  let counter = 1
  
  // Keep checking until we find a unique slug
  while (true) {
    // Check if a photo with this slug already exists (excluding the current photo)
    const query = { slug: slug }
    if (photoId) {
      query._id = { $ne: photoId }
    }
    
    const existingPhoto = await Photo.findOne(query)
    
    // If no photo exists with this slug, we've found a unique one
    if (!existingPhoto) {
      return slug
    }
    
    // Otherwise, append a counter and try again
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export async function GET(req, ctx) {
  const { params } = ctx
  await connectToDB()

  const photo = await Photo.findById(params.id).populate('category', 'name')
  return Response.json(photo)
}

export async function PUT(req, context) {
  await connectToDB()
  const params = await context.params
  const id = params.id
  const body = await req.json()

  // Normalize keywords
  if (typeof body.keywords === 'string') {
    body.keywords = body.keywords.split(',').map(k => k.trim())
  }

  // Enforce size override structure
  if (body.useDefaultSizes) {
    body.sizes = []
  }

  // Generate slug if missing or title changed
  const existingPhoto = await Photo.findById(id)
  if (!existingPhoto) {
    return new Response('Photo not found', { status: 404 })
  }
  
  const titleChanged = body.title && body.title !== existingPhoto.title

  if (!body.slug || titleChanged) {
    const baseSlug = slugify(body.title || existingPhoto.title)
    // Ensure the slug is unique
    body.slug = await ensureUniqueSlug(baseSlug, id)
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
}

export async function DELETE(req, { params }) {
  await connectToDB()

  const photo = await Photo.findById(params.id)
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
    await Photo.findByIdAndDelete(params.id)
  } catch (err) {
    console.error('DB delete error:', err)
    return new Response('Error deleting from database', { status: 500 })
  }

  return new Response('Photo deleted successfully', { status: 200 })
}
