import { connectToDB } from '@/lib/db'
import Category from '@/models/Category'
import Photo from '@/models/Photo'

export const dynamic = 'force-dynamic' // allows POST in serverless

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
  
  
  return Response.json(enriched)
} catch (err) {
    console.error('Error fetching categories with featured photos:', err)
    return new Response('Error fetching categories', { status: 500 })
}
}

export async function POST(req) {
  await connectToDB()
  const body = await req.json()
  const newCategory = new Category(body)
  const saved = await newCategory.save()
  return Response.json(saved)
}
