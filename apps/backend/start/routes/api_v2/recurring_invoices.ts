import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2Stack } from '#start/routes/api_v2/_pipeline'

const RecurringInvoicesList = () => import('#controllers/api_v2/recurring_invoices/list')
const RecurringInvoicesShow = () => import('#controllers/api_v2/recurring_invoices/show')
const RecurringInvoicesToggle = () =>
  import('#controllers/api_v2/recurring_invoices/toggle_active')

router
  .group(() => {
    router
      .get('/', [RecurringInvoicesList, 'handle'])
      .as('apiV2.recurringInvoices.list')
      .use(apiV2Stack(['recurring_invoices:read']))
    router
      .get('/:id', [RecurringInvoicesShow, 'handle'])
      .as('apiV2.recurringInvoices.show')
      .use(apiV2Stack(['recurring_invoices:read']))
    router
      .post('/:id/pause', [RecurringInvoicesToggle, 'Pause'])
      .as('apiV2.recurringInvoices.pause')
      .use(apiV2Stack(['recurring_invoices:write']))
    router
      .post('/:id/resume', [RecurringInvoicesToggle, 'Resume'])
      .as('apiV2.recurringInvoices.resume')
      .use(apiV2Stack(['recurring_invoices:write']))
  })
  .prefix(API_V2_PREFIX + '/recurring-invoices')
