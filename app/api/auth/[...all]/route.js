// app/api/auth/[...all]/route.js - Better Auth API handler
import { auth, initializeAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

// Get or initialize the auth handler
async function getHandler() {
  const authInstance = auth || (await initializeAuth());
  if (!authInstance) {
    return null;
  }
  return toNextJsHandler(authInstance);
}

export async function GET(request, context) {
  const handler = await getHandler();
  if (!handler) {
    return NextResponse.json(
      { error: "Auth not initialized - check MONGODB_URI" },
      { status: 503 }
    );
  }
  return handler.GET(request, context);
}

export async function POST(request, context) {
  const handler = await getHandler();
  if (!handler) {
    return NextResponse.json(
      { error: "Auth not initialized - check MONGODB_URI" },
      { status: 503 }
    );
  }
  return handler.POST(request, context);
}
