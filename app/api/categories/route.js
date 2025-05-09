// backend/app/api/categories/route.js
export const runtime = "nodejs";


import { connectToDB } from '@/lib/db'
import Category from '@/models/Category'
import Photo from '@/models/Photo'
import { corsHeaders } from '@/lib/utils'
import { adminAuth } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic' // allows POST in serverless

// 🟢 GET: Return categories + featured image
export async function GET(req) {
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
      headers: corsHeaders(req),
    })
  } catch (err) {
    console.error('Error fetching categories with featured photos:', err)
    return new Response('Error fetching categories', {
      status: 500,
      headers: corsHeaders(req),
    })
  }
}

// 🟡 POST: Create a new category
export const POST = adminAuth(async (req) => {
  await connectToDB()
  const body = await req.json()
  const newCategory = new Category(body)
  const saved = await newCategory.save()

  return new Response(JSON.stringify(saved), {
    status: 201,
    headers: corsHeaders(req),
  })
})

// 🟠 OPTIONS: Handle CORS preflight requests
export async function OPTIONS(req) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req),
  })
}
