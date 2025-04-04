// app/api/photos/route.js
import { connectToDB } from '@/lib/db'
import Photo from '@/models/Photo'
import Category from '@/models/Category'

export const dynamic = 'force-dynamic' // allows POST in serverless

export async function POST(req) {
  try {
    await connectToDB()
    const body = await req.json()

    // Parse keywords if it's a comma-separated string
    if (typeof body.keywords === 'string') {
      body.keywords = body.keywords.split(',').map(k => k.trim())
    }

    // Default empty sizes array if not using overrides
    if (body.useDefaultSizes) {
      body.sizes = []
    }

    const photo = new Photo(body)
    const saved = await photo.save()

    return Response.json({ success: true, photo: saved })
  } catch (err) {
    console.error('DB Save Error:', err)
    return new Response('Error saving photo', { status: 500 })
  }
}

export async function GET() {
  try {
    await connectToDB()

    //console.log('PHOTO SCHEMA FIELDS:', Object.keys(Photo.schema.paths))
    // Populate category name in the response
    const photos = await Photo.find()
      .sort({ createdAt: -1 })
      .populate('category', 'name') // only pull the category name

    return Response.json(photos)
  } catch (err) {
    console.error('Fetch error:', err)
    return new Response('Error fetching photos', { status: 500 })
  }
}
