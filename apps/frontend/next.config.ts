import type { NextConfig } from 'next'

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/avatars/:path*',
        destination: `${backendUrl}/avatars/:path*`,
      },
    ]
  },
}

export default nextConfig
