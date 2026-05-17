import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2Stack } from '#start/routes/api_v2/_pipeline'

const ClientsList = () => import('#controllers/api_v2/clients/list')
const ClientsShow = () => import('#controllers/api_v2/clients/show')
const ClientsCreate = () => import('#controllers/api_v2/clients/create')
const ClientsUpdate = () => import('#controllers/api_v2/clients/update')
const ClientsDestroy = () => import('#controllers/api_v2/clients/destroy')

router
  .group(() => {
    router
      .get('/', [ClientsList, 'handle'])
      .as('apiV2.clients.list')
      .use(apiV2Stack(['clients:read']))
    router
      .get('/:id', [ClientsShow, 'handle'])
      .as('apiV2.clients.show')
      .use(apiV2Stack(['clients:read']))
    router
      .post('/', [ClientsCreate, 'handle'])
      .as('apiV2.clients.create')
      .use(apiV2Stack(['clients:write']))
    router
      .patch('/:id', [ClientsUpdate, 'handle'])
      .as('apiV2.clients.update')
      .use(apiV2Stack(['clients:write']))
    router
      .delete('/:id', [ClientsDestroy, 'handle'])
      .as('apiV2.clients.destroy')
      .use(apiV2Stack(['clients:delete']))
  })
  .prefix(API_V2_PREFIX + '/clients')
