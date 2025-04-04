// backend/app/api/gallery/[slug]/route.js

import { connectToDB } from '@/lib/db'
import Photo from '@/models/Photo'
import Category from '@/models/Category'

export const dynamic = 'force-dynamic'

export async function GET(req, context) {
  try {
    await connectToDB()

    const { params } = context
    const category = await Category.findOne({ slug: params.slug })
    if (!category) {
      return new Response('Category not found', { status: 404 })
    }

    const photos = await Photo.find({ category: category._id })
      .sort({ createdAt: -1 })

    return Response.json({ category, photos })
  } catch (err) {
    console.error('Error fetching category photos:', err)
    return new Response('Error fetching category photos', { status: 500 })
  }
}
