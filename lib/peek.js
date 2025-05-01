// backend/lib/peek.js

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    clerkSecretLoaded: !!process.env.CLERK_SECRET_KEY,
    theKey: process.env.CLERK_SECRET_KEY?.slice(0,10) + "…",
  });
}
