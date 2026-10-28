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
  // No `env` block: it inlines values into build output (and client bundles when referenced).
  // Server code reads process.env at runtime; NEXT_PUBLIC_* vars are inlined by Next itself.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

//export default withBundleAnalyzer({
//  enabled: true,
//})(nextConfig)

export default nextConfig;
