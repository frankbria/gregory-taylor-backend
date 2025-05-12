// backend/app/api/gallery/[slug]/route.js
export const runtime = "nodejs";
import { connectToDB } from '@/lib/db'
import Photo from '@/models/Photo'
import Category from '@/models/Category'
import { corsHeaders } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req, context) {
  try {
    await connectToDB()

    // Extract slug from the URL instead of using params
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const slug = pathParts[pathParts.length - 1]
    
    const category = await Category.findOne({ slug })
    if (!category) {
      return new Response('Category not found', { status: 404, 
        headers: corsHeaders(req) }
      )
    }

    const photos = await Photo.find({ category: category._id })
      .select('title imageUrl slug fullLength')
      .sort({ createdAt: -1 })

    return Response.json({ category, photos },
      {
        status: 200,
        headers: corsHeaders(req),
      }
    )
  } catch (err) {
    console.error('Error fetching category photos:', err)
    return new Response('Error fetching category photos', { status: 500, 
      headers: corsHeaders(req) }
    )
  }
}
