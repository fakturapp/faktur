import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Adds additional security headers beyond what @adonisjs/shield provides.
 * Covers: Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control,
 * X-Download-Options, X-Permitted-Cross-Domain-Policies, Cross-Origin policies.
 */
export default class HelmetMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.response.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    ctx.response.header('X-DNS-Prefetch-Control', 'off')
    ctx.response.header('X-Download-Options', 'noopen')
    ctx.response.header('X-Permitted-Cross-Domain-Policies', 'none')
    ctx.response.header('Cross-Origin-Opener-Policy', 'same-origin')
    ctx.response.header('Cross-Origin-Resource-Policy', 'same-origin')
    ctx.response.header('Cross-Origin-Embedder-Policy', 'credentialless')
    ctx.response.header(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'
    )

    return next()
  }
}
