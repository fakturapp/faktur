import limiter from '@adonisjs/limiter/services/main'


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

export const registerLimiter = limiter.define('register', (ctx) => {
  return limiter
    .allowRequests(3)
    .every('1 hour')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage("Trop d'inscriptions. Réessayez plus tard.")
    })
})

export const passwordResetLimiter = limiter.define('password-reset', (ctx) => {
  return limiter
    .allowRequests(3)
    .every('1 hour')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage('Trop de demandes de réinitialisation. Réessayez plus tard.')
    })
})

export const emailVerificationLimiter = limiter.define('email-verification', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('1 hour')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage("Trop de demandes de vérification d'email. Réessayez plus tard.")
    })
})

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

export const analyticsLimiter = limiter.define('analytics', (ctx) => {
  return limiter
    .allowRequests(30)
    .every('1 minute')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage('Trop de requêtes analytics. Réessayez plus tard.')
    })
})

export const passkeyLimiter = limiter.define('passkey', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('15 minutes')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage('Trop de tentatives passkey. Réessayez plus tard.')
    })
})

export const collaborationShareLimiter = limiter.define('collaboration-share', (ctx) => {
  return limiter
    .allowRequests(20)
    .every('1 hour')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage('Trop de partages. Réessayez plus tard.')
    })
})

export const shareLinkValidationLimiter = limiter.define('share-link-validation', (ctx) => {
  return limiter
    .allowRequests(30)
    .every('15 minutes')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage('Trop de tentatives. Réessayez plus tard.')
    })
})

export const checkoutLimiter = limiter.define('checkout', (ctx) => {
  return limiter
    .allowRequests(30)
    .every('15 minutes')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage('Trop de requêtes. Réessayez plus tard.')
    })
})

export const checkoutPasswordLimiter = limiter.define('checkout-password', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('15 minutes')
    .usingKey(`${ctx.request.ip()}:${ctx.params.token}`)
    .blockFor('30 minutes')
    .limitExceeded((error) => {
      error.setMessage('Trop de tentatives. Réessayez dans 30 minutes.')
    })
})

/** Checkout mark-paid: 3 requests per hour per IP */
export const checkoutMarkPaidLimiter = limiter.define('checkout-mark-paid', (ctx) => {
  return limiter
    .allowRequests(3)
    .every('1 hour')
    .usingKey(ctx.request.ip())
    .limitExceeded((error) => {
      error.setMessage('Trop de requêtes de paiement. Réessayez plus tard.')
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
