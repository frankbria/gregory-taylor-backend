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
const INVITE_ERROR = "Registration requires a valid invitation code";

// Sign-up validation hook for password and invite code
const signUpValidationHook = createAuthMiddleware(async (ctx) => {
  // Only validate on sign-up endpoint
  if (ctx.path !== "/sign-up/email") {
    return;
  }

  const { password, confirmPassword, inviteCode } = ctx.body || {};

  // Validate invite code if INVITE_CODE env var is set
  const expectedInviteCode = process.env.INVITE_CODE;
  if (expectedInviteCode && inviteCode !== expectedInviteCode) {
    throw new APIError("FORBIDDEN", {
      message: INVITE_ERROR,
    });
  }

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

// Initialize MongoDB client with proper connection settings for PM2
let mongoClient = null;
let auth = null;

async function initializeAuth() {
  if (!process.env.MONGODB_URI) {
    return null;
  }

  if (auth) {
    return auth;
  }

  try {
    // Create client with connection pool settings for persistent PM2 environment
    mongoClient = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 60000, // Close idle connections after 60s
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      // TLS/SSL settings for MongoDB Atlas and hosted instances
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    });

    // CRITICAL: Actually connect the client
    await mongoClient.connect();
    console.log('Better Auth MongoDB client connected');

    auth = betterAuth({
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
        before: signUpValidationHook,
      },
    });

    return auth;
  } catch (e) {
    console.error('Failed to initialize Better Auth:', e);
    throw e;
  }
}

// Initialize auth during module load (but don't await - let it happen async)
if (process.env.MONGODB_URI) {
  initializeAuth().catch((e) => {
    console.warn("Auth initialization deferred:", e.message);
  });
}

export { auth, initializeAuth };
