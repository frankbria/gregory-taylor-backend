// backend/app/api/orders/route.js

import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import Order from '@/models/Order';
import { corsHeaders } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST: Create a new order
export async function POST(req) {
  await connectToDB();
  const data = await req.json();
  const { stripeSessionId, paymentIntentId, items, totalAmount, currency = 'usd', userId } = data;
  const newOrder = await Order.create({ stripeSessionId, paymentIntentId, items, totalAmount, currency, userId });
  return new Response(JSON.stringify(newOrder), { status: 201, headers: corsHeaders(req) });
}

// GET all or single order or by user
export async function GET(req) {
  await connectToDB();
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const userId = url.searchParams.get('userId');
  if (userId) {
    const userOrders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    return new Response(JSON.stringify(userOrders), { status: 200, headers: corsHeaders(req) });
  }
  if (id) {
    const order = await Order.findById(id).lean();
    if (!order) {
      return new Response('Order not found', { status: 404, headers: corsHeaders(req) });
    }
    return new Response(JSON.stringify(order), { status: 200, headers: corsHeaders(req) });
  }
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  return new Response(JSON.stringify(orders), { status: 200, headers: corsHeaders(req) });
}

// PUT to update order status
export async function PUT(req) {
  await connectToDB();
  const data = await req.json();
  if (!data.id || !data.status) {
    return new Response('Invalid payload', { status: 400, headers: corsHeaders(req) });
  }
  const order = await Order.findByIdAndUpdate(data.id, { status: data.status }, { new: true }).lean();
  if (!order) {
    return new Response('Order not found', { status: 404, headers: corsHeaders(req) });
  }
  return new Response(JSON.stringify(order), { status: 200, headers: corsHeaders(req) });
}

// OPTIONS for CORS preflight
export async function OPTIONS(req) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}