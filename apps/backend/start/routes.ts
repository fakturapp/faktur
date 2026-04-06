import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

import '#start/routes/auth'
import '#start/routes/account'
import '#start/routes/onboarding'
import '#start/routes/dashboard'
import '#start/routes/team'
import '#start/routes/company'
import '#start/routes/client'
import '#start/routes/settings'
import '#start/routes/quote'
import '#start/routes/invoice'
import '#start/routes/einvoicing'
import '#start/routes/email'
import '#start/routes/product'
import '#start/routes/credit_note'
import '#start/routes/recurring_invoice'
import '#start/routes/reminder'
import '#start/routes/expense'
import '#start/routes/tax'
import '#start/routes/export'
import '#start/routes/ai'
import '#start/routes/admin'
import '#start/routes/analytics'
import '#start/routes/collaboration'
import '#start/routes/payment_link'

// Feedback & bug report routes (inline to avoid import issues)
const CreateFeedback = () => import('#controllers/feedback/create')
const MyFeedback = () => import('#controllers/feedback/mine')
const CreateBugReport = () => import('#controllers/bug_report/create')

const feedbackGroup = router
  .group(() => {
    router.post('/feedback', [CreateFeedback, 'handle'])
    router.get('/feedback/mine', [MyFeedback, 'handle'])
    router.post('/bug-report', [CreateBugReport, 'handle'])
  })
  .use(middleware.auth())
if (API_PREFIX) feedbackGroup.prefix(API_PREFIX)

router.get(API_PREFIX + '/', async () => {
  return {
    name: 'Faktur API',
    version: '1.7.9',
    prefix: API_PREFIX || '/',
    status: 'healthy',
  }
})

router.get(API_PREFIX + '/health', async () => {
  return { status: 'ok' }
})

// Startup diagnostic — visible in Dokploy container logs
console.log(`[faktur] v1.2.8 routes loaded | API_PREFIX=${JSON.stringify(API_PREFIX)}`)
