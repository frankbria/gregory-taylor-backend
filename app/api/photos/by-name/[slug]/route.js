import { connectToDB } from '@/lib/db'
import Photo from '@/models/Photo'

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
      return new Response('Photo not found', { status: 404 })
    }

    return Response.json(photo)
  } catch (err) {
    console.error('Error fetching photo:', err)
    return new Response('Error fetching photo', { status: 500 })
  }
} 