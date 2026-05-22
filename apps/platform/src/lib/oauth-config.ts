function requireEnv(raw: string | undefined, key: string): string {
  if (!raw || !raw.trim()) {
    throw new Error(
      `[platform] missing env var ${key} — set it in apps/platform/.env (see .env.example)`
    )
  }
  return raw.trim().replace(/\/+$/, '')
}

function optionalEnv(raw: string | undefined): string {
  return raw && raw.trim() ? raw.trim() : ''
}

export const API_BASE_URL = requireEnv(
  process.env.NEXT_PUBLIC_API_BASE_URL,
  'NEXT_PUBLIC_API_BASE_URL'
)
export const OAUTH_CLIENT_ID = requireEnv(
  process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID,
  'NEXT_PUBLIC_OAUTH_CLIENT_ID'
)
export const OAUTH_REDIRECT_URI = requireEnv(
  process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI,
  'NEXT_PUBLIC_OAUTH_REDIRECT_URI'
)
export const OAUTH_SCOPES = optionalEnv(process.env.NEXT_PUBLIC_OAUTH_SCOPES)
export const DASHBOARD_URL = requireEnv(
  process.env.NEXT_PUBLIC_DASHBOARD_URL,
  'NEXT_PUBLIC_DASHBOARD_URL'
)
export const DOCS_URL = requireEnv(process.env.NEXT_PUBLIC_DOCS_URL, 'NEXT_PUBLIC_DOCS_URL')
export const PLATFORM_URL = requireEnv(
  process.env.NEXT_PUBLIC_PLATFORM_URL,
  'NEXT_PUBLIC_PLATFORM_URL'
)

export const OAUTH_AUTHORIZE_URL = `${DASHBOARD_URL}/oauth/authorize`
export const OAUTH_TOKEN_URL = `${API_BASE_URL}/oauth/token`
export const OAUTH_REVOKE_URL = `${API_BASE_URL}/oauth/revoke`
export const OAUTH_EXCHANGE_SESSION_URL = `${API_BASE_URL}/oauth/exchange-session`

// Public API path prefixes used by the API Explorer. Override via .env if the
// backend prefixes ever change (e.g. /api/v2, /api/internal). These are
// path-only — the host comes from API_BASE_URL.
function normalizePrefix(raw: string | undefined, fallback: string): string {
  const value = raw && raw.trim() ? raw.trim() : fallback
  return value.startsWith('/') ? value.replace(/\/+$/, '') : `/${value.replace(/\/+$/, '')}`
}

export const API_PREFIX_V1 = normalizePrefix(
  process.env.NEXT_PUBLIC_API_PREFIX_V1,
  '/api/v1'
)
export const API_PREFIX_PLATFORM = normalizePrefix(
  process.env.NEXT_PUBLIC_API_PREFIX_PLATFORM,
  '/api/platform'
)

export const STORAGE_KEYS = {
  accessToken: 'faktur_platform_access_token',
  refreshToken: 'faktur_platform_refresh_token',
  expiresAt: 'faktur_platform_token_expires_at',
  pkceVerifier: 'faktur_platform_pkce_verifier',
  oauthState: 'faktur_platform_oauth_state',
  currentTeamId: 'faktur_platform_current_team_id',
} as const
