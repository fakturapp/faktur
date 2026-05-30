import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const Checkout = () => import('#controllers/billing/checkout')
const CheckoutShow = () => import('#controllers/billing/checkout_show')
const Portal = () => import('#controllers/billing/portal')

const billingGroup = router
  .group(() => {
    router.post('/billing/checkout', [Checkout, 'handle'])
    router.get('/billing/checkout/:id', [CheckoutShow, 'handle'])
    router.post('/billing/portal', [Portal, 'handle'])
  })
  .use(middleware.auth())

if (API_PREFIX) billingGroup.prefix(API_PREFIX)
