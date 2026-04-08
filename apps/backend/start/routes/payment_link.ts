import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'
import {
  checkoutLimiter,
  checkoutPasswordLimiter,
  checkoutMarkPaidLimiter,
} from '#start/limiter'

const PaymentLinkCreate = () => import('#controllers/invoice/payment_link/create')
const PaymentLinkShow = () => import('#controllers/invoice/payment_link/show')
const PaymentLinkDelete = () => import('#controllers/invoice/payment_link/delete')
const PaymentLinkConfirm = () => import('#controllers/invoice/payment_link/confirm_payment')
const PaymentLinkSendEmail = () => import('#controllers/invoice/payment_link/send_link_email')

const CheckoutShow = () => import('#controllers/invoice/payment_link/checkout_show')
const CheckoutVerifyPassword = () =>
  import('#controllers/invoice/payment_link/checkout_verify_password')
const CheckoutGetIban = () => import('#controllers/invoice/payment_link/checkout_get_iban')
const CheckoutMarkPaid = () => import('#controllers/invoice/payment_link/checkout_mark_paid')
const CheckoutDownloadPdf = () =>
  import('#controllers/invoice/payment_link/checkout_download_pdf')
const CheckoutCreateIntent = () =>
  import('#controllers/invoice/payment_link/checkout_create_intent')


const paymentLinkGroup = router
  .group(() => {
    router.get('/:invoiceId/payment-link', [PaymentLinkShow, 'handle'])
    router.post('/:invoiceId/payment-link', [PaymentLinkCreate, 'handle'])
    router.delete('/:invoiceId/payment-link', [PaymentLinkDelete, 'handle'])
    router.post('/:invoiceId/payment-link/confirm', [PaymentLinkConfirm, 'handle'])
    router.post('/:invoiceId/payment-link/send-email', [PaymentLinkSendEmail, 'handle'])
  })
  .prefix('/invoices')
  .use(middleware.auth())
  .use(middleware.vault())
if (API_PREFIX) paymentLinkGroup.prefix(API_PREFIX)


const checkoutGroup = router
  .group(() => {
    router.get('/:token', [CheckoutShow, 'handle']).use(checkoutLimiter)
    router
      .post('/:token/verify-password', [CheckoutVerifyPassword, 'handle'])
      .use(checkoutPasswordLimiter)
    router.get('/:token/iban', [CheckoutGetIban, 'handle']).use(checkoutLimiter)
    router.post('/:token/mark-paid', [CheckoutMarkPaid, 'handle']).use(checkoutMarkPaidLimiter)
    router.get('/:token/pdf', [CheckoutDownloadPdf, 'handle']).use(checkoutLimiter)
    router
      .post('/:token/create-stripe-intent', [CheckoutCreateIntent, 'handle'])
      .use(checkoutLimiter)
  })
  .prefix('/checkout')
if (API_PREFIX) checkoutGroup.prefix(API_PREFIX)
