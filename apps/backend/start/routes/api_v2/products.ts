import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2Stack } from '#start/routes/api_v2/_pipeline'

const ProductsList = () => import('#controllers/api_v2/products/list')
const ProductsShow = () => import('#controllers/api_v2/products/show')
const ProductsCreate = () => import('#controllers/api_v2/products/create')
const ProductsUpdate = () => import('#controllers/api_v2/products/update')
const ProductsDestroy = () => import('#controllers/api_v2/products/destroy')

router
  .group(() => {
    router.get('/', [ProductsList, 'handle']).use(apiV2Stack(['products:read']))
    router.get('/:id', [ProductsShow, 'handle']).use(apiV2Stack(['products:read']))
    router.post('/', [ProductsCreate, 'handle']).use(apiV2Stack(['products:write']))
    router.patch('/:id', [ProductsUpdate, 'handle']).use(apiV2Stack(['products:write']))
    router.delete('/:id', [ProductsDestroy, 'handle']).use(apiV2Stack(['products:delete']))
  })
  .prefix(API_V2_PREFIX + '/products')
