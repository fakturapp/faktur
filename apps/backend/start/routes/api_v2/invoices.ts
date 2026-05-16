import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2Stack } from '#start/routes/api_v2/_pipeline'

const InvoicesList = () => import('#controllers/api_v2/invoices/list')
const InvoicesShow = () => import('#controllers/api_v2/invoices/show')
const InvoicesCreate = () => import('#controllers/api_v2/invoices/create')
const InvoicesMarkPaid = () => import('#controllers/api_v2/invoices/mark_paid')
const InvoicesDuplicate = () => import('#controllers/api_v2/invoices/duplicate')
const InvoicesDestroy = () => import('#controllers/api_v2/invoices/destroy')

router
  .group(() => {
    router.get('/', [InvoicesList, 'handle']).use(apiV2Stack(['invoices:read']))
    router.get('/:id', [InvoicesShow, 'handle']).use(apiV2Stack(['invoices:read']))
    router.post('/', [InvoicesCreate, 'handle']).use(apiV2Stack(['invoices:write']))
    router
      .post('/:id/mark-paid', [InvoicesMarkPaid, 'handle'])
      .use(apiV2Stack(['invoices:write']))
    router
      .post('/:id/duplicate', [InvoicesDuplicate, 'handle'])
      .use(apiV2Stack(['invoices:write']))
    router.delete('/:id', [InvoicesDestroy, 'handle']).use(apiV2Stack(['invoices:delete']))
  })
  .prefix(API_V2_PREFIX + '/invoices')
