import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const InvoiceSettingsShow = () => import('#controllers/settings/invoice/invoice_settings_show')
const InvoiceSettingsUpdate = () => import('#controllers/settings/invoice/invoice_settings_update')
const InvoiceLogoUpload = () => import('#controllers/settings/invoice/invoice_logo_upload')
const ServeInvoiceLogo = () => import('#controllers/settings/invoice/serve_invoice_logo')
const StripeSettingsShow = () => import('#controllers/settings/stripe/stripe_settings_show')
const StripeSettingsSave = () => import('#controllers/settings/stripe/stripe_settings_save')
const StripeSettingsDelete = () => import('#controllers/settings/stripe/stripe_settings_delete')

router.get(API_PREFIX + '/invoice-logos/:filename', [ServeInvoiceLogo, 'handle'])

router
  .group(() => {
    router.get('/invoices', [InvoiceSettingsShow, 'handle'])
    router.put('/invoices', [InvoiceSettingsUpdate, 'handle'])
    router.post('/invoices/logo', [InvoiceLogoUpload, 'handle'])

    router.get('/stripe', [StripeSettingsShow, 'handle'])
    router.put('/stripe', [StripeSettingsSave, 'handle'])
    router.delete('/stripe', [StripeSettingsDelete, 'handle'])
  })
  .prefix(API_PREFIX + '/settings')
  .use(middleware.auth())
  .use(middleware.vault())
