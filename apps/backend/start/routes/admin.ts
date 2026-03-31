import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const AdminFeedbacks = () => import('#controllers/admin/feedbacks')
const AdminBugReports = () => import('#controllers/admin/bug_reports')
const AdminEmailBlocklist = () => import('#controllers/admin/email_blocklist')
const AdminEmailAppeals = () => import('#controllers/admin/email_appeals')

// Admin routes
router
  .group(() => {
    router.get('/feedbacks', [AdminFeedbacks, 'handle'])
    router.get('/bug-reports', [AdminBugReports, 'index'])
    router.patch('/bug-reports/:id', [AdminBugReports, 'update'])

    // Email blocklist management
    router.get('/email-blocklist', [AdminEmailBlocklist, 'index'])
    router.post('/email-blocklist', [AdminEmailBlocklist, 'store'])
    router.delete('/email-blocklist/:domain', [AdminEmailBlocklist, 'destroy'])

    // Email appeals management
    router.get('/email-appeals', [AdminEmailAppeals, 'index'])
    router.patch('/email-appeals/:id', [AdminEmailAppeals, 'update'])
  })
  .use([middleware.auth(), middleware.admin()])
  .prefix(API_PREFIX + '/admin')
