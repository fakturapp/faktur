import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const ProfileShow = () => import('#controllers/account/show')

const TwoFactorSetup = () => import('#controllers/account/two_factor/setup')
const TwoFactorEnable = () => import('#controllers/account/two_factor/enable')
const TwoFactorDisable = () => import('#controllers/account/two_factor/disable')

router
  .group(() => {
    router.get('/profile', [ProfileShow, 'handle'])

    router.post('/2fa/setup', [TwoFactorSetup, 'handle'])
    router.post('/2fa/enable', [TwoFactorEnable, 'handle'])
    router.post('/2fa/disable', [TwoFactorDisable, 'handle'])
  })
  .prefix('/account')
  .use(middleware.auth())
