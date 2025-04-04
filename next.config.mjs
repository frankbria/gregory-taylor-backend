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
  experimental: {
    allowedDevOrigins: ['http://72.16.0.2:3000'],
  },
}

//export default withBundleAnalyzer({
//  enabled: true,
//})(nextConfig)

export default nextConfig;