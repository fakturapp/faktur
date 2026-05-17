import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const ProjectsList = () => import('#controllers/dashboard/api_projects/list')
const ProjectsShow = () => import('#controllers/dashboard/api_projects/show')
const ProjectsCreate = () => import('#controllers/dashboard/api_projects/create')
const ProjectsUpdate = () => import('#controllers/dashboard/api_projects/update')
const ProjectsDestroy = () => import('#controllers/dashboard/api_projects/destroy')
const ProjectsAuditLogs = () => import('#controllers/dashboard/api_projects/audit_logs')

const KeysList = () => import('#controllers/dashboard/api_keys/list')
const KeysShow = () => import('#controllers/dashboard/api_keys/show')
const KeysCreate = () => import('#controllers/dashboard/api_keys/create')
const KeysUpdate = () => import('#controllers/dashboard/api_keys/update')
const KeysRotate = () => import('#controllers/dashboard/api_keys/rotate')
const KeysRevoke = () => import('#controllers/dashboard/api_keys/revoke')
const WebhookSet = () => import('#controllers/dashboard/api_keys/webhook_set')
const WebhookDestroy = () => import('#controllers/dashboard/api_keys/webhook_destroy')
const WebhookRotateSecret = () => import('#controllers/dashboard/api_keys/webhook_rotate_secret')
const WebhookTest = () => import('#controllers/dashboard/api_keys/webhook_test')
const DeliveriesList = () => import('#controllers/dashboard/api_keys/deliveries_list')
const DeliveriesRetry = () => import('#controllers/dashboard/api_keys/deliveries_retry')
const LogsList = () => import('#controllers/dashboard/api_keys/logs_list')
const UsageStats = () => import('#controllers/dashboard/api_keys/usage_stats')
const ScopesCatalog = () => import('#controllers/dashboard/api_keys/scopes_catalog')

router
  .group(() => {
    router
      .get('/api-keys/scopes-catalog', [ScopesCatalog, 'handle'])
      .as('dashboard.apiKeys.scopesCatalog')

    router.get('/api-projects', [ProjectsList, 'handle']).as('dashboard.apiProjects.list')
    router.post('/api-projects', [ProjectsCreate, 'handle']).as('dashboard.apiProjects.create')
    router.get('/api-projects/:id', [ProjectsShow, 'handle']).as('dashboard.apiProjects.show')
    router.patch('/api-projects/:id', [ProjectsUpdate, 'handle']).as('dashboard.apiProjects.update')
    router
      .delete('/api-projects/:id', [ProjectsDestroy, 'handle'])
      .as('dashboard.apiProjects.destroy')
    router
      .get('/api-projects/:id/audit-logs', [ProjectsAuditLogs, 'handle'])
      .as('dashboard.apiProjects.auditLogs')

    router.get('/api-keys', [KeysList, 'handle']).as('dashboard.apiKeys.list')
    router.post('/api-keys', [KeysCreate, 'handle']).as('dashboard.apiKeys.create')
    router.get('/api-keys/:id', [KeysShow, 'handle']).as('dashboard.apiKeys.show')
    router.patch('/api-keys/:id', [KeysUpdate, 'handle']).as('dashboard.apiKeys.update')
    router.delete('/api-keys/:id', [KeysRevoke, 'handle']).as('dashboard.apiKeys.revoke')
    router.post('/api-keys/:id/rotate', [KeysRotate, 'handle']).as('dashboard.apiKeys.rotate')

    router.put('/api-keys/:id/webhook', [WebhookSet, 'handle']).as('dashboard.apiKeys.webhook.set')
    router
      .delete('/api-keys/:id/webhook', [WebhookDestroy, 'handle'])
      .as('dashboard.apiKeys.webhook.destroy')
    router
      .post('/api-keys/:id/webhook/rotate-secret', [WebhookRotateSecret, 'handle'])
      .as('dashboard.apiKeys.webhook.rotateSecret')
    router
      .post('/api-keys/:id/webhook/test', [WebhookTest, 'handle'])
      .as('dashboard.apiKeys.webhook.test')

    router
      .get('/api-keys/:id/deliveries', [DeliveriesList, 'handle'])
      .as('dashboard.apiKeys.deliveries.list')
    router
      .post('/api-keys/:id/deliveries/:deliveryId/retry', [DeliveriesRetry, 'handle'])
      .as('dashboard.apiKeys.deliveries.retry')

    router.get('/api-keys/:id/logs', [LogsList, 'handle']).as('dashboard.apiKeys.logs')
    router
      .get('/api-keys/:id/usage-stats', [UsageStats, 'handle'])
      .as('dashboard.apiKeys.usageStats')
  })
  .prefix(API_PREFIX + '/dashboard/settings')
  .use(middleware.auth())
  .use(middleware.vault())
