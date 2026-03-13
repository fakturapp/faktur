import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const ProfileShow = () => import('#controllers/account/show')
const ProfileUpdate = () => import('#controllers/account/update')
const PasswordChange = () => import('#controllers/account/password')
const SessionsList = () => import('#controllers/account/sessions')
const SessionRevoke = () => import('#controllers/account/revoke_session')
const AccountDelete = () => import('#controllers/account/delete')

const TwoFactorSetup = () => import('#controllers/account/two_factor/setup')
const TwoFactorEnable = () => import('#controllers/account/two_factor/enable')
const TwoFactorDisable = () => import('#controllers/account/two_factor/disable')

const SecurityVerify = () => import('#controllers/account/security_verify')
const UploadAvatar = () => import('#controllers/account/upload_avatar')
const ServeAvatar = () => import('#controllers/account/serve_avatar')

// Public route - serve avatars
router.get('/avatars/:filename', [ServeAvatar, 'handle'])

router
  .group(() => {
    router.get('/profile', [ProfileShow, 'handle'])
    router.put('/profile', [ProfileUpdate, 'handle'])
    router.put('/password', [PasswordChange, 'handle'])
    router.post('/avatar', [UploadAvatar, 'handle'])
    router.get('/sessions', [SessionsList, 'handle'])
    router.delete('/sessions/:id', [SessionRevoke, 'handle'])
    router.delete('/', [AccountDelete, 'handle'])

    router.post('/2fa/setup', [TwoFactorSetup, 'handle'])
    router.post('/2fa/enable', [TwoFactorEnable, 'handle'])
    router.post('/2fa/disable', [TwoFactorDisable, 'handle'])

    router.post('/security/send-code', [SecurityVerify, 'sendCode'])
    router.post('/security/verify', [SecurityVerify, 'verify'])
  })
  .prefix('/account')
  .use(middleware.auth())
