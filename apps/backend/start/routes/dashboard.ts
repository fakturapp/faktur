import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const DashboardStats = () => import('#controllers/dashboard/stats')
const SidebarCounts = () => import('#controllers/dashboard/sidebar_counts')

router
  .group(() => {
    router.get('/', [DashboardStats, 'handle']).as('dashboard.index')
    router.get('/stats', [DashboardStats, 'handle']).as('dashboard.stats')
    router.get('/sidebar-counts', [SidebarCounts, 'handle']).as('dashboard.sidebarCounts')
  })
  .prefix(API_PREFIX + '/dashboard')
  .use(middleware.auth())
