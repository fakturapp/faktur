import { middleware } from '#start/kernel'

export const API_V2_PREFIX = '/api/v2'

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
