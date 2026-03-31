import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const Checkout = () => import('#controllers/billing/checkout')
const Portal = () => import('#controllers/billing/portal')
const Status = () => import('#controllers/billing/status')
const Usage = () => import('#controllers/billing/usage')
const Webhook = () => import('#controllers/billing/webhook')

// Authenticated billing routes
router
  .group(() => {
    router.post('/checkout', [Checkout, 'handle'])
    router.post('/portal', [Portal, 'handle'])
    router.get('/status', [Status, 'handle'])
    router.get('/usage', [Usage, 'handle'])
  })
  .prefix(API_PREFIX + '/billing')
  .use(middleware.auth())

// Public webhook route (no auth — Stripe calls this)
router.post(API_PREFIX + '/billing/webhook', [Webhook, 'handle'])
