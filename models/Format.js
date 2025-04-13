import mongoose from 'mongoose'

const FormatSchema = new mongoose.Schema({
  name: {
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

export default mongoose.models.Format || mongoose.model('Format', FormatSchema) 