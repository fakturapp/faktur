import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const DashboardStats = () => import('#controllers/dashboard/stats')
const SidebarCounts = () => import('#controllers/dashboard/sidebar_counts')

router
  .group(() => {
    router.get('/', [DashboardStats, 'handle']).as('dashboard.index')
    router.get('/stats', [DashboardStats, 'handle']).as('dashboard.stats')
    router.get('/sidebar-counts', [SidebarCounts, 'handle']).as('dashboard.sidebarCounts')
  })
  .prefix('/dashboard')
  .use(middleware.auth())
