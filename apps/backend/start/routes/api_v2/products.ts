import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2Stack } from '#start/routes/api_v2/_pipeline'

const ProductsList = () => import('#controllers/api_v2/products/list')
const ProductsShow = () => import('#controllers/api_v2/products/show')
const ProductsCreate = () => import('#controllers/api_v2/products/create')
const ProductsUpdate = () => import('#controllers/api_v2/products/update')
const ProductsDestroy = () => import('#controllers/api_v2/products/destroy')

router
  .group(() => {
    router
      .get('/', [ProductsList, 'handle'])
      .as('apiV2.products.list')
      .use(apiV2Stack(['products:read']))
    router
      .get('/:id', [ProductsShow, 'handle'])
      .as('apiV2.products.show')
      .use(apiV2Stack(['products:read']))
    router
      .post('/', [ProductsCreate, 'handle'])
      .as('apiV2.products.create')
      .use(apiV2Stack(['products:write']))
    router
      .patch('/:id', [ProductsUpdate, 'handle'])
      .as('apiV2.products.update')
      .use(apiV2Stack(['products:write']))
    router
      .delete('/:id', [ProductsDestroy, 'handle'])
      .as('apiV2.products.destroy')
      .use(apiV2Stack(['products:delete']))
  })
  .prefix(API_V2_PREFIX + '/products')
