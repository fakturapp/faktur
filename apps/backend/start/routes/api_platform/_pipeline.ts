import env from '#start/env'
import { middleware } from '#start/kernel'

function normalizePrefix(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '/') return ''
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeading.replace(/\/+$/, '')
}

export const API_PLATFORM_PREFIX = normalizePrefix(env.get('API_PLATFORM_PREFIX', '/v1/core/api'))

export function apiPlatformStack(scopes: string[]) {
  return [
    middleware.apiKey(),
    middleware.apiRequestLogger(),
    middleware.apiRateLimit(),
    middleware.apiCredit(),
    middleware.apiIdempotency(),
    middleware.apiScope(scopes),
  ]
}

export function apiPlatformStackNoScope() {
  return [
    middleware.apiKey(),
    middleware.apiRequestLogger(),
    middleware.apiRateLimit(),
    middleware.apiCredit(),
    middleware.apiIdempotency(),
  ]
}
