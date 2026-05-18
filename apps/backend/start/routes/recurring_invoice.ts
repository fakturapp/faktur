import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const RecurringInvoiceList = () => import('#controllers/recurring_invoice/crud/list')
const RecurringInvoiceShow = () => import('#controllers/recurring_invoice/crud/show')
const RecurringInvoiceCreate = () => import('#controllers/recurring_invoice/crud/create')
const RecurringInvoiceUpdate = () => import('#controllers/recurring_invoice/crud/update')
const RecurringInvoiceDelete = () => import('#controllers/recurring_invoice/crud/delete')
const RecurringInvoiceGenerate = () => import('#controllers/recurring_invoice/operations/generate')
const RecurringInvoiceToggleActive = () =>
  import('#controllers/recurring_invoice/operations/toggle_active')

router
  .group(() => {
    router.get('/', [RecurringInvoiceList, 'handle'])
    router.get('/:id', [RecurringInvoiceShow, 'handle'])
    router.post('/', [RecurringInvoiceCreate, 'handle'])
    router.put('/:id', [RecurringInvoiceUpdate, 'handle'])
    router.delete('/:id', [RecurringInvoiceDelete, 'handle'])
    router.post('/:id/generate', [RecurringInvoiceGenerate, 'handle'])
    router.patch('/:id/toggle-active', [RecurringInvoiceToggleActive, 'handle'])
  })
  .prefix(API_PREFIX + '/recurring-invoices')
  .use(middleware.authOrApiKey())
  .use(middleware.vault())
