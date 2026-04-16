
import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

server.use([
  () => import('#middleware/core/container_bindings_middleware'),
  () => import('#middleware/core/request_id_middleware'),
  () => import('#middleware/core/force_json_response_middleware'),
  () => import('#middleware/security/helmet_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
])

router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
  () => import('@adonisjs/shield/shield_middleware'),
])

export const middleware = router.named({
  auth: () => import('#middleware/auth/auth_middleware'),
  emailVerified: () => import('#middleware/auth/email_verified_middleware'),
  twoFactorVerified: () => import('#middleware/auth/two_factor_verified_middleware'),
  onboardingCompleted: () => import('#middleware/auth/onboarding_completed_middleware'),
  vault: () => import('#middleware/crypto/vault_middleware'),
  admin: () => import('#middleware/auth/admin_middleware'),
  teamRole: () => import('#middleware/auth/team_role_middleware'),
})
