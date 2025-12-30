export const runtime = "nodejs";

import { connectToDB } from '@/lib/db'
import Category from '@/models/Category'
import Photo from '@/models/Photo'
import { adminAuth } from '@/lib/adminAuth'
import { corsHeaders } from '@/lib/utils'
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'


export const PUT = adminAuth(async (req, { params }) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400, headers: corsHeaders(req) }
      )
    }

    await connectToDB()

    // Validate request body
    const body = await req.json()
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'Request body cannot be empty' },
        { status: 400, headers: corsHeaders(req) }
      )
    }

    // Attempt to update the category
    const updated = await Category.findByIdAndUpdate(params.id, body, { new: true })

    // Check if category was found
    if (!updated) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404, headers: corsHeaders(req) }
      )
    }

    return NextResponse.json(updated, { headers: corsHeaders(req) })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500, headers: corsHeaders(req) }
    )
  }
})

export const DELETE = adminAuth(async (req, { params }) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400, headers: corsHeaders(req) }
      )
    }

    await connectToDB()

    // Check if category exists and has associated photos
    const photoCount = await Photo.countDocuments({ category: params.id })

    if (photoCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with associated photos',
          details: `This category has ${photoCount} photo(s). Please reassign or delete them first.`
        },
        { status: 409, headers: corsHeaders(req) }
      )
    }

    // Attempt to delete the category
    const deleted = await Category.findByIdAndDelete(params.id)

    // Check if category was found
    if (!deleted) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404, headers: corsHeaders(req) }
      )
    }

    return new Response(null, { status: 204, headers: corsHeaders(req) })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500, headers: corsHeaders(req) }
    )
  }
})
