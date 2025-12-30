export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Category from '@/models/Category'
import { adminAuth } from '@/lib/adminAuth'


export const PUT = adminAuth(async (req, { params }) =>
  {
    await connectToDB()

    const body = await req.json()
    const updated = await Category.findByIdAndUpdate(params.id, body, { new: true })
    return Response.json(updated)
})

export const DELETE = adminAuth(async (req, { params })  =>
  {
    const catId = params.id

    await connectToDB()
    await Category.findByIdAndDelete(catId)
    return new Response(null, { status: 204 })
})
