import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const AdminFeedbacks = () => import('#controllers/admin/feedbacks')
const AdminBugReports = () => import('#controllers/admin/bug_reports')

// OAuth admin controllers
const ListOauthApps = () => import('#controllers/admin/oauth_apps/list')
const CreateOauthApp = () => import('#controllers/admin/oauth_apps/create')
const UpdateOauthApp = () => import('#controllers/admin/oauth_apps/update')
const DestroyOauthApp = () => import('#controllers/admin/oauth_apps/destroy')
const RotateOauthAppSecrets = () => import('#controllers/admin/oauth_apps/rotate_secrets')
const RevokeOauthAppSessions = () => import('#controllers/admin/oauth_apps/revoke_sessions')

// Admin routes
router
  .group(() => {
    router.get('/feedbacks', [AdminFeedbacks, 'handle'])
    router.get('/bug-reports', [AdminBugReports, 'index'])
    router.patch('/bug-reports/:id', [AdminBugReports, 'update'])

    // OAuth apps management
    router.get('/oauth-apps', [ListOauthApps, 'handle'])
    router.post('/oauth-apps', [CreateOauthApp, 'handle'])
    router.put('/oauth-apps/:id', [UpdateOauthApp, 'handle'])
    router.delete('/oauth-apps/:id', [DestroyOauthApp, 'handle'])
    router.post('/oauth-apps/:id/rotate-secrets', [RotateOauthAppSecrets, 'handle'])
    router.post('/oauth-apps/:id/revoke-sessions', [RevokeOauthAppSessions, 'handle'])
  })
  .use([middleware.auth(), middleware.admin()])
  .prefix(API_PREFIX + '/admin')
