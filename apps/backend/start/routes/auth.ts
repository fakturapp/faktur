import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const Login = () => import('#controllers/auth/session/login')
const Logout = () => import('#controllers/auth/session/logout')
const Me = () => import('#controllers/auth/session/me')

const Signup = () => import('#controllers/auth/registration/signup')

const PasswordResetRequest = () => import('#controllers/auth/security/password_reset/request')
const PasswordReset = () => import('#controllers/auth/security/password_reset/reset')
const VerifyEmail = () => import('#controllers/auth/security/email/verify')
const ResendVerification = () => import('#controllers/auth/security/email/resend')
const TwoFactorVerify = () => import('#controllers/auth/security/two_factor/verify')

router
  .group(() => {
    router.post('/sign-up', [Signup, 'handle'])
    router.post('/verify-email', [VerifyEmail, 'handle'])
    router.post('/resend-verification', [ResendVerification, 'handle'])

    router.post('/login', [Login, 'handle'])
    router.post('/login/2fa', [TwoFactorVerify, 'handle'])

    router.post('/password/forgot', [PasswordResetRequest, 'handle'])
    router.post('/password/reset', [PasswordReset, 'handle'])

    router
      .group(() => {
        router.post('/logout', [Logout, 'handle'])
        router.get('/me', [Me, 'handle'])
      })
      .use(middleware.auth())
  })
  .prefix('/auth')
