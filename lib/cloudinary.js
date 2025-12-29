// lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Generate a display URL for a Cloudinary image with transformations
 * This prevents users from accessing original high-resolution images
 *
 * @param {string} publicId - The Cloudinary public ID of the image
 * @param {Object} options - Transformation options
 * @param {number} options.width - Maximum width (default: 1200px)
 * @param {string} options.quality - Image quality (default: 'auto')
 * @param {string} options.format - Image format (default: 'auto')
 * @returns {string} Transformed Cloudinary URL
 */
export function getDisplayUrl(publicId, options = {}) {
  const {
    width = 1200,
    quality = 'auto',
    format = 'auto',
  } = options

  return cloudinary.url(publicId, {
    transformation: [
      {
        width,
        crop: 'limit', // Prevent upscaling
        quality,
        fetch_format: format,
      }
    ],
    secure: true,
  })
}

/**
 * Generate a signed display URL for additional security
 * Signed URLs prevent tampering with transformation parameters
 *
 * @param {string} publicId - The Cloudinary public ID of the image
 * @param {Object} options - Transformation options (same as getDisplayUrl)
 * @returns {string} Signed transformed Cloudinary URL
 */
export function getSignedDisplayUrl(publicId, options = {}) {
  const {
    width = 1200,
    quality = 'auto',
    format = 'auto',
  } = options

  return cloudinary.url(publicId, {
    transformation: [
      {
        width,
        crop: 'limit',
        quality,
        fetch_format: format,
      }
    ],
    secure: true,
    sign_url: true,
  })
}

// Export the configured cloudinary instance for admin operations
export default cloudinary
