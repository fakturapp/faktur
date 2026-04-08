import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

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
