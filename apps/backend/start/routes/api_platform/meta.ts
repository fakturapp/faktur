import router from '@adonisjs/core/services/router'
import { API_PLATFORM_PREFIX, apiPlatformStackNoScope } from '#start/routes/api_platform/_pipeline'

const Ping = () => import('#controllers/api_platform/meta/ping')
const Session = () => import('#controllers/api_platform/meta/session')
const Usage = () => import('#controllers/api_platform/meta/usage')

router
  .group(() => {
    router.get('/ping', [Ping, 'handle']).as('apiPlatform.meta.ping')
    router.get('/session', [Session, 'handle']).as('apiPlatform.meta.session')
    router.get('/usage', [Usage, 'handle']).as('apiPlatform.meta.usage')
  })
  .prefix(API_PLATFORM_PREFIX)
  .use(apiPlatformStackNoScope())
