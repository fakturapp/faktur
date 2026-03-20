import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const DashboardStats = () => import('#controllers/dashboard/stats')
const SidebarCounts = () => import('#controllers/dashboard/sidebar_counts')
const DashboardCharts = () => import('#controllers/dashboard/charts')
const CashFlow = () => import('#controllers/dashboard/cash_flow')

router
  .group(() => {
    router.get('/', [DashboardStats, 'handle']).as('dashboard.index')
    router.get('/stats', [DashboardStats, 'handle']).as('dashboard.stats')
    router.get('/sidebar-counts', [SidebarCounts, 'handle']).as('dashboard.sidebarCounts')

    // Chart endpoints
    router.get('/charts', [DashboardCharts, 'handle']).as('dashboard.charts')
    router.get('/charts/revenue', [DashboardCharts, 'revenue']).as('dashboard.charts.revenue')
    router.get('/charts/collected', [DashboardCharts, 'collected']).as('dashboard.charts.collected')
    router.get('/charts/micro-thresholds', [DashboardCharts, 'micro']).as('dashboard.charts.micro')

    // Cash flow forecast
    router.get('/cash-flow', [CashFlow, 'handle']).as('dashboard.cashFlow')
  })
  .prefix(API_PREFIX + '/dashboard')
  .use(middleware.auth())
  .use(middleware.vault())
