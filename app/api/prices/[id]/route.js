import { connectToDB } from '@/lib/db'
import Price from '@/models/Price'

export async function PUT(req, { params }) {
  await connectToDB()
  const body = await req.json()
  const updated = await Price.findByIdAndUpdate(params.id, body, { new: true })
  return Response.json(updated)
}

export async function DELETE(req, { params }) {
  await connectToDB()
  await Price.findByIdAndDelete(params.id)
  return new Response(null, { status: 204 })
}
