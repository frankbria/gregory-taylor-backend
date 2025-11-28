// backend/app/api/webhooks/stripe/route.js

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import Order from '@/models/Order';
import { corsHeaders } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Stripe lazily to avoid build-time errors
let stripe = null;
function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export async function POST(request) {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  await connectToDB();
  const session = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: 'paid', paymentStatus: 'paid' }
      );
      break;
    case 'checkout.session.async_payment_failed':
      await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: 'cancelled', paymentStatus: 'failed' }
      );
      break;
    case 'checkout.session.expired':
      await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: 'expired' }
      );
      break;
    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }

  return new NextResponse(JSON.stringify({ received: true }), {
    status: 200,
    headers: corsHeaders(request),
  });
} 