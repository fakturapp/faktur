import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const InvoiceSettingsShow = () => import('#controllers/settings/invoice/invoice_settings_show')
const InvoiceSettingsUpdate = () => import('#controllers/settings/invoice/invoice_settings_update')
const InvoiceLogoUpload = () => import('#controllers/settings/invoice/invoice_logo_upload')
const ServeInvoiceLogo = () => import('#controllers/settings/invoice/serve_invoice_logo')

// Public route - serve invoice logos
router.get(API_PREFIX + '/invoice-logos/:filename', [ServeInvoiceLogo, 'handle'])

router
  .group(() => {
    router.get('/invoices', [InvoiceSettingsShow, 'handle'])
    router.put('/invoices', [InvoiceSettingsUpdate, 'handle'])
    router.post('/invoices/logo', [InvoiceLogoUpload, 'handle'])
  })
  .prefix(API_PREFIX + '/settings')
  .use(middleware.auth())
