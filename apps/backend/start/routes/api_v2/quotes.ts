import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2Stack } from '#start/routes/api_v2/_pipeline'

const QuotesList = () => import('#controllers/api_v2/quotes/list')
const QuotesShow = () => import('#controllers/api_v2/quotes/show')

router
  .group(() => {
    router
      .get('/', [QuotesList, 'handle'])
      .as('apiV2.quotes.list')
      .use(apiV2Stack(['quotes:read']))
    router
      .get('/:id', [QuotesShow, 'handle'])
      .as('apiV2.quotes.show')
      .use(apiV2Stack(['quotes:read']))
  })
  .prefix(API_V2_PREFIX + '/quotes')
