import type { NextConfig } from 'next'

// IMPORTANT: NEXT_SERVER_ACTIONS_ENCRYPTION_KEY must be set in production env
// (Dokploy). Without it, every build mints a fresh key and any client that
// still has the previous bundle cached throws:
//   Error: Failed to find Server Action "x". This request might be from an
//   older or newer deployment.
//
// Generate with: openssl rand -base64 32
// The same value must be reused across redeploys (set it once, never rotate
// unless you also want to invalidate every in-flight client session).
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) {
  console.warn(
    '[docs] NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is not set — Server Action IDs will rotate on every build, ' +
      'causing "Failed to find Server Action" errors for clients with cached bundles. ' +
      'Generate one with `openssl rand -base64 32` and set it in the deployment env.'
  )
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default nextConfig
