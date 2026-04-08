import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { API_PREFIX } from '#start/routes/_prefix'

const ClientList = () => import('#controllers/client/crud/list')
const ClientShow = () => import('#controllers/client/crud/show')
const ClientCreate = () => import('#controllers/client/crud/create')
const ClientUpdate = () => import('#controllers/client/crud/update')
const ClientDelete = () => import('#controllers/client/crud/delete')
const SearchSiren = () => import('#controllers/client/lookup/search_siren')
const ClientContactIndex = () => import('#controllers/client/contacts/index')
const ClientContactStore = () => import('#controllers/client/contacts/store')
const ClientContactUpdate = () => import('#controllers/client/contacts/update')
const ClientContactDestroy = () => import('#controllers/client/contacts/destroy')

router
  .group(() => {
    router.get('/search-siren', [SearchSiren, 'handle'])
    router.get('/', [ClientList, 'handle'])
    router.get('/:id', [ClientShow, 'handle'])
    router.post('/', [ClientCreate, 'handle'])
    router.put('/:id', [ClientUpdate, 'handle'])
    router.delete('/:id', [ClientDelete, 'handle'])

    router.get('/:clientId/contacts', [ClientContactIndex, 'handle'])
    router.post('/:clientId/contacts', [ClientContactStore, 'handle'])
    router.put('/:clientId/contacts/:id', [ClientContactUpdate, 'handle'])
    router.delete('/:clientId/contacts/:id', [ClientContactDestroy, 'handle'])
  })
  .prefix(API_PREFIX + '/clients')
  .use(middleware.auth())
  .use(middleware.vault())
