import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const DashboardStats = () => import('#controllers/dashboard/stats')

router
  .group(() => {
    router.get('/', [DashboardStats, 'handle']).as('dashboard.index')
    router.get('/stats', [DashboardStats, 'handle']).as('dashboard.stats')
  })
  .prefix('/dashboard')
  .use(middleware.auth())
