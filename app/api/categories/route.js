import { connectToDB } from '@/lib/db'
import Category from '@/models/Category'
import Photo from '@/models/Photo'

export const dynamic = 'force-dynamic' // allows POST in serverless

// 🟢 GET: Return categories + featured image
export async function GET() {
  try {
    await connectToDB()

    const categories = await Category.find().sort({ name: 1 }).lean()

    const enriched = await Promise.all(
      categories.map(async (category) => {
        const featuredPhoto = await Photo.findOne({
          category: category._id,
          featured: true,
        })

        return {
          ...category,
          featuredImage: featuredPhoto?.imageUrl || null,
        }
      })
    )

    return new Response(JSON.stringify(enriched), {
      status: 200,
      headers: corsHeaders(),
    })
  } catch (err) {
    console.error('Error fetching categories with featured photos:', err)
    return new Response('Error fetching categories', {
      status: 500,
      headers: corsHeaders(),
    })
  }
}

// 🟡 POST: Create a new category
export async function POST(req) {
  await connectToDB()
  const body = await req.json()
  const newCategory = new Category(body)
  const saved = await newCategory.save()

  return new Response(JSON.stringify(saved), {
    status: 201,
    headers: corsHeaders(),
  })
}

// 🟠 OPTIONS: Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  })
}

// 🧩 Helper: CORS headers
function corsHeaders() {
  const allowedOrigin = process.env.CORS_ALLOWED_ORIGINS?.split(',')[0] || '*'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}
