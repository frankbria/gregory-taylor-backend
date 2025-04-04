import { connectToDB } from '@/lib/db'
import Category from '@/models/Category'

export async function GET() {
  await connectToDB()
  const categories = await Category.find().sort({ name: 1 })
  return Response.json(categories)
}

export async function POST(req) {
  await connectToDB()
  const body = await req.json()
  const newCategory = new Category(body)
  const saved = await newCategory.save()
  return Response.json(saved)
}
