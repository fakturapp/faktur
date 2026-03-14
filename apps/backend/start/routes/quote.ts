import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const QuoteList = () => import('#controllers/quote/list')
const QuoteShow = () => import('#controllers/quote/show')
const QuoteCreate = () => import('#controllers/quote/create')
const QuoteUpdate = () => import('#controllers/quote/update')
const QuoteDelete = () => import('#controllers/quote/delete')
const QuoteNextNumber = () => import('#controllers/quote/next_number')
const QuotePdf = () => import('#controllers/quote/pdf')

router
  .group(() => {
    router.get('/next-number', [QuoteNextNumber, 'handle'])
    router.get('/', [QuoteList, 'handle'])
    router.get('/:id/pdf', [QuotePdf, 'handle'])
    router.get('/:id', [QuoteShow, 'handle'])
    router.post('/', [QuoteCreate, 'handle'])
    router.put('/:id', [QuoteUpdate, 'handle'])
    router.delete('/:id', [QuoteDelete, 'handle'])
  })
  .prefix('/quotes')
  .use(middleware.auth())
