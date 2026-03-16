import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const ProfileShow = () => import('#controllers/account/profile/show')
const ProfileUpdate = () => import('#controllers/account/profile/update')
const AccountDelete = () => import('#controllers/account/profile/delete')
const UploadAvatar = () => import('#controllers/account/profile/upload_avatar')
const ServeAvatar = () => import('#controllers/account/profile/serve_avatar')

const PasswordChange = () => import('#controllers/account/security/password')
const SecurityVerify = () => import('#controllers/account/security/security_verify')
const SessionRevoke = () => import('#controllers/account/security/revoke_session')
const SessionsList = () => import('#controllers/account/security/sessions')

const TwoFactorSetup = () => import('#controllers/account/two_factor/setup')
const TwoFactorEnable = () => import('#controllers/account/two_factor/enable')
const TwoFactorDisable = () => import('#controllers/account/two_factor/disable')

const EmailRequestChange = () => import('#controllers/account/email/email_request_change')
const EmailConfirmChange = () => import('#controllers/account/email/email_confirm_change')

// Public route - serve avatars
router.get(API_PREFIX + '/avatars/:filename', [ServeAvatar, 'handle'])

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

    router.post('/email/request-change', [EmailRequestChange, 'handle'])
    router.post('/email/confirm-change', [EmailConfirmChange, 'handle'])
  })
  .prefix(API_PREFIX + '/account')
  .use(middleware.auth())
