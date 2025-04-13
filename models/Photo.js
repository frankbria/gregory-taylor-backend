import mongoose from 'mongoose'

const PhotoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  keywords: [String],
  imageUrl: {
    type: String,
    required: true
  },
  publicID: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },

  featured: {
    type: Boolean,
    default: false,
  },

  fullLength: {
    type: Boolean,
    default: false,
  },

  sizes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Size',
  }],

  useDefaultSizes: {
    type: Boolean,
    default: true,
  },

  location: {
    type: String,
    trim: true
  },
},
  
  { timestamps: true })

// Create a compound index for slug and category for faster lookups
PhotoSchema.index({ slug: 1, category: 1 })

// Create indexes
PhotoSchema.index({ title: 'text', description: 'text' })
PhotoSchema.index({ category: 1 })
PhotoSchema.index({ slug: 1 })

export default mongoose.models.Photo || mongoose.model('Photo', PhotoSchema)