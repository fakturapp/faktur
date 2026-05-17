function requireEnv(key: string): string {
  const raw = typeof process !== 'undefined' ? process.env[key] : undefined
  if (!raw || !raw.trim()) {
    throw new Error(
      `[platform] missing env var ${key} — set it in apps/platform/.env (see .env.example)`
    )
  }
  return raw.trim().replace(/\/+$/, '')
}

function optionalEnv(key: string): string {
  const raw = typeof process !== 'undefined' ? process.env[key] : undefined
  return raw && raw.trim() ? raw.trim() : ''
}

export const API_BASE_URL = requireEnv('NEXT_PUBLIC_API_BASE_URL')
export const OAUTH_CLIENT_ID = requireEnv('NEXT_PUBLIC_OAUTH_CLIENT_ID')
export const OAUTH_REDIRECT_URI = requireEnv('NEXT_PUBLIC_OAUTH_REDIRECT_URI')
export const OAUTH_SCOPES = optionalEnv('NEXT_PUBLIC_OAUTH_SCOPES')
export const DASHBOARD_URL = requireEnv('NEXT_PUBLIC_DASHBOARD_URL')
export const DOCS_URL = requireEnv('NEXT_PUBLIC_DOCS_URL')
export const PLATFORM_URL = requireEnv('NEXT_PUBLIC_PLATFORM_URL')

export const OAUTH_AUTHORIZE_URL = `${API_BASE_URL}/oauth/authorize`
export const OAUTH_TOKEN_URL = `${API_BASE_URL}/oauth/token`
export const OAUTH_REVOKE_URL = `${API_BASE_URL}/oauth/revoke`

export const STORAGE_KEYS = {
  accessToken: 'faktur_platform_access_token',
  refreshToken: 'faktur_platform_refresh_token',
  expiresAt: 'faktur_platform_token_expires_at',
  pkceVerifier: 'faktur_platform_pkce_verifier',
  oauthState: 'faktur_platform_oauth_state',
  currentTeamId: 'faktur_platform_current_team_id',
} as const
