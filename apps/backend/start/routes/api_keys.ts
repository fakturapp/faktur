import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

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
    router.get('/api-keys/scopes-catalog', [ScopesCatalog, 'handle'])
    router.get('/api-keys', [KeysList, 'handle'])
    router.post('/api-keys', [KeysCreate, 'handle'])
    router.get('/api-keys/:id', [KeysShow, 'handle'])
    router.patch('/api-keys/:id', [KeysUpdate, 'handle'])
    router.delete('/api-keys/:id', [KeysRevoke, 'handle'])
    router.post('/api-keys/:id/rotate', [KeysRotate, 'handle'])

    router.put('/api-keys/:id/webhook', [WebhookSet, 'handle'])
    router.delete('/api-keys/:id/webhook', [WebhookDestroy, 'handle'])
    router.post('/api-keys/:id/webhook/rotate-secret', [WebhookRotateSecret, 'handle'])
    router.post('/api-keys/:id/webhook/test', [WebhookTest, 'handle'])

    router.get('/api-keys/:id/deliveries', [DeliveriesList, 'handle'])
    router.post('/api-keys/:id/deliveries/:deliveryId/retry', [DeliveriesRetry, 'handle'])

    router.get('/api-keys/:id/logs', [LogsList, 'handle'])
    router.get('/api-keys/:id/usage-stats', [UsageStats, 'handle'])
  })
  .prefix(API_PREFIX + '/dashboard/settings')
  .use(middleware.auth())
  .use(middleware.vault())
