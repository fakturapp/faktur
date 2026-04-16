
import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string.optional(),

  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  DATABASE_URL: Env.schema.string.optional(),
  DB_HOST: Env.schema.string.optional(),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional(),

  ENCRYPTION_KEY: Env.schema.string.optional(),

  ANALYTICS_ENCRYPTION_KEY: Env.schema.string.optional(),

  RESEND_API_KEY: Env.schema.string.optional(),
  MAIL_FROM_ADDRESS: Env.schema.string.optional(),
  MAIL_FROM_NAME: Env.schema.string.optional(),

  FRONTEND_URL: Env.schema.string.optional(),

  API_PREFIX: Env.schema.string.optional(),

  CORS_ORIGIN: Env.schema.string.optional(),

  GOOGLE_CLIENT_ID: Env.schema.string.optional(),
  GOOGLE_CLIENT_SECRET: Env.schema.string.optional(),
  GOOGLE_REDIRECT_URI: Env.schema.string.optional(),

  GOOGLE_AUTH_REDIRECT_URI: Env.schema.string.optional(),

  CAPTCHA_ENABLED: Env.schema.boolean.optional(),
  CLOUDFLARE_TURNSTILE_SECRET_KEY: Env.schema.string.optional(),

  OCR_PROVIDER: Env.schema.enum.optional(['mock', 'mindee'] as const),
  MINDEE_API_KEY: Env.schema.string.optional(),

  LIMITER_STORE: Env.schema.enum.optional(['database', 'memory'] as const),

  OPENROUTER_API_KEY: Env.schema.string.optional(),

  ADMIN_EMAILS: Env.schema.string.optional(),

  WEBAUTHN_RP_ID: Env.schema.string.optional(),
  WEBAUTHN_ORIGIN: Env.schema.string.optional(),

  CHECKOUT_URL: Env.schema.string.optional(),

  R2_ACCOUNT_ID: Env.schema.string.optional(),
  R2_ACCESS_KEY_ID: Env.schema.string.optional(),
  R2_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  R2_BUCKET_NAME: Env.schema.string.optional(),
  R2_PUBLIC_URL: Env.schema.string.optional(),

  B2BROUTER_WEBHOOK_SECRET: Env.schema.string.optional(),
})
