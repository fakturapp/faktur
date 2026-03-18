import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  twoFactorLimiter,
} from '#middleware/security/rate_limit_middleware'

const Login = () => import('#controllers/auth/session/login')
const Logout = () => import('#controllers/auth/session/logout')
const Me = () => import('#controllers/auth/session/me')
const Signup = () => import('#controllers/auth/registration/signup')

const PasswordResetRequest = () => import('#controllers/auth/security/password_reset/request')
const PasswordReset = () => import('#controllers/auth/security/password_reset/reset')
const VerifyEmail = () => import('#controllers/auth/security/email/verify')
const ResendVerification = () => import('#controllers/auth/security/email/resend')
const TwoFactorVerify = () => import('#controllers/auth/security/two_factor/verify')
const CryptoRecover = () => import('#controllers/auth/security/crypto_recover')
const CryptoWipe = () => import('#controllers/auth/security/crypto_wipe')

router
  .group(() => {
    router.post('/sign-up', [Signup, 'handle']).use(registerLimiter)
    router.post('/verify-email', [VerifyEmail, 'handle']).use(emailVerificationLimiter)
    router.post('/resend-verification', [ResendVerification, 'handle']).use(emailVerificationLimiter)

    router.post('/login', [Login, 'handle']).use(loginLimiter)
    router.post('/login/2fa', [TwoFactorVerify, 'handle']).use(twoFactorLimiter)

    router.post('/password/forgot', [PasswordResetRequest, 'handle']).use(passwordResetLimiter)
    router.post('/password/reset', [PasswordReset, 'handle']).use(passwordResetLimiter)

    router
      .group(() => {
        router.post('/logout', [Logout, 'handle'])
        router.get('/me', [Me, 'handle'])
        router.post('/crypto/recover', [CryptoRecover, 'handle'])
        router.post('/crypto/wipe', [CryptoWipe, 'handle'])
      })
      .use(middleware.auth())
  })
  .prefix(API_PREFIX + '/auth')
