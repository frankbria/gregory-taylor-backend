// app/api/route.js - API health check endpoint
import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/utils'

export async function GET(request) {
  return new NextResponse(JSON.stringify({ status: 'ok', message: 'API is running' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request)
    }
  })
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request)
  })
}
