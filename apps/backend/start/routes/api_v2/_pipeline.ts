import env from '#start/env'
import { middleware } from '#start/kernel'

function normalizePrefix(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '/') return ''
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeading.replace(/\/+$/, '')
}

export const API_V2_PREFIX = normalizePrefix(env.get('API_V2_PREFIX', '/api/v2'))

export function apiV2Stack(scopes: string[]) {
  return [
    middleware.apiKey(),
    middleware.apiRequestLogger(),
    middleware.apiRateLimit(),
    middleware.apiIdempotency(),
    middleware.apiScope(scopes),
  ]
}

export function apiV2StackNoScope() {
  return [
    middleware.apiKey(),
    middleware.apiRequestLogger(),
    middleware.apiRateLimit(),
    middleware.apiIdempotency(),
  ]
}
