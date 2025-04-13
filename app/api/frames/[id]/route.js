import { connectToDB } from '@/lib/db'
import Frame from '@/models/Frame'

export const dynamic = 'force-dynamic'

// GET a single frame
export async function GET(req, ctx) {
  try {
    await connectToDB()
    const { params } = ctx
    
    const frame = await Frame.findById(params.id)
    if (!frame) {
      return new Response('Frame not found', { status: 404 })
    }
    
    return Response.json(frame)
  } catch (error) {
    return new Response('Error fetching frame: ' + error.message, { status: 500 })
  }
}

// DELETE a frame
export async function DELETE(req, ctx) {
  try {
    await connectToDB()
    const { params } = ctx
    
    const frame = await Frame.findByIdAndDelete(params.id)
    if (!frame) {
      return new Response('Frame not found', { status: 404 })
    }
    
    return new Response('Frame deleted successfully', { status: 200 })
  } catch (error) {
    return new Response('Error deleting frame: ' + error.message, { status: 500 })
  }
} 