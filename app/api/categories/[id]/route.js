import { connectToDB } from '@/lib/db'
import Category from '@/models/Category'

export async function PUT(req, { params }) {
  await connectToDB()
  const body = await req.json()
  const updated = await Category.findByIdAndUpdate(params.id, body, { new: true })
  return Response.json(updated)
}

export async function DELETE(req, { params }) {
  await connectToDB()
  await Category.findByIdAndDelete(params.id)
  return new Response(null, { status: 204 })
}
