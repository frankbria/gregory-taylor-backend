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

// Initialize auth synchronously at module load
// This may be null during build time if MONGODB_URI isn't set
let auth = null;
try {
  if (process.env.MONGODB_URI) {
    const client = new MongoClient(process.env.MONGODB_URI);
    auth = betterAuth({
      secret: process.env.BETTER_AUTH_SECRET,
      database: mongodbAdapter(client.db()),
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
  }
} catch (e) {
  // Silently fail during build time
  console.warn("Auth initialization deferred - MONGODB_URI not available");
}

export { auth };
