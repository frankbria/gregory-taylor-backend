// backend/models/Order.js

import mongoose from 'mongoose';

const { Schema } = mongoose;

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Photo', required: true },
  title: { type: String, required: true },
  imageUrl: { type: String },
  size: { type: String },
  frame: { type: String },
  format: { type: String },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
}, { _id: false });

const OrderSchema = new Schema({
  userId: { type: String },
  items: { type: [OrderItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  stripeSessionId: { type: String, required: true },
  paymentIntentId: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  status: { type: String, enum: ['created', 'paid', 'fulfilled', 'cancelled', 'expired'], default: 'created' },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema); 