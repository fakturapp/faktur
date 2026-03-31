/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string.optional(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Session (keep for shield CSRF)
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  // Database (PostgreSQL)
  DATABASE_URL: Env.schema.string.optional(),
  DB_HOST: Env.schema.string.optional(),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional(),

  // Encryption (for 2FA secrets, recovery codes)
  ENCRYPTION_KEY: Env.schema.string.optional(),

  // Analytics encryption (falls back to ENCRYPTION_KEY)
  ANALYTICS_ENCRYPTION_KEY: Env.schema.string.optional(),

  // Email (Resend)
  RESEND_API_KEY: Env.schema.string.optional(),
  MAIL_FROM_ADDRESS: Env.schema.string.optional(),
  MAIL_FROM_NAME: Env.schema.string.optional(),

  // Frontend URL (for email links)
  FRONTEND_URL: Env.schema.string.optional(),

  // API prefix (e.g. /api/v1)
  API_PREFIX: Env.schema.string.optional(),

  // CORS (comma-separated allowed origins for production)
  CORS_ORIGIN: Env.schema.string.optional(),

  // Google OAuth (for Gmail email sending)
  GOOGLE_CLIENT_ID: Env.schema.string.optional(),
  GOOGLE_CLIENT_SECRET: Env.schema.string.optional(),
  GOOGLE_REDIRECT_URI: Env.schema.string.optional(),

  // Google OAuth (for login/register authentication)
  GOOGLE_AUTH_REDIRECT_URI: Env.schema.string.optional(),

  // Cloudflare Turnstile (captcha)
  CAPTCHA_ENABLED: Env.schema.boolean.optional(),
  CLOUDFLARE_TURNSTILE_SECRET_KEY: Env.schema.string.optional(),

  // OCR (receipt extraction)
  OCR_PROVIDER: Env.schema.enum.optional(['mock', 'mindee'] as const),
  MINDEE_API_KEY: Env.schema.string.optional(),

  // Rate limiter
  LIMITER_STORE: Env.schema.enum.optional(['database', 'memory'] as const),

  // AI providers
  ANTHROPIC_API_KEY: Env.schema.string.optional(),
  GEMINI_API_KEY: Env.schema.string.optional(),
  GROQ_API_KEY: Env.schema.string.optional(),

  // Admin (comma-separated emails)
  ADMIN_EMAILS: Env.schema.string.optional(),

  // Cloudflare R2 (S3-compatible object storage)
  R2_ACCOUNT_ID: Env.schema.string.optional(),
  R2_ACCESS_KEY_ID: Env.schema.string.optional(),
  R2_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  R2_BUCKET_NAME: Env.schema.string.optional(),
  R2_PUBLIC_URL: Env.schema.string.optional(),

  // Stripe (billing)
  STRIPE_SECRET_KEY_DEV: Env.schema.string.optional(),
  STRIPE_SECRET_KEY_PROD: Env.schema.string.optional(),
  STRIPE_WEBHOOK_SECRET_DEV: Env.schema.string.optional(),
  STRIPE_WEBHOOK_SECRET_PROD: Env.schema.string.optional(),
  STRIPE_AI_PRO_PRICE_ID: Env.schema.string.optional(),

  // Feature flags
  ENABLE_AI_FEATURES: Env.schema.string.optional(),
})
