import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const EmailAccountsList = () => import('#controllers/email/accounts/list')
const EmailAccountsDelete = () => import('#controllers/email/accounts/delete')
const EmailAccountsSetDefault = () => import('#controllers/email/accounts/set_default')
const GmailAuthUrl = () => import('#controllers/email/oauth/gmail_auth_url')
const GmailCallback = () => import('#controllers/email/oauth/gmail_callback')
const SendEmail = () => import('#controllers/email/send/send_email')
const SendTestEmail = () => import('#controllers/email/send/send_test_email')
const ListEmailLogs = () => import('#controllers/email/logs/list')

// Public route - Gmail OAuth callback (no auth required, redirects to frontend)
router.get(API_PREFIX + '/email/oauth/gmail/callback', [GmailCallback, 'handle'])

router
  .group(() => {
    // Email accounts management
    router.get('/accounts', [EmailAccountsList, 'handle'])
    router.delete('/accounts/:id', [EmailAccountsDelete, 'handle'])
    router.patch('/accounts/:id/default', [EmailAccountsSetDefault, 'handle'])

    // OAuth
    router.get('/oauth/gmail/url', [GmailAuthUrl, 'handle'])

    // Send (POST only — reject GET with 405)
    router.post('/send', [SendEmail, 'handle'])
    router.get('/send', async ({ response }) => response.status(405).send({ message: 'Method not allowed. Use POST.' }))
    router.post('/test', [SendTestEmail, 'handle'])

    // Logs
    router.get('/logs', [ListEmailLogs, 'handle'])
  })
  .prefix(API_PREFIX + '/email')
  .use(middleware.auth())
