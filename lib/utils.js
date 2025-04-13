/**
 * Generates a URL-friendly slug from a string
 * @param {string} str - The string to convert to a slug
 * @returns {string} The generated slug
 */
export function generateSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove all non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Ensures a slug is unique by appending a number if necessary
 * @param {string} baseSlug - The base slug to check
 * @param {string} [excludeId] - ID to exclude from duplicate check (for updates)
 * @param {Function} checkDuplicate - Function to check if slug exists
 * @returns {Promise<string>} A unique slug
 */
export async function ensureUniqueSlug(baseSlug, excludeId = null, checkDuplicate) {
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const exists = await checkDuplicate(slug, excludeId)
    if (!exists) return slug
    slug = `${baseSlug}-${counter}`
    counter++
  }
} 