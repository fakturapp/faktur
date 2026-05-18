function requireEnv(raw: string | undefined, key: string): string {
  if (!raw || !raw.trim()) {
    throw new Error(
      `[docs] missing env var ${key}. set it in apps/docs/.env (see .env.example)`
    )
  }
  return raw.trim().replace(/\/+$/, '')
}

export const API_PLATFORM_BASE_URL = requireEnv(
  process.env.NEXT_PUBLIC_API_PLATFORM_BASE_URL ?? process.env.NEXT_PUBLIC_API_V2_BASE_URL,
  'NEXT_PUBLIC_API_PLATFORM_BASE_URL'
)
export const API_BASE_URL = requireEnv(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_V2_BASE_URL,
  'NEXT_PUBLIC_API_BASE_URL'
)
export const API_V2_BASE_URL = API_BASE_URL

export const DASHBOARD_URL = requireEnv(
  process.env.NEXT_PUBLIC_DASHBOARD_URL,
  'NEXT_PUBLIC_DASHBOARD_URL'
)
export const DOCS_URL = requireEnv(process.env.NEXT_PUBLIC_DOCS_URL, 'NEXT_PUBLIC_DOCS_URL')
export const PLATFORM_URL = requireEnv(
  process.env.NEXT_PUBLIC_PLATFORM_URL,
  'NEXT_PUBLIC_PLATFORM_URL'
)
