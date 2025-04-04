import mongoose from 'mongoose'

const PhotoSchema = new mongoose.Schema({
  title: String,
  description: String,
  keywords: [String],
  imageUrl: String,
  publicID: String,

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
},
  
  { timestamps: true })


export default mongoose.models.Photo || mongoose.model('Photo', PhotoSchema)