#!/usr/bin/env node
/**
 * Backfill Script: Populate Image Dimensions for Existing Photos
 *
 * This script fetches dimension metadata from Cloudinary for photos that don't have
 * width/height data and updates the database accordingly.
 *
 * USAGE:
 *   node scripts/backfill-dimensions.js
 *
 * PREREQUISITES:
 *   - MongoDB running and accessible via MONGODB_URI
 *   - Cloudinary credentials configured in environment
 *   - .env file loaded or environment variables set
 *
 * WHAT IT DOES:
 *   1. Connects to MongoDB
 *   2. Finds photos where width is null
 *   3. Fetches resource details from Cloudinary using publicID
 *   4. Updates each photo with width, height, aspectRatio, imageFormat
 *   5. Logs success/failure for each photo
 */

import { v2 as cloudinary } from 'cloudinary'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../.env.local') })

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Import Photo model (after env is loaded)
const PhotoSchema = new mongoose.Schema({
  title: String,
  description: String,
  keywords: [String],
  imageUrl: String,
  publicID: String,
  slug: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  featured: Boolean,
  fullLength: Boolean,
  sizes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Size' }],
  useDefaultSizes: Boolean,
  location: String,
  format: { type: mongoose.Schema.Types.ObjectId, ref: 'Format' },
  width: Number,
  height: Number,
  aspectRatio: Number,
  imageFormat: String,
}, { timestamps: true })

const Photo = mongoose.models.Photo || mongoose.model('Photo', PhotoSchema)

async function connectToDB() {
  if (mongoose.connection.readyState >= 1) return

  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✓ Connected to MongoDB')
  } catch (error) {
    console.error('✗ MongoDB connection error:', error)
    process.exit(1)
  }
}

async function backfillDimensions() {
  console.log('Starting dimension backfill process...\n')

  await connectToDB()

  // Find photos missing dimension data
  const photosToUpdate = await Photo.find({ width: null })
  console.log(`Found ${photosToUpdate.length} photos without dimension data\n`)

  if (photosToUpdate.length === 0) {
    console.log('✓ All photos already have dimension data!')
    return
  }

  let successCount = 0
  let errorCount = 0
  const errors = []

  for (const photo of photosToUpdate) {
    try {
      console.log(`Processing: ${photo.title} (${photo.publicID})`)

      // Fetch resource details from Cloudinary
      const resource = await cloudinary.api.resource(photo.publicID, {
        resource_type: 'image'
      })

      // Update photo with dimension data
      photo.width = resource.width
      photo.height = resource.height
      photo.aspectRatio = resource.height > 0 ? resource.width / resource.height : null
      photo.imageFormat = resource.format

      // Warn if height is invalid
      if (!resource.height || resource.height <= 0) {
        console.log(`  ⚠ Warning: Invalid height (${resource.height}), aspectRatio set to null`)
      }

      await photo.save()

      console.log(`  ✓ Updated: ${resource.width}x${resource.height} (${resource.format})\n`)
      successCount++

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}\n`)
      errorCount++
      errors.push({
        photoId: photo._id,
        title: photo.title,
        publicID: photo.publicID,
        error: error.message
      })
    }
  }

  // Summary
  console.log('═══════════════════════════════════════════')
  console.log('BACKFILL SUMMARY')
  console.log('═══════════════════════════════════════════')
  console.log(`Total photos processed: ${photosToUpdate.length}`)
  console.log(`✓ Successfully updated: ${successCount}`)
  console.log(`✗ Failed to update: ${errorCount}`)
  console.log('═══════════════════════════════════════════\n')

  if (errors.length > 0) {
    console.log('ERRORS:')
    errors.forEach(({ title, publicID, error }) => {
      console.log(`  • ${title} (${publicID}): ${error}`)
    })
    console.log()
  }
}

// Run the backfill
backfillDimensions()
  .then(() => {
    console.log('Backfill process complete.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error during backfill:', error)
    process.exit(1)
  })
