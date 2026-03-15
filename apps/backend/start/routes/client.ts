import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const ClientList = () => import('#controllers/client/crud/list')
const ClientShow = () => import('#controllers/client/crud/show')
const ClientCreate = () => import('#controllers/client/crud/create')
const ClientUpdate = () => import('#controllers/client/crud/update')
const ClientDelete = () => import('#controllers/client/crud/delete')
const SearchSiren = () => import('#controllers/client/lookup/search_siren')

router
  .group(() => {
    router.get('/search-siren', [SearchSiren, 'handle'])
    router.get('/', [ClientList, 'handle'])
    router.get('/:id', [ClientShow, 'handle'])
    router.post('/', [ClientCreate, 'handle'])
    router.put('/:id', [ClientUpdate, 'handle'])
    router.delete('/:id', [ClientDelete, 'handle'])
  })
  .prefix('/clients')
  .use(middleware.auth())
