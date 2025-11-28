// lib/auth.js - Better Auth server configuration
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { createAuthMiddleware, APIError } from "better-auth/api";

// Password validation constants - keep in sync with client-side messages
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_ERRORS = {
  TOO_SHORT: "Password must be at least 8 characters long",
  MISMATCH: "Passwords do not match",
};

// Password validation hook for sign-up endpoint
const passwordValidationHook = createAuthMiddleware(async (ctx) => {
  // Only validate on sign-up endpoint
  if (ctx.path !== "/sign-up/email") {
    return;
  }

  const { password, confirmPassword } = ctx.body || {};

  // Validate minimum password length
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new APIError("BAD_REQUEST", {
      message: PASSWORD_ERRORS.TOO_SHORT,
    });
  }

  // Validate password confirmation if provided by client
  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw new APIError("BAD_REQUEST", {
      message: PASSWORD_ERRORS.MISMATCH,
    });
  }
});

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
      secret: process.env.BETTER_AUTH_SECRET,
      database: mongodbAdapter(mongoClient.db()),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        minPasswordLength: MIN_PASSWORD_LENGTH,
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
      hooks: {
        before: passwordValidationHook,
      },
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
      secret: process.env.BETTER_AUTH_SECRET,
      database: mongodbAdapter(syncClient.db()),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        minPasswordLength: MIN_PASSWORD_LENGTH,
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
      hooks: {
        before: passwordValidationHook,
      },
    });
  }
} catch (e) {
  // Silently fail during build time
  console.warn("Auth initialization deferred - MONGODB_URI not available");
}

export const auth = syncAuth;
