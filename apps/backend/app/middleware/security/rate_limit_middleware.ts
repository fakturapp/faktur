import limiter from '@adonisjs/limiter/services/main'

/**
 * Pre-defined rate limiters for auth-sensitive routes.
 * Uses IP-based throttling to prevent brute-force attacks.
 */

/** Login: 5 requests per 15 minutes per IP */
export const loginLimiter = limiter.define('login', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('15 minutes')
    .usingKey(ctx.request.ip())
    .blockFor('30 minutes')
    .limitExceeded((error) => {
      error.setMessage('Trop de tentatives de connexion. Réessayez dans 30 minutes.')
    })
})

/** Registration: 3 requests per hour per IP */
export const registerLimiter = limiter.define('register', (ctx) => {
  return limiter
    .allowRequests(3)
    .every('1 hour')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage("Trop d'inscriptions. Réessayez plus tard.")
    })
})

/** Password reset: 3 requests per hour per IP */
export const passwordResetLimiter = limiter.define('password-reset', (ctx) => {
  return limiter
    .allowRequests(3)
    .every('1 hour')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage('Trop de demandes de réinitialisation. Réessayez plus tard.')
    })
})

/** Email verification: 5 requests per hour per IP */
export const emailVerificationLimiter = limiter.define('email-verification', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('1 hour')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage("Trop de demandes de vérification d'email. Réessayez plus tard.")
    })
})

/** 2FA verification: 5 requests per 15 minutes per IP */
export const twoFactorLimiter = limiter.define('2fa', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('15 minutes')
    .usingKey(ctx.request.ip())
    .blockFor('30 minutes')
    .limitExceeded((error) => {
      error.setMessage('Trop de tentatives 2FA. Réessayez dans 30 minutes.')
    })
})

/** Global API: 1000 requests per hour per IP */
export const apiLimiter = limiter.define('api', (ctx) => {
  return limiter
    .allowRequests(1000)
    .every('1 hour')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage('Limite de requêtes API dépassée. Réessayez plus tard.')
    })
})
