import router from '@adonisjs/core/services/router'
import { API_V2_PREFIX, apiV2StackNoScope } from '#start/routes/api_v2/_pipeline'

const Ping = () => import('#controllers/api_v2/meta/ping')

router
  .group(() => {
    router.get('/ping', [Ping, 'handle'])
  })
  .prefix(API_V2_PREFIX)
  .use(apiV2StackNoScope())
