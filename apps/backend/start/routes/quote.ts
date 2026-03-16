import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const QuoteList = () => import('#controllers/quote/crud/list')
const QuoteShow = () => import('#controllers/quote/crud/show')
const QuoteCreate = () => import('#controllers/quote/crud/create')
const QuoteUpdate = () => import('#controllers/quote/crud/update')
const QuoteDelete = () => import('#controllers/quote/crud/delete')
const QuoteNextNumber = () => import('#controllers/quote/number/next_number')
const QuoteDocumentCount = () => import('#controllers/quote/number/document_count')
const QuoteSetNextNumber = () => import('#controllers/quote/number/set_next_number')
const QuotePdf = () => import('#controllers/quote/export/pdf')
const QuoteFacturXml = () => import('#controllers/quote/export/pdf').then((m) => ({ default: m.FacturXml }))
const QuoteUpdateStatus = () => import('#controllers/quote/operations/update_status')
const QuoteDuplicate = () => import('#controllers/quote/operations/duplicate')
const QuoteUpdateComment = () => import('#controllers/quote/operations/update_comment')

router
  .group(() => {
    router.get('/next-number', [QuoteNextNumber, 'handle'])
    router.get('/document-count', [QuoteDocumentCount, 'handle'])
    router.post('/set-next-number', [QuoteSetNextNumber, 'handle'])
    router.get('/', [QuoteList, 'handle'])
    router.get('/:id/pdf', [QuotePdf, 'handle'])
    router.get('/:id/facturx', [QuoteFacturXml, 'handle'])
    router.get('/:id', [QuoteShow, 'handle'])
    router.post('/', [QuoteCreate, 'handle'])
    router.patch('/:id/status', [QuoteUpdateStatus, 'handle'])
    router.patch('/:id/comment', [QuoteUpdateComment, 'handle'])
    router.post('/:id/duplicate', [QuoteDuplicate, 'handle'])
    router.put('/:id', [QuoteUpdate, 'handle'])
    router.delete('/:id', [QuoteDelete, 'handle'])
  })
  .prefix(API_PREFIX + '/quotes')
  .use(middleware.auth())
