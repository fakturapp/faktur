import router from '@adonisjs/core/services/router'

const StripeWebhook = () => import('#controllers/webhooks/stripe_webhook')
const StripeBillingWebhook = () => import('#controllers/webhooks/stripe_billing_webhook')

router.post('/webhooks/stripe', [StripeWebhook, 'handle'])
router.post('/webhooks/stripe/billing', [StripeBillingWebhook, 'handle'])
