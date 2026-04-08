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

router
  .group(() => {
    router.post('/ingest', [AnalyticsIngest, 'handle'])
    router.post('/consent', [AnalyticsConsent, 'handle'])
  })
  .prefix(API_PREFIX + '/analytics')

router
  .group(() => {
    router.get('/overview', [AnalyticsOverview, 'handle'])
    router.get('/pages', [AnalyticsPages, 'handle'])
    router.get('/features', [AnalyticsFeatures, 'handle'])
    router.get('/errors', [AnalyticsErrors, 'handle'])
    router.patch('/errors/:id', [AnalyticsErrors, 'resolve'])
    router.get('/performance', [AnalyticsPerformance, 'handle'])
    router.get('/users', [AnalyticsUsers, 'handle'])
  })
  .use([middleware.auth(), middleware.admin()])
  .prefix(API_PREFIX + '/admin/analytics')
