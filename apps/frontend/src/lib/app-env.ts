/**
 * Deployment-environment flags, read from build-time NEXT_PUBLIC_* env vars.
 *
 * These mirror the backend's APP_ENV / ADMIN_ONLY. The backend is the real
 * enforcement point; these only drive UI (the PREPROD banner and the
 * admin-only redirect).
 */

export type AppEnv = 'development' | 'preprod' | 'production'

export const APP_ENV: AppEnv =
  (process.env.NEXT_PUBLIC_APP_ENV as AppEnv | undefined) ?? 'development'

/** True on a preprod server — shows the permanent warning banner. */
export const IS_PREPROD = APP_ENV === 'preprod'

/** True when the instance is locked to admins only. */
export const IS_ADMIN_ONLY = process.env.NEXT_PUBLIC_ADMIN_ONLY === 'true'
