import { connectToDB } from '@/lib/db'
import Size from '@/models/Size'

export async function PUT(req, { params }) {
  await connectToDB()
  const body = await req.json()
  const updated = await Size.findByIdAndUpdate(params.id, body, { new: true })
  return Response.json(updated)
}

export async function DELETE(req, { params }) {
  await connectToDB()
  await Size.findByIdAndDelete(params.id)
  return new Response(null, { status: 204 })
}
