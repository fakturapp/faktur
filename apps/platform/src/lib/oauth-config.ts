/**
 * Configuration de la plateforme développeur Faktur.
 *
 * Toutes les requêtes — y compris OAuth — vont sur le backend public.
 *
 * NEXT_PUBLIC_API_BASE_URL   — base de l'API Faktur (auth + dashboard endpoints).
 *                              Local : http://localhost:3333/api/v1
 *                              Prod  : https://api.fakturapp.cc/api/v1
 *
 * NEXT_PUBLIC_OAUTH_CLIENT_ID — client_id de l'OAuth app "Faktur Developer Platform"
 *                              enregistrée dans la table oauth_apps.
 *
 * NEXT_PUBLIC_OAUTH_REDIRECT_URI — URI de callback (doit être déclarée dans redirect_uris).
 *                                  Local : http://localhost:3002/oauth/callback
 *                                  Prod  : https://platform.fakturapp.cc/oauth/callback
 *
 * NEXT_PUBLIC_OAUTH_SCOPES   — scopes demandés (séparés par espace).
 */

const DEFAULT_API_BASE_URL = 'https://api.fakturapp.cc/api/v1'
const DEFAULT_REDIRECT_URI = 'https://platform.fakturapp.cc/oauth/callback'
const DEFAULT_SCOPES = 'team.read api_keys.manage'

function envOrDefault(key: string, fallback: string): string {
  if (typeof process === 'undefined') return fallback
  const value = process.env[key]
  return value && value.trim().length > 0 ? value.replace(/\/+$/, '') : fallback
}

export const API_BASE_URL = envOrDefault('NEXT_PUBLIC_API_BASE_URL', DEFAULT_API_BASE_URL)

export const OAUTH_CLIENT_ID =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? 'faktur-developer-platform')
    : 'faktur-developer-platform'

export const OAUTH_REDIRECT_URI = envOrDefault(
  'NEXT_PUBLIC_OAUTH_REDIRECT_URI',
  DEFAULT_REDIRECT_URI
)

export const OAUTH_SCOPES =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_OAUTH_SCOPES ?? DEFAULT_SCOPES)
    : DEFAULT_SCOPES

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
