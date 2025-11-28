// lib/auth.js - Better Auth server configuration
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// Create a dedicated MongoClient for Better Auth
// (Mongoose and Better Auth can share the same database)
let client = null;

async function getMongoClient() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }

  return client;
}

// Lazy initialization of auth - creates auth instance on first use
let authInstance = null;

export async function getAuth() {
  if (!authInstance) {
    const mongoClient = await getMongoClient();
    authInstance = betterAuth({
      database: mongodbAdapter(mongoClient.db()),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session age every 24 hours
        cookieCache: {
          enabled: true,
          maxAge: 60 * 5, // 5 minutes cache
        },
      },
      trustedOrigins: process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
        : [],
    });
  }
  return authInstance;
}

// For compatibility - create auth synchronously but it may fail if MONGODB_URI isn't set
// This is needed for the route handlers that expect a synchronous export
let syncAuth = null;
try {
  if (process.env.MONGODB_URI) {
    const syncClient = new MongoClient(process.env.MONGODB_URI);
    syncAuth = betterAuth({
      database: mongodbAdapter(syncClient.db()),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
          enabled: true,
          maxAge: 60 * 5,
        },
      },
      trustedOrigins: process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
        : [],
    });
  }
} catch (e) {
  // Silently fail during build time
  console.warn("Auth initialization deferred - MONGODB_URI not available");
}

export const auth = syncAuth;
