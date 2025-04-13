import mongoose from 'mongoose'

const FrameSchema = new mongoose.Schema({
  style: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { timestamps: true })

export default mongoose.models.Frame || mongoose.model('Frame', FrameSchema) 