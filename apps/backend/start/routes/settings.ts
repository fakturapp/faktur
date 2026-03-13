import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const InvoiceSettingsShow = () => import('#controllers/settings/invoice_settings_show')
const InvoiceSettingsUpdate = () => import('#controllers/settings/invoice_settings_update')
const InvoiceLogoUpload = () => import('#controllers/settings/invoice_logo_upload')
const ServeInvoiceLogo = () => import('#controllers/settings/serve_invoice_logo')

// Public route - serve invoice logos
router.get('/invoice-logos/:filename', [ServeInvoiceLogo, 'handle'])

router
  .group(() => {
    router.get('/invoices', [InvoiceSettingsShow, 'handle'])
    router.put('/invoices', [InvoiceSettingsUpdate, 'handle'])
    router.post('/invoices/logo', [InvoiceLogoUpload, 'handle'])
  })
  .prefix('/settings')
  .use(middleware.auth())
