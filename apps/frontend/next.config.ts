import type { NextConfig } from 'next'

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    preloadEntriesOnStart: false,
    webpackMemoryOptimizations: true,
  },
  async rewrites() {
    return [
      { source: '/avatars/:path*', destination: `${backendUrl}/avatars/:path*` },
      { source: '/company-logos/:path*', destination: `${backendUrl}/company-logos/:path*` },
      { source: '/team-icons/:path*', destination: `${backendUrl}/team-icons/:path*` },
      { source: '/invoice-logos/:path*', destination: `${backendUrl}/invoice-logos/:path*` },
    ]
  },
}

export default nextConfig
