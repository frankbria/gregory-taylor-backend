// /api/photos/[id]/route.js

import { connectToDB } from '@/lib/db'
import Photo from '@/models/Photo'
import Category from '@/models/Category'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}) 

export async function GET(req, ctx) {
  const { params } = ctx
  await connectToDB()

  const photo = await Photo.findById(params.id).populate('category', 'name')
  return Response.json(photo)
}


export async function PUT(req, { params }) {
  await connectToDB()
  const body = await req.json()

  // Normalize keywords
  if (typeof body.keywords === 'string') {
    body.keywords = body.keywords.split(',').map(k => k.trim())
  }

  // Enforce size override structure
  if (body.useDefaultSizes) {
    body.sizes = []
  }

  const updated = await Photo.findByIdAndUpdate(params.id, body, { new: true })
  return Response.json(updated)
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
