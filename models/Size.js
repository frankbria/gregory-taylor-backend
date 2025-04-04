// models/Size.js
import mongoose from 'mongoose'

const SizeSchema = new mongoose.Schema(
  {
    name: String,          // e.g., "8x10"
    width: Number,         // inches or cm
    height: Number,
    unit: { type: String, default: 'in' }, // optional: "in", "cm"
    price: Number,         // default price
  },
  { timestamps: true }
)

export default mongoose.models.Size || mongoose.model('Size', SizeSchema)
