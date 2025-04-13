import { connectToDB } from '@/lib/db'
import Photo from '@/models/Photo'
import Size from '@/models/Size'

export const dynamic = 'force-dynamic'

export async function GET(req, context) {
  try {
    await connectToDB()

    const { params } = context
    const slug = params.slug

    // Find the photo by slug and populate the category
    const photo = await Photo.findOne({ slug })
      .populate('category', 'name slug')
      .populate('sizes', 'name price')

    if (!photo) {
      return new Response('Photo not found', { status: 404 })
    }

    // Handle available sizes based on useDefaultSizes flag
    let availableSizes = []
    
    if (photo.useDefaultSizes) {
      // If useDefaultSizes is true, fetch all sizes from the database
      const allSizes = await Size.find().sort({ price: 1 })
      availableSizes = allSizes
    } else {
      // Otherwise, use the sizes array from the photo
      availableSizes = photo.sizes || []
    }

    // Add the availableSizes to the photo object
    const photoWithSizes = {
      ...photo.toObject(),
      availableSizes
    }

    return Response.json(photoWithSizes)
  } catch (err) {
    console.error('Error fetching photo by slug:', err)
    return new Response('Error fetching photo', { status: 500 })
  }
} 