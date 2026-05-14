export type AppEnv = 'development' | 'preprod' | 'production'

export const APP_ENV: AppEnv =
  (process.env.NEXT_PUBLIC_APP_ENV as AppEnv | undefined) ?? 'development'

export const IS_PREPROD = APP_ENV === 'preprod'

export const IS_ADMIN_ONLY = process.env.NEXT_PUBLIC_ADMIN_ONLY === 'true'
