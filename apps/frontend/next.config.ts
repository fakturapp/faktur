import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const backendOrigin = new URL(backendUrl).origin
const backendWsOrigin = backendOrigin.replace(/^http/i, 'ws')
const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https://*.googleusercontent.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  [
    "script-src 'self' 'unsafe-inline'",
    'https://challenges.cloudflare.com',
    'https://js.stripe.com',
  ].join(' '),
  [
    "connect-src 'self'",
    backendOrigin,
    backendWsOrigin,
    'https://challenges.cloudflare.com',
    'https://js.stripe.com',
    'https://api.stripe.com',
  ].join(' '),
  "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
  "form-action 'self' https://accounts.google.com",
].join('; ')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: workspaceRoot,
  },
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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
    ]
  },
}

export default nextConfig
