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
      .use(apiV2Stack(['recurring_invoices:read']))
    router
      .get('/:id', [RecurringInvoicesShow, 'handle'])
      .use(apiV2Stack(['recurring_invoices:read']))
    router
      .post('/:id/pause', [RecurringInvoicesToggle, 'Pause'])
      .use(apiV2Stack(['recurring_invoices:write']))
    router
      .post('/:id/resume', [RecurringInvoicesToggle, 'Resume'])
      .use(apiV2Stack(['recurring_invoices:write']))
  })
  .prefix(API_V2_PREFIX + '/recurring-invoices')
