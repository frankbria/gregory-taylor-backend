// backend/app/api/upload/route.js
export const runtime = "nodejs";

import { v2 as cloudinary } from 'cloudinary'
import { adminAuth } from '@/lib/adminAuth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const dynamic = 'force-dynamic'

export const POST = adminAuth(async (req) => {  
  try {
    const data = await req.formData()
    const file = data.get('file')

    if (!file) {
      return new Response('No file uploaded', { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) reject(error)
          else resolve(result)
        })
        .end(buffer)
    })

    return Response.json({ 
        url: result.secure_url,
        publicID: result.public_id,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return new Response('Upload failed', { status: 500 })
  }
})
