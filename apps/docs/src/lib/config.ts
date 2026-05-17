function requireEnv(key: string): string {
  const raw = typeof process !== 'undefined' ? process.env[key] : undefined
  if (!raw || !raw.trim()) {
    throw new Error(
      `[docs] missing env var ${key} — set it in apps/docs/.env (see .env.example)`
    )
  }
  return raw.trim().replace(/\/+$/, '')
}

export const API_V2_BASE_URL = requireEnv('NEXT_PUBLIC_API_V2_BASE_URL')
export const DASHBOARD_URL = requireEnv('NEXT_PUBLIC_DASHBOARD_URL')
export const DOCS_URL = requireEnv('NEXT_PUBLIC_DOCS_URL')
export const PLATFORM_URL = requireEnv('NEXT_PUBLIC_PLATFORM_URL')
