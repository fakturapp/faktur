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
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Session (keep for shield CSRF)
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  // Database (PostgreSQL)
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  // Encryption (for 2FA secrets, recovery codes)
  ENCRYPTION_KEY: Env.schema.string.optional(),

  // Email (Resend)
  RESEND_API_KEY: Env.schema.string.optional(),

  // Frontend URL (for email links)
  FRONTEND_URL: Env.schema.string.optional(),

  // API prefix (e.g. /api/v1)
  API_PREFIX: Env.schema.string.optional(),
})
