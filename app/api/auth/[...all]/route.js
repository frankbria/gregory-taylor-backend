// app/api/auth/[...all]/route.js - Better Auth API handler
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

// Handle case where auth is not initialized (during build time)
const handler = auth ? toNextJsHandler(auth) : null;

export async function GET(request, context) {
  if (!handler) {
    return NextResponse.json(
      { error: "Auth not initialized - check MONGODB_URI" },
      { status: 503 }
    );
  }
  return handler.GET(request, context);
}

export async function POST(request, context) {
  if (!handler) {
    return NextResponse.json(
      { error: "Auth not initialized - check MONGODB_URI" },
      { status: 503 }
    );
  }
  return handler.POST(request, context);
}
