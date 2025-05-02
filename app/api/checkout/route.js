// backend/app/api/checkout/route.js
export const runtime = "nodejs";  

import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const { items } = await request.json()
    const line_items = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          description: [
            item.size ? `Size: ${item.size}` : null,
            item.frame ? `Frame: ${item.frame}` : null,
            item.format ? `Format: ${item.format}` : null
          ].filter(Boolean).join(', '),
        },
        unit_amount: Math.round(item.price * 100), // price in cents
      },
      quantity: item.quantity || 1,
    }))

    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart/cancel`,
    })

    return NextResponse.json({ id: session.id })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Unable to create Stripe session' }, { status: 500 })
  }
}