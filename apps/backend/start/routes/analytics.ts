import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const AnalyticsIngest = () => import('#controllers/analytics/ingest')
const AnalyticsConsent = () => import('#controllers/analytics/consent')
const AnalyticsOverview = () => import('#controllers/admin/analytics/overview')
const AnalyticsPages = () => import('#controllers/admin/analytics/pages')
const AnalyticsFeatures = () => import('#controllers/admin/analytics/features')
const AnalyticsErrors = () => import('#controllers/admin/analytics/errors')
const AnalyticsPerformance = () => import('#controllers/admin/analytics/performance')
const AnalyticsUsers = () => import('#controllers/admin/analytics/users')

// Public analytics routes (no auth required)
router
  .group(() => {
    router.post('/analytics/ingest', [AnalyticsIngest, 'handle'])
    router.post('/analytics/consent', [AnalyticsConsent, 'handle'])
  })
  .prefix(API_PREFIX)

// Admin analytics routes (auth + admin required)
router
  .group(() => {
    router.get('/analytics/overview', [AnalyticsOverview, 'handle'])
    router.get('/analytics/pages', [AnalyticsPages, 'handle'])
    router.get('/analytics/features', [AnalyticsFeatures, 'handle'])
    router.get('/analytics/errors', [AnalyticsErrors, 'handle'])
    router.patch('/analytics/errors/:id', [AnalyticsErrors, 'resolve'])
    router.get('/analytics/performance', [AnalyticsPerformance, 'handle'])
    router.get('/analytics/users', [AnalyticsUsers, 'handle'])
  })
  .use([middleware.auth(), middleware.admin()])
  .prefix(API_PREFIX + '/admin')
