import mongoose from 'mongoose'

const PriceSchema = new mongoose.Schema(
  {
    sizeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Size', required: true },
    price: { type: Number, required: true }, // USD for now
    label: { type: String }, // optional e.g. "Holiday Sale"
  },
  { timestamps: true }
)

export default mongoose.models.Price || mongoose.model('Price', PriceSchema)
