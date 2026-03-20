import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const ProductList = () => import('#controllers/product/list')
const ProductShow = () => import('#controllers/product/show')
const ProductCreate = () => import('#controllers/product/create')
const ProductUpdate = () => import('#controllers/product/update')
const ProductDelete = () => import('#controllers/product/delete')

router
  .group(() => {
    router.get('/', [ProductList, 'handle'])
    router.get('/:id', [ProductShow, 'handle'])
    router.post('/', [ProductCreate, 'handle'])
    router.put('/:id', [ProductUpdate, 'handle'])
    router.delete('/:id', [ProductDelete, 'handle'])
  })
  .prefix(API_PREFIX + '/products')
  .use(middleware.auth())
  .use(middleware.vault())
