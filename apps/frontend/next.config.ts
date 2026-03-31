import type { NextConfig } from 'next'

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ENABLE_AI_FEATURES: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES || 'true',
  },
  async rewrites() {
    return [
      {
        source: '/avatars/:path*',
        destination: `${backendUrl}/avatars/:path*`,
      },
      {
        source: '/company-logos/:path*',
        destination: `${backendUrl}/company-logos/:path*`,
      },
      {
        source: '/team-icons/:path*',
        destination: `${backendUrl}/team-icons/:path*`,
      },
      {
        source: '/invoice-logos/:path*',
        destination: `${backendUrl}/invoice-logos/:path*`,
      },
    ]
  },
}

export default nextConfig
