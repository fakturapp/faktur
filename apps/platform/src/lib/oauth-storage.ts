import { STORAGE_KEYS } from './oauth-config'

export interface StoredTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: number
}

const AUTH_COOKIE = 'faktur_platform_authed'

function isBrowser() {
  return typeof window !== 'undefined'
}

function setAuthCookie(expiresInSeconds: number) {
  if (!isBrowser()) return
  const max = Math.max(60, Math.floor(expiresInSeconds))
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${max}; SameSite=Lax`
}

function clearAuthCookie() {
  if (!isBrowser()) return
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

export function getStoredAccessToken(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(STORAGE_KEYS.accessToken)
}

export function getStoredTokens(): StoredTokens | null {
  if (!isBrowser()) return null
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken)
  if (!accessToken) return null
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken)
  const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.expiresAt) ?? '0')
  return { accessToken, refreshToken, expiresAt }
}

export function storeTokens(tokens: {
  access_token: string
  refresh_token?: string
  expires_in?: number
}): void {
  if (!isBrowser()) return
  const ttl = tokens.expires_in ?? 3600
  localStorage.setItem(STORAGE_KEYS.accessToken, tokens.access_token)
  if (tokens.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refresh_token)
  }
  const expiresAt = Date.now() + ttl * 1000
  localStorage.setItem(STORAGE_KEYS.expiresAt, String(expiresAt))
  setAuthCookie(ttl)
}

export function clearTokens(): void {
  if (!isBrowser()) return
  localStorage.removeItem(STORAGE_KEYS.accessToken)
  localStorage.removeItem(STORAGE_KEYS.refreshToken)
  localStorage.removeItem(STORAGE_KEYS.expiresAt)
  localStorage.removeItem(STORAGE_KEYS.currentTeamId)
  clearAuthCookie()
}

export function getCurrentTeamId(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(STORAGE_KEYS.currentTeamId)
}

export function setCurrentTeamId(id: string | null): void {
  if (!isBrowser()) return
  if (id) localStorage.setItem(STORAGE_KEYS.currentTeamId, id)
  else localStorage.removeItem(STORAGE_KEYS.currentTeamId)
}

export function isTokenExpired(stored: StoredTokens, leewaySeconds = 60): boolean {
  return Date.now() >= stored.expiresAt - leewaySeconds * 1000
}

export { AUTH_COOKIE }
