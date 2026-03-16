import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const InvoiceList = () => import('#controllers/invoice/crud/list')
const InvoiceShow = () => import('#controllers/invoice/crud/show')
const InvoiceCreate = () => import('#controllers/invoice/crud/create')
const InvoiceUpdate = () => import('#controllers/invoice/crud/update')
const InvoiceDelete = () => import('#controllers/invoice/crud/delete')
const InvoiceNextNumber = () => import('#controllers/invoice/number/next_number')
const InvoiceDocumentCount = () => import('#controllers/invoice/number/document_count')
const InvoiceSetNextNumber = () => import('#controllers/invoice/number/set_next_number')
const InvoicePdf = () => import('#controllers/invoice/export/pdf')
const InvoiceConvertQuote = () => import('#controllers/invoice/operations/convert_quote')
const InvoiceUpdateStatus = () => import('#controllers/invoice/operations/update_status')
const InvoiceUnlinkQuote = () => import('#controllers/invoice/operations/unlink_quote')
const InvoiceDuplicate = () => import('#controllers/invoice/operations/duplicate')
const InvoiceUpdateComment = () => import('#controllers/invoice/operations/update_comment')

router
  .group(() => {
    router.get('/next-number', [InvoiceNextNumber, 'handle'])
    router.get('/document-count', [InvoiceDocumentCount, 'handle'])
    router.post('/set-next-number', [InvoiceSetNextNumber, 'handle'])
    router.get('/', [InvoiceList, 'handle'])
    router.get('/:id/pdf', [InvoicePdf, 'handle'])
    router.get('/:id', [InvoiceShow, 'handle'])
    router.post('/', [InvoiceCreate, 'handle'])
    router.post('/convert-quote/:id', [InvoiceConvertQuote, 'handle'])
    router.patch('/:id/status', [InvoiceUpdateStatus, 'handle'])
    router.patch('/:id/unlink-quote', [InvoiceUnlinkQuote, 'handle'])
    router.patch('/:id/comment', [InvoiceUpdateComment, 'handle'])
    router.post('/:id/duplicate', [InvoiceDuplicate, 'handle'])
    router.put('/:id', [InvoiceUpdate, 'handle'])
    router.delete('/:id', [InvoiceDelete, 'handle'])
  })
  .prefix(API_PREFIX + '/invoices')
  .use(middleware.auth())
