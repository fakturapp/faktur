import router from '@adonisjs/core/services/router'

const StripeWebhook = () => import('#controllers/webhooks/stripe_webhook')

router.post('/webhooks/stripe', [StripeWebhook, 'handle'])
