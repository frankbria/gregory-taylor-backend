/** @type {import('next').NextConfig} */
//import withBundleAnalyzer from '@next/bundle-analyzer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: true,
  env: {
    // Note: BETTER_AUTH_SECRET is intentionally NOT exposed here
    // It is read directly from process.env in lib/auth.js (server-only)
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    // CORS & Database
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
    MONGODB_URI: process.env.MONGODB_URI,
    // Stripe
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    // Admin API
    NEXT_PUBLIC_ADMIN_API_KEY: process.env.NEXT_PUBLIC_ADMIN_API_KEY,
  },
}

//export default withBundleAnalyzer({
//  enabled: true,
//})(nextConfig)

export default nextConfig;