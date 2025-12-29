// backend/app/api/photos/by-name/[slug]/route.js
export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Photo from '@/models/Photo'
import Category from '@/models/Category'
import Size from '@/models/Size'
import { corsHeaders } from '@/lib/utils'
import { getDisplayUrl } from '@/lib/cloudinary'
// import Frame from '@/models/Frame' // Uncomment if you use .populate('frames')

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    await connectToDB()

    // Extract slug from the URL instead of using params
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const slug = pathParts[pathParts.length - 1]
    
    // Find the photo by slug and populate the category
    const photo = await Photo.findOne({ slug })
      .populate('category')
      .populate('sizes')
      //.populate('frames')
      //.populate('formats')

    if (!photo) {
      return new Response('Photo not found', { status: 404, headers: corsHeaders(req) })
    }

    // Transform photo to use displayUrl instead of raw imageUrl and publicID
    const photoObj = photo.toObject()
    const transformedPhoto = {
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

    return Response.json(transformedPhoto, {
      status: 200,
      headers: corsHeaders(req)
    })
  } catch (err) {
    console.error('Error fetching photo:', err)
    return new Response('Error fetching photo', { status: 500, headers: corsHeaders(req) })
  }
}