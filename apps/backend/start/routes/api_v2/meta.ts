import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2StackNoScope } from '#start/routes/api_v2/_pipeline'

const Ping = () => import('#controllers/api_v2/meta/ping')
const Session = () => import('#controllers/api_v2/meta/session')

router
  .group(() => {
    router.get('/ping', [Ping, 'handle']).as('apiV2.meta.ping')
    router.get('/session', [Session, 'handle']).as('apiV2.meta.session')
  })
  .prefix(API_V2_PREFIX)
  .use(apiV2StackNoScope())
