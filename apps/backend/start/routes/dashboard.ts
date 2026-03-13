import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const DashboardStats = () => import('#controllers/dashboard/stats')

router
  .group(() => {
    router.get('/', [DashboardStats, 'handle'])
    router.get('/stats', [DashboardStats, 'handle'])
  })
  .prefix('/dashboard')
  .use(middleware.auth())
