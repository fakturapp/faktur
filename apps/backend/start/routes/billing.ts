import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const Checkout = () => import('#controllers/billing/checkout')
const CheckoutShow = () => import('#controllers/billing/checkout_show')
const Portal = () => import('#controllers/billing/portal')
const Cancel = () => import('#controllers/billing/cancel')
const ScheduleChange = () => import('#controllers/billing/schedule_change')
const SyncSubscription = () => import('#controllers/billing/sync')

const billingGroup = router
  .group(() => {
    router.post('/billing/checkout', [Checkout, 'handle']).as('billing_checkout')
    router.get('/billing/checkout/:id', [CheckoutShow, 'handle']).as('billing_checkout_show')
    router.post('/billing/portal', [Portal, 'handle']).as('billing_portal')
    router.post('/billing/cancel', [Cancel, 'handle']).as('billing_cancel')
    router.post('/billing/schedule-change', [ScheduleChange, 'handle']).as('billing_schedule_change')
    router.post('/billing/sync', [SyncSubscription, 'handle']).as('billing_sync')
  })
  .use(middleware.auth())

if (API_PREFIX) billingGroup.prefix(API_PREFIX)
