import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

/**
 * Parses CORS_ORIGIN env var (comma-separated) into an array of origins.
 * Returns true in dev (allow all), or the parsed array in production.
 */
function resolveOrigin(): true | string[] {
  if (app.inDev) return true
  const raw = env.get('CORS_ORIGIN', '')
  if (!raw) return []
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  /**
   * In development, allow every origin to simplify local front/backend setup.
   * In production, use the CORS_ORIGIN env var (comma-separated list of allowed origins).
   */
  origin: resolveOrigin(),

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * Reflect request headers by default. Use a string array to restrict
   * allowed headers.
   */
  headers: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Socket-Id',
    'Baggage',
    'Sentry-Trace',
  ],

  /**
   * Response headers exposed to the browser.
   */
  exposeHeaders: ['Content-Disposition'],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 7200,
})

export default corsConfig
